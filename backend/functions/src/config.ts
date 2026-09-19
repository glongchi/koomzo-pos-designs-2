/** Runtime configuration, read from env (see .env.example). */
export const CONFIG = {
  project: process.env.GCLOUD_PROJECT || 'koomzo-workflow',
  region: process.env.REGION || 'us-central1',
  stepTopic: process.env.STEP_TOPIC || 'workflow-steps',
  tasksQueue: process.env.TASKS_QUEUE || 'workflow-timers',
  tasksLocation: process.env.TASKS_LOCATION || 'us-central1',
  functionsBaseUrl:
    process.env.FUNCTIONS_BASE_URL ||
    'https://us-central1-koomzo-workflow.cloudfunctions.net',
  webhookSecret: process.env.WEBHOOK_SIGNING_SECRET || 'dev-only-change-me',
};

/** Firestore collection names — single source of truth. */
export const COL = {
  workflows: 'workflows',
  versions: 'versions', // subcollection of a workflow
  triggers: 'triggers',
  connections: 'connections',
  runs: 'runs',
  steps: 'steps', // subcollection of a run
  tasks: 'tasks',
} as const;
