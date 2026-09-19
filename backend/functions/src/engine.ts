import type {
  WorkflowRun, WorkflowVersion, Step, StepContext, StepResult, StepExecution, NextRef,
} from './domain';
import { db, nowIso, FieldValue } from './firestore';
import { COL } from './config';
import { getExecutor } from './executors';
import { resolveExpr } from './util/bindings';
import { loadSecret } from './util/secrets';
import { enqueueStep } from './util/queue';
import { scheduleTask } from './util/tasks';

/** Load the immutable published version a run is pinned to. */
async function loadVersion(workflowId: string, version: number): Promise<WorkflowVersion> {
  const snap = await db.doc(`${COL.workflows}/${workflowId}/${COL.versions}/${version}`).get();
  if (!snap.exists) throw new Error(`version ${workflowId}@${version} not found`);
  return snap.data() as WorkflowVersion;
}

const findStep = (steps: Step[], id: string) => steps.find((s) => s.id === id);

/** Resolve a NextRef list to the concrete next step ids for the taken branch. */
export function nextIds(step: Step, branch?: 'yes' | 'no' | 'out'): string[] {
  const out: string[] = [];
  for (const ref of step.next as NextRef[]) {
    if (typeof ref === 'string') { if (!branch || branch === 'out') out.push(ref); }
    else if (branch === 'yes' && 'yes' in ref) out.push(ref.yes);
    else if (branch === 'no' && 'no' in ref) out.push(ref.no);
  }
  return out;
}

/**
 * Execute ONE step of a run. Called by the Pub/Sub stepRunner and by
 * resume paths (timers, human completion). Idempotent per (runId, stepId):
 * safe to redeliver.
 */
export async function runStep(runId: string, stepId: string): Promise<void> {
  const runRef = db.doc(`${COL.runs}/${runId}`);
  const runSnap = await runRef.get();
  if (!runSnap.exists) return;
  const run = runSnap.data() as WorkflowRun;
  if (run.status === 'completed' || run.status === 'failed' || run.status === 'canceled') return;

  const version = await loadVersion(run.workflowId, run.version);
  const step = findStep(version.steps, stepId);
  if (!step) return;

  const execRef = runRef.collection(COL.steps).doc();
  const startedAt = nowIso();

  const ctx: StepContext = {
    run,
    step,
    resolve: (expr) => resolveExpr(expr, run.context),
    secret: (ref) => loadSecret(ref),
    log: (msg, data) => console.log(`[${runId}/${stepId}] ${msg}`, data ?? ''),
  };

  let result: StepResult;
  const executor = getExecutor(step.type);
  try {
    // Trigger nodes have no executor: just flow to their next.
    result = executor ? await executor(ctx) : { kind: 'continue' };
  } catch (err) {
    result = { kind: 'fail', message: (err as Error).message, retryable: true };
  }

  await applyResult(run, step, result, execRef, startedAt);
}

async function applyResult(
  run: WorkflowRun,
  step: Step,
  result: StepResult,
  execRef: FirebaseFirestore.DocumentReference,
  startedAt: string
): Promise<void> {
  const runRef = db.doc(`${COL.runs}/${run.id}`);
  const base: Partial<StepExecution> = {
    id: execRef.id, runId: run.id, stepId: step.id, type: step.type,
    attempts: 1, startedAt, finishedAt: nowIso(),
  };

  switch (result.kind) {
    case 'continue': {
      await execRef.set({ ...base, status: 'succeeded', output: result.output, branchTaken: result.branch });
      if (result.output) {
        await runRef.update({ context: { ...run.context, ...result.output } });
        run.context = { ...run.context, ...result.output };
      }
      const nexts = nextIds(step, result.branch);
      await advance(run, step.id, nexts);
      break;
    }
    case 'wait': {
      await execRef.set({ ...base, status: 'waiting' });
      await runRef.update({ status: 'waiting' });
      if (result.reason === 'delay' && result.resumeAt) {
        await scheduleTask('resumeDelay', { runId: run.id, stepId: step.id }, result.resumeAt);
      }
      // human / callback waits are resumed by their respective callables.
      break;
    }
    case 'end': {
      await execRef.set({ ...base, status: 'succeeded' });
      await finishBranch(run, step.id, true);
      break;
    }
    case 'fail': {
      await execRef.set({
        ...base, status: 'failed',
        error: { message: result.message, retryable: !!result.retryable, code: 'STEP_FAILED' },
      });
      if (result.retryable) throw new Error(result.message); // let Pub/Sub redeliver
      await runRef.update({
        status: 'failed', finishedAt: nowIso(),
        error: { stepId: step.id, message: result.message },
      });
      break;
    }
  }
}

/** Move the cursor off `fromId` onto `nexts`, enqueuing each. */
async function advance(run: WorkflowRun, fromId: string, nexts: string[]): Promise<void> {
  const runRef = db.doc(`${COL.runs}/${run.id}`);
  const cursor = new Set(run.cursor || []);
  cursor.delete(fromId);
  nexts.forEach((n) => cursor.add(n));
  await runRef.update({ cursor: [...cursor] });
  if (nexts.length === 0 && cursor.size === 0) {
    await runRef.update({ status: 'completed', finishedAt: nowIso() });
    return;
  }
  await Promise.all(nexts.map((n) => enqueueStep(run.id, n)));
}

async function finishBranch(run: WorkflowRun, fromId: string, _ended: boolean): Promise<void> {
  const runRef = db.doc(`${COL.runs}/${run.id}`);
  const cursor = new Set(run.cursor || []);
  cursor.delete(fromId);
  await runRef.update({ cursor: [...cursor] });
  if (cursor.size === 0) await runRef.update({ status: 'completed', finishedAt: nowIso() });
}

void FieldValue;
