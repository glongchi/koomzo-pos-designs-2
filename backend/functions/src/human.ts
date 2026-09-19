import type { HumanTask, WorkflowRun } from './domain';
import { db, nowIso } from './firestore';
import { COL } from './config';
import { runStep, nextIds } from './engine';
import { enqueueStep } from './util/queue';
import type { WorkflowVersion, Step } from './domain';

/**
 * Resolve a human task and resume its parked run. Shared by the
 * submitForm / decideApproval / completeTask callables.
 */
export async function resolveTask(
  taskId: string,
  resolution: { status: HumanTask['status']; result?: Record<string, unknown>; branch?: 'yes' | 'no' | 'out' },
  resolvedBy: string
): Promise<void> {
  const taskRef = db.doc(`${COL.tasks}/${taskId}`);
  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) throw new Error('Task not found.');
  const task = taskSnap.data() as HumanTask;
  if (task.status !== 'open') return; // already resolved (idempotent)

  await taskRef.update({ status: resolution.status, result: resolution.result || null, resolvedAt: nowIso(), resolvedBy });

  const runRef = db.doc(`${COL.runs}/${task.runId}`);
  const runSnap = await runRef.get();
  if (!runSnap.exists) return;
  const run = runSnap.data() as WorkflowRun;

  // Merge the task result into run context, then advance from the parked step.
  const context = { ...run.context, [task.stepId]: resolution.result, task: resolution.result };
  await runRef.update({ status: 'running', context });

  const version = (await db.doc(`${COL.workflows}/${run.workflowId}/${COL.versions}/${run.version}`).get()).data() as WorkflowVersion;
  const step = version.steps.find((s) => s.id === task.stepId) as Step;
  const branch = resolution.branch || (task.kind === 'approval' ? (resolution.status === 'approved' ? 'yes' : 'no') : 'out');
  const nexts = nextIds(step, branch);

  const cursor = new Set(run.cursor || []);
  cursor.delete(task.stepId);
  nexts.forEach((n) => cursor.add(n));
  await runRef.update({ cursor: [...cursor] });

  if (nexts.length === 0 && cursor.size === 0) {
    await runRef.update({ status: 'completed', finishedAt: nowIso() });
    return;
  }
  await Promise.all(nexts.map((n) => enqueueStep(run.id, n)));
}

/** Fired by a Cloud Task when an SLA deadline passes with the task still open. */
export async function expireTask(taskId: string): Promise<void> {
  const taskRef = db.doc(`${COL.tasks}/${taskId}`);
  const snap = await taskRef.get();
  if (!snap.exists) return;
  const task = snap.data() as HumanTask;
  if (task.status !== 'open') return;
  await taskRef.update({ status: 'expired', resolvedAt: nowIso() });
  // Escalation policy could resume the run down a timeout branch here.
  void runStep;
}
