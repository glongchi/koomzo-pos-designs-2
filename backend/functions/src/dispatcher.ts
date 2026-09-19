import type { WorkflowRun, WorkflowVersion, Step, StepType, TriggerRegistration } from './domain';
import { db, nowIso } from './firestore';
import { COL } from './config';
import { resolveExpr, toNumber } from './util/bindings';
import { enqueueStep } from './util/queue';

/**
 * Given an inbound event, find matching enabled triggers and start a run
 * for each. Returns the created run ids.
 */
export async function dispatch(
  type: StepType,
  payload: Record<string, unknown>,
  match?: (t: TriggerRegistration) => boolean
): Promise<string[]> {
  const snap = await db
    .collection(COL.triggers)
    .where('type', '==', type)
    .where('enabled', '==', true)
    .get();

  const runIds: string[] = [];
  for (const doc of snap.docs) {
    const trig = doc.data() as TriggerRegistration;
    if (match && !match(trig)) continue;
    if (!passesFilter(trig, payload)) continue;
    runIds.push(await startRun(trig, payload));
  }
  return runIds;
}

/** Optional per-trigger filter, e.g. trig.order with amount threshold. */
function passesFilter(trig: TriggerRegistration, payload: Record<string, unknown>): boolean {
  const m = trig.match as { field?: string; op?: string; value?: string };
  if (!m?.field || !m.op) return true;
  const left = toNumber(resolveExpr(`{{${m.field}}}`, payload));
  const right = toNumber(m.value);
  switch (m.op) {
    case '>': return left > right;
    case '<': return left < right;
    case '≥': return left >= right;
    case '≤': return left <= right;
    case '=': return left === right;
    case '≠': return left !== right;
    default: return true;
  }
}

async function startRun(trig: TriggerRegistration, payload: Record<string, unknown>): Promise<string> {
  const versionSnap = await db
    .doc(`${COL.workflows}/${trig.workflowId}/${COL.versions}/${trig.version}`)
    .get();
  const version = versionSnap.data() as WorkflowVersion;
  const trigger = version.steps.find((s) => s.id === trig.stepId) as Step;

  const runRef = db.collection(COL.runs).doc();
  const run: WorkflowRun = {
    id: runRef.id,
    workflowId: trig.workflowId,
    version: trig.version,
    status: 'running',
    trigger: { stepId: trig.stepId, type: trig.type, payload },
    context: { ...payload, trigger: payload },
    cursor: [trig.stepId],
    startedAt: nowIso(),
    orgId: trig.orgId,
  };
  await runRef.set(run);
  // Enqueue the trigger node itself; the engine flows through it to `next`.
  await enqueueStep(runRef.id, trig.stepId);
  return runRef.id;
}
