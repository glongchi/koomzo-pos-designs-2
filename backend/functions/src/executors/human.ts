import type { StepContext, StepResult, HumanTask } from '../domain';
import { db, nowIso } from '../firestore';
import { COL, CONFIG } from '../config';
import { resolveDeep } from '../util/bindings';
import { scheduleTask } from '../util/tasks';

/**
 * Human steps (form / approval / task) create a /tasks doc and PARK the run.
 * The run resumes when a completion callable resolves the task
 * (see completeTask in ../human.ts).
 */
export async function human(kind: 'form' | 'approval' | 'task') {
  return async (ctx: StepContext): Promise<StepResult> => {
    const cfg = resolveDeep(ctx.step.config as Record<string, string>, ctx.run.context);
    const ref = db.collection(COL.tasks).doc();

    const slaAt = parseSla(cfg.sla || cfg.due);
    const task: HumanTask = {
      id: ref.id,
      runId: ctx.run.id,
      stepId: ctx.step.id,
      kind,
      status: 'open',
      assignedTo: cfg.approver || cfg.assignee || 'unassigned',
      title: ctx.step.name,
      formRef: cfg.formRef,
      slaAt,
      createdAt: nowIso(),
      orgId: ctx.run.orgId,
    };
    await ref.set(task);

    if (slaAt) {
      await scheduleTask('slaBreach', { taskId: ref.id }, slaAt);
    }
    ctx.log(`human(${kind}) task ${ref.id} assigned to ${task.assignedTo}`);
    return { kind: 'wait', reason: 'human', taskId: ref.id };
  };
}

/** "24 hours" / "2 days" -> ISO deadline from now. */
function parseSla(sla?: string): string | undefined {
  if (!sla) return undefined;
  const m = sla.match(/(\d+)\s*(hour|day|minute)/i);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const ms = unit === 'day' ? 86_400_000 : unit === 'hour' ? 3_600_000 : 60_000;
  return new Date(Date.now() + n * ms).toISOString();
}

void CONFIG;
