import type { StepContext, StepResult } from '../domain';
import { toNumber } from '../util/bindings';

/** condition — evaluate field OP value against run context, pick yes/no branch. */
export async function condition(ctx: StepContext): Promise<StepResult> {
  const cfg = (ctx.step.config || {}) as { field: string; op: string; value: string };
  const left = ctx.resolve(`{{${cfg.field}}}`);
  const right = cfg.value;
  const pass = compare(left, cfg.op, right);
  ctx.log(`condition ${cfg.field} ${cfg.op} ${right} -> ${pass}`);
  return { kind: 'continue', branch: pass ? 'yes' : 'no' };
}

function compare(left: unknown, op: string, right: string): boolean {
  const ln = toNumber(left);
  const rn = toNumber(right);
  const numeric = !Number.isNaN(parseFloat(String(right)));
  switch (op) {
    case '=': return numeric ? ln === rn : String(left) === right;
    case '≠': return numeric ? ln !== rn : String(left) !== right;
    case '>': return ln > rn;
    case '<': return ln < rn;
    case '≥': return ln >= rn;
    case '≤': return ln <= rn;
    default: return false;
  }
}

/** delay — park the run; a Cloud Task resumes it at the computed time. */
export async function delay(ctx: StepContext): Promise<StepResult> {
  const cfg = (ctx.step.config || {}) as { amount: string; unit: 'minutes' | 'hours' | 'days' };
  const ms = { minutes: 60_000, hours: 3_600_000, days: 86_400_000 }[cfg.unit] || 60_000;
  const resumeAt = new Date(Date.now() + toNumber(cfg.amount) * ms).toISOString();
  return { kind: 'wait', reason: 'delay', resumeAt };
}

/** end — terminate this branch of the run. */
export async function end(): Promise<StepResult> {
  return { kind: 'end' };
}
