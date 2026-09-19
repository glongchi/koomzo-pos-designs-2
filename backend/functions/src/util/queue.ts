import { PubSub } from '@google-cloud/pubsub';
import { CONFIG } from '../config';

const pubsub = new PubSub();

/** Enqueue a step for the stepRunner. One message = one step of one run. */
export async function enqueueStep(runId: string, stepId: string): Promise<void> {
  await pubsub.topic(CONFIG.stepTopic).publishMessage({ json: { runId, stepId } });
}
