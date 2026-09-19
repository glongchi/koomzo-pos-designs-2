import type { WorkflowDefinition, WorkflowVersion, Step, TriggerRegistration, StepType } from './domain';
import { db, nowIso } from './firestore';
import { COL } from './config';

/** Validate a workflow graph before it can be published. Throws on error. */
export function validateWorkflow(steps: Step[]): void {
  if (!steps.length) throw new Error('Workflow has no steps.');
  const ids = new Set(steps.map((s) => s.id));
  const triggers = steps.filter((s) => s.type.startsWith('trig.'));
  if (triggers.length !== 1) throw new Error('Workflow must have exactly one trigger.');

  for (const s of steps) {
    for (const ref of s.next) {
      const target = typeof ref === 'string' ? ref : ('yes' in ref ? ref.yes : ref.no);
      if (!ids.has(target)) throw new Error(`Step "${s.id}" points to missing step "${target}".`);
    }
    if (s.type === 'condition') {
      const hasYes = s.next.some((r) => typeof r !== 'string' && 'yes' in r);
      const hasNo = s.next.some((r) => typeof r !== 'string' && 'no' in r);
      if (!hasYes || !hasNo) throw new Error(`Condition "${s.id}" must wire both yes and no branches.`);
    }
  }
}

/**
 * Publish a draft: validate, write an immutable version snapshot, flip the
 * definition to live, and reconcile the trigger registry. In-flight runs
 * keep executing whatever version they started on.
 */
export async function publish(workflowId: string, publishedBy: string): Promise<WorkflowVersion> {
  const defRef = db.doc(`${COL.workflows}/${workflowId}`);
  const defSnap = await defRef.get();
  if (!defSnap.exists) throw new Error('Workflow not found.');
  const def = defSnap.data() as WorkflowDefinition;

  validateWorkflow(def.steps);
  const version = (def.version || 0) + 1;

  const snapshot: WorkflowVersion = {
    id: `${workflowId}@${version}`,
    workflowId,
    version,
    name: def.name,
    steps: def.steps,
    publishedBy,
    publishedAt: nowIso(),
  };

  const batch = db.batch();
  batch.set(defRef.collection(COL.versions).doc(String(version)), snapshot);
  batch.update(defRef, { status: 'live', version, publishedAt: nowIso(), updatedBy: publishedBy, updatedAt: nowIso() });
  await batch.commit();

  await reconcileTriggers(def, version);
  return snapshot;
}

/** Disable old trigger regs for this workflow; register the live version's. */
async function reconcileTriggers(def: WorkflowDefinition, version: number): Promise<void> {
  const existing = await db.collection(COL.triggers).where('workflowId', '==', def.id).get();
  const batch = db.batch();
  existing.docs.forEach((d) => batch.update(d.ref, { enabled: false }));

  for (const step of def.steps.filter((s) => s.type.startsWith('trig.'))) {
    const ref = db.collection(COL.triggers).doc(`${def.id}_${step.id}`);
    const reg: TriggerRegistration = {
      id: ref.id,
      workflowId: def.id,
      version,
      stepId: step.id,
      type: step.type as Extract<StepType, `trig.${string}`>,
      match: (step.config as Record<string, unknown>) || {},
      enabled: true,
      orgId: def.orgId,
    };
    batch.set(ref, reg);
  }
  await batch.commit();
}
