/**
 * Koomzo POS — Workflow Orchestrator runtime
 * Cloud Functions entry points. Grouped by concern:
 *   authoring   — saveWorkflow, publishWorkflow (callable)
 *   ingress     — onOrderPlaced, webhookIn, scheduleTick
 *   engine      — stepRunner (Pub/Sub)
 *   human       — submitForm, decideApproval, completeTask (callable)
 *   timers      — resumeDelay, slaBreach (Cloud Tasks HTTP callbacks)
 */
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as crypto from 'crypto';

import { CONFIG } from './config';
import { db, nowIso } from './firestore';
import { COL } from './config';
import { validateWorkflow, publish } from './authoring';
import { dispatch } from './dispatcher';
import { runStep } from './engine';
import { resolveTask, expireTask } from './human';
import type { WorkflowDefinition } from './domain';

const region = CONFIG.region;
const requireAuth = (ctx: { auth?: { uid: string; token: Record<string, unknown> } }) => {
  if (!ctx.auth) throw new HttpsError('unauthenticated', 'Sign-in required.');
  return { uid: ctx.auth.uid, orgId: String(ctx.auth.token.orgId || '') };
};

/* ============================================================ AUTHORING */

export const saveWorkflow = onCall({ region }, async (req) => {
  const { uid, orgId } = requireAuth(req);
  const { workflowId, name, steps } = req.data as { workflowId?: string; name: string; steps: WorkflowDefinition['steps'] };
  validateWorkflow(steps); // structural check; publish enforces the full rules
  const ref = workflowId ? db.doc(`${COL.workflows}/${workflowId}`) : db.collection(COL.workflows).doc();
  const exists = (await ref.get()).exists;
  const patch: Partial<WorkflowDefinition> = {
    id: ref.id, name, steps, status: 'draft', orgId, updatedBy: uid, updatedAt: nowIso(),
  };
  if (!exists) Object.assign(patch, { version: 0, createdBy: uid, createdAt: nowIso() });
  await ref.set(patch, { merge: true });
  return { workflowId: ref.id };
});

export const publishWorkflow = onCall({ region }, async (req) => {
  const { uid } = requireAuth(req);
  const { workflowId } = req.data as { workflowId: string };
  const version = await publish(workflowId, uid);
  return { version: version.version };
});

/* ============================================================ INGRESS */

// POS order written -> start any order-triggered workflows.
export const onOrderPlaced = onDocumentCreated({ region, document: 'orders/{orderId}' }, async (event) => {
  const order = event.data?.data();
  if (!order) return;
  await dispatch('trig.order', { order }, (t) => t.orgId === order.orgId);
});

// Inbound webhook: /webhookIn/:workflowId/:stepId  (HMAC-verified).
export const webhookIn = onRequest({ region }, async (req, res) => {
  const [, workflowId, stepId] = req.path.split('/').filter(Boolean);
  const sig = req.get('x-koomzo-signature') || '';
  const expected = crypto.createHmac('sha256', CONFIG.webhookSecret).update(req.rawBody).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    res.status(401).send('bad signature');
    return;
  }
  const runIds = await dispatch('trig.webhook', { body: req.body, headers: req.headers }, (t) => t.workflowId === workflowId && t.stepId === stepId);
  res.json({ started: runIds });
});

// Cron tick (every 5 min) -> match schedule triggers whose time is due.
export const scheduleTick = onSchedule({ region, schedule: 'every 5 minutes' }, async () => {
  await dispatch('trig.schedule', { firedAt: nowIso() });
});

/* ============================================================ ENGINE */

export const stepRunner = onMessagePublished({ region, topic: CONFIG.stepTopic, retry: true }, async (event) => {
  const { runId, stepId } = event.data.message.json as { runId: string; stepId: string };
  await runStep(runId, stepId); // throws on retryable failure -> Pub/Sub redelivers
});

/* ============================================================ HUMAN */

export const submitForm = onCall({ region }, async (req) => {
  const { uid } = requireAuth(req);
  const { taskId, data } = req.data as { taskId: string; data: Record<string, unknown> };
  await resolveTask(taskId, { status: 'submitted', result: data }, uid);
  return { ok: true };
});

export const decideApproval = onCall({ region }, async (req) => {
  const { uid } = requireAuth(req);
  const { taskId, approved, note } = req.data as { taskId: string; approved: boolean; note?: string };
  await resolveTask(taskId, { status: approved ? 'approved' : 'rejected', result: { approved, note }, branch: approved ? 'yes' : 'no' }, uid);
  return { ok: true };
});

export const completeTask = onCall({ region }, async (req) => {
  const { uid } = requireAuth(req);
  const { taskId, result } = req.data as { taskId: string; result?: Record<string, unknown> };
  await resolveTask(taskId, { status: 'submitted', result }, uid);
  return { ok: true };
});

/* ============================================================ TIMERS (Cloud Tasks) */

export const resumeDelay = onRequest({ region }, async (req, res) => {
  const { runId, stepId } = req.body as { runId: string; stepId: string };
  // The delayed step already logged 'waiting'; advance from it now.
  const runRef = db.doc(`${COL.runs}/${runId}`);
  await runRef.update({ status: 'running' });
  const run = (await runRef.get()).data();
  const version = run
    ? (await db.doc(`${COL.workflows}/${run.workflowId}/${COL.versions}/${run.version}`).get()).data()
    : null;
  const step = version?.steps.find((s: { id: string }) => s.id === stepId);
  if (step) {
    const { nextIds } = await import('./engine');
    const { enqueueStep } = await import('./util/queue');
    await Promise.all(nextIds(step, 'out').map((n: string) => enqueueStep(runId, n)));
  }
  res.json({ ok: true });
});

export const slaBreach = onRequest({ region }, async (req, res) => {
  const { taskId } = req.body as { taskId: string };
  await expireTask(taskId);
  res.json({ ok: true });
});
