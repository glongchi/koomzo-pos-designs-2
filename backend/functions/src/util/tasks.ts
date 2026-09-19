import { CloudTasksClient } from '@google-cloud/tasks';
import { CONFIG } from '../config';

const client = new CloudTasksClient();

/**
 * Schedule an HTTPS callback (delay resume or SLA breach) at an exact time
 * via Cloud Tasks. `path` is appended to FUNCTIONS_BASE_URL.
 */
export async function scheduleTask(
  path: string,
  payload: Record<string, unknown>,
  runAtIso: string
): Promise<void> {
  const parent = client.queuePath(CONFIG.project, CONFIG.tasksLocation, CONFIG.tasksQueue);
  const scheduleSeconds = Math.max(0, Math.floor(new Date(runAtIso).getTime() / 1000));
  await client.createTask({
    parent,
    task: {
      scheduleTime: { seconds: scheduleSeconds },
      httpRequest: {
        httpMethod: 'POST',
        url: `${CONFIG.functionsBaseUrl}/${path}`,
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      },
    },
  });
}
