import type { ExecutorRegistry, StepType } from '../domain';
import { condition, delay, end } from './logic';
import { http } from './http';
import { email, slack, payment, crm, sheets } from './integrations';
import { human } from './human';

/**
 * Central dispatch table: StepType -> handler. Trigger steps have no
 * executor (they only start runs); the engine treats a trigger as the
 * entry node and simply advances to its `next`.
 */
export const executors: ExecutorRegistry = {
  // logic
  condition,
  delay,
  end,
  // integrations
  http,
  email,
  slack,
  payment,
  crm,
  sheets,
  // human-in-the-loop
  form: human('form'),
  approval: human('approval'),
  task: human('task'),
};

export function getExecutor(type: StepType) {
  return executors[type];
}
