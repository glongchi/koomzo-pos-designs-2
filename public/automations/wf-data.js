/* Koomzo POS — shared data for the Automations admin list + Run history screens.
   Plain JS (loaded before the Babel app scripts). Everything is attached to window. */

/* ---- trigger meta (icon + color per trigger type) ---- */
const TRIGGERS = {
  order:    { label: 'New order',      icon: 'cart-outline',          color: 'var(--kz-success)', wash: 'var(--kz-success-wash)' },
  form:     { label: 'Form submitted', icon: 'document-text-outline', color: 'var(--kz-primary)', wash: 'var(--kz-primary-wash)' },
  schedule: { label: 'On schedule',    icon: 'time-outline',          color: 'var(--kz-info)',    wash: 'var(--kz-info-wash)' },
  webhook:  { label: 'Webhook',        icon: 'flash-outline',         color: 'var(--kz-warning)', wash: 'var(--kz-warning-wash)' },
};

/* ---- workflow publish status meta ---- */
const WF_STATUS = {
  live:   { label: 'Live',   color: '#1f7a44', bg: 'var(--kz-success-wash)', bd: '#bfe6cd', dot: 'var(--kz-success)' },
  draft:  { label: 'Draft',  color: '#9a7016', bg: 'var(--kz-warning-wash)', bd: '#f0d9a8', dot: 'var(--kz-warning)' },
  paused: { label: 'Paused', color: 'var(--kz-muted)', bg: 'var(--kz-surface-2)', bd: 'var(--kz-border)', dot: 'var(--kz-muted-3)' },
};

/* ---- run status meta ---- */
const RUN_STATUS = {
  running:   { label: 'Running',   color: 'var(--kz-primary)', bg: 'var(--kz-primary-wash)', bd: 'var(--kz-primary-tint)', dot: 'var(--kz-primary)', icon: 'sync-outline' },
  waiting:   { label: 'Waiting',   color: '#9a7016', bg: 'var(--kz-warning-wash)', bd: '#f0d9a8', dot: 'var(--kz-warning)', icon: 'hourglass-outline' },
  completed: { label: 'Completed', color: '#1f7a44', bg: 'var(--kz-success-wash)', bd: '#bfe6cd', dot: 'var(--kz-success)', icon: 'checkmark-circle-outline' },
  failed:    { label: 'Failed',    color: 'var(--kz-discount)', bg: 'var(--kz-discount-wash)', bd: '#f3c3b4', dot: 'var(--kz-discount)', icon: 'alert-circle-outline' },
};

/* ---- step status meta (used in run detail timeline) ---- */
const STEP_STATUS = {
  done:    { color: 'var(--kz-success)', label: 'Done' },
  running: { color: 'var(--kz-primary)', label: 'Running' },
  waiting: { color: 'var(--kz-warning)', label: 'Waiting' },
  pending: { color: 'var(--kz-muted-3)', label: 'Pending' },
  failed:  { color: 'var(--kz-discount)', label: 'Failed' },
  skipped: { color: 'var(--kz-muted-3)', label: 'Skipped' },
};

/* short helper for building a step */
const S = (icon, label, status, at, dur, detail) => ({ icon, label, status, at, dur, detail });

/* ============================================================
   WORKFLOWS — authored automations
   ============================================================ */
const WORKFLOWS = [
  { id: 'wf1', name: 'Wholesale order fulfillment', desc: 'Route large orders through finance approval, then sync to ERP and notify the warehouse.',
    status: 'live', trigger: 'order', steps: 9, runs30d: 214, successRate: 98.6, avgDur: '2m 40s', lastRun: '4 min ago', updated: 'Jun 30, 2026', owner: 'Mireille R.' },
  { id: 'wf2', name: 'New customer onboarding', desc: 'Collect details on first purchase, create a CRM contact and send the welcome sequence.',
    status: 'live', trigger: 'form', steps: 6, runs30d: 1032, successRate: 99.4, avgDur: '38s', lastRun: '12 min ago', updated: 'Jun 28, 2026', owner: 'Danielle N.' },
  { id: 'wf3', name: 'Low-stock reorder', desc: 'Every morning, scan inventory and raise purchase orders for items below par level.',
    status: 'live', trigger: 'schedule', steps: 5, runs30d: 30, successRate: 96.7, avgDur: '1m 12s', lastRun: 'Today 06:00', updated: 'Jun 21, 2026', owner: 'Samuel T.' },
  { id: 'wf4', name: 'Refund approval', desc: 'Send refunds over 36 000 F to a manager for sign-off before issuing the credit.',
    status: 'paused', trigger: 'form', steps: 7, runs30d: 61, successRate: 94.1, avgDur: '5m 08s', lastRun: '2 days ago', updated: 'Jun 15, 2026', owner: 'Mireille R.' },
  { id: 'wf5', name: 'Daily sales digest', desc: 'Compile the previous day of sales and post the summary to the leadership channel.',
    status: 'live', trigger: 'schedule', steps: 4, runs30d: 30, successRate: 100, avgDur: '22s', lastRun: 'Today 08:00', updated: 'Jun 10, 2026', owner: 'Danielle N.' },
  { id: 'wf6', name: 'VIP loyalty reward', desc: 'When a VIP member checks out, award bonus points and email a personal thank-you.',
    status: 'live', trigger: 'order', steps: 6, runs30d: 143, successRate: 97.9, avgDur: '46s', lastRun: '31 min ago', updated: 'Jun 08, 2026', owner: 'Samuel T.' },
  { id: 'wf7', name: 'Abandoned cart nudge', desc: 'Catch a dropped online cart via webhook and follow up with a reminder after 1 hour.',
    status: 'draft', trigger: 'webhook', steps: 5, runs30d: 0, successRate: null, avgDur: '—', lastRun: 'Never', updated: 'Jul 1, 2026', owner: 'You' },
  { id: 'wf8', name: 'Staff shift reminder', desc: 'Message the roster the evening before each shift with times and assigned stations.',
    status: 'draft', trigger: 'schedule', steps: 3, runs30d: 0, successRate: null, avgDur: '—', lastRun: 'Never', updated: 'Jun 27, 2026', owner: 'You' },
];

/* ============================================================
   RUNS — execution history (in-progress + completed in one log)
   ============================================================ */
const RUNS = [
  { id: 'R-4821', wfId: 'wf1', wf: 'Wholesale order fulfillment', trigger: 'order', entity: 'Order #1042 · 446 500 F',
    startedAt: 'Today · 09:42', status: 'running', stepsDone: 3, stepsTotal: 9, elapsed: '1m 12s', currentStep: 'Finance approval', initiator: 'POS · Caisse 2',
    steps: [
      S('cart-outline', 'Order over 180 000 F', 'done', '09:42:03', '0.2s', 'Triggered by order #1042'),
      S('create-outline', 'Collect PO details', 'done', '09:42:04', '3.1s', 'Wholesale PO form submitted'),
      S('shield-checkmark-outline', 'Finance approval', 'running', '09:42:31', '—', 'Awaiting sign-off from Finance manager'),
      S('git-branch-outline', 'Approved?', 'pending', '', '', 'approval.status = approved'),
      S('globe-outline', 'Sync to ERP', 'pending', '', '', 'POST /v1/orders'),
      S('chatbubbles-outline', 'Notify warehouse', 'pending', '', '', 'WhatsApp Business · #fulfillment'),
      S('flag-outline', 'Fulfilled', 'pending', '', '', 'Process complete'),
    ] },
  { id: 'R-4820', wfId: 'wf2', wf: 'New customer onboarding', trigger: 'form', entity: 'Nadège Fotso · nadege.fotso@cafebilongue.cm',
    startedAt: 'Today · 09:38', status: 'completed', stepsDone: 6, stepsTotal: 6, elapsed: '41s', currentStep: '', initiator: 'Web form',
    steps: [
      S('document-text-outline', 'Form submitted', 'done', '09:38:10', '0.1s', 'Customer onboarding form'),
      S('people-circle-outline', 'Create CRM contact', 'done', '09:38:11', '1.4s', 'HubSpot · Contact created'),
      S('git-branch-outline', 'Marketing opt-in?', 'done', '09:38:13', '0.1s', 'consent = true'),
      S('mail-outline', 'Send welcome email', 'done', '09:38:14', '2.0s', 'Template · Welcome'),
      S('grid-outline', 'Add to sheet', 'done', '09:38:16', '0.9s', 'Appended to Customers 2026'),
      S('flag-outline', 'Complete', 'done', '09:38:51', '—', 'Process complete'),
    ] },
  { id: 'R-4819', wfId: 'wf4', wf: 'Refund approval', trigger: 'form', entity: 'Refund · Order #0987 · 53 500 F',
    startedAt: 'Today · 09:20', status: 'waiting', stepsDone: 2, stepsTotal: 7, elapsed: '22m 04s', currentStep: 'Manager sign-off', initiator: 'Anita N.',
    steps: [
      S('document-text-outline', 'Refund requested', 'done', '09:20:00', '0.1s', 'Refund request form'),
      S('git-branch-outline', 'Over 36 000 F?', 'done', '09:20:01', '0.1s', 'amount > 36 000 → yes'),
      S('shield-checkmark-outline', 'Manager sign-off', 'waiting', '09:20:02', '—', 'Waiting on Store manager (SLA 24h)'),
      S('card-outline', 'Issue refund', 'pending', '', '', 'Capture reversal'),
      S('mail-outline', 'Email customer', 'pending', '', '', 'Refund confirmation'),
      S('grid-outline', 'Log to sheet', 'pending', '', '', 'Refunds ledger'),
      S('flag-outline', 'Complete', 'pending', '', '', 'Process complete'),
    ] },
  { id: 'R-4818', wfId: 'wf1', wf: 'Wholesale order fulfillment', trigger: 'order', entity: 'Order #1039 · 1 073 000 F',
    startedAt: 'Today · 08:51', status: 'failed', stepsDone: 5, stepsTotal: 9, elapsed: '3m 27s', currentStep: 'Sync to ERP', initiator: 'POS · Caisse 1',
    steps: [
      S('cart-outline', 'Order over 180 000 F', 'done', '08:51:00', '0.2s', 'Triggered by order #1039'),
      S('create-outline', 'Collect PO details', 'done', '08:51:02', '4.0s', 'Wholesale PO form submitted'),
      S('shield-checkmark-outline', 'Finance approval', 'done', '08:52:40', '—', 'Approved by Finance manager'),
      S('git-branch-outline', 'Approved?', 'done', '08:52:41', '0.1s', 'approval.status = approved → yes'),
      S('globe-outline', 'Sync to ERP', 'failed', '08:54:27', '30.0s', 'HTTP 503 — ERP endpoint timed out after 3 retries'),
      S('chatbubbles-outline', 'Notify warehouse', 'skipped', '', '', 'Skipped — upstream step failed'),
      S('flag-outline', 'Fulfilled', 'skipped', '', '', 'Not reached'),
    ] },
  { id: 'R-4817', wfId: 'wf6', wf: 'VIP loyalty reward', trigger: 'order', entity: 'Order #1038 · 33 000 F',
    startedAt: 'Today · 08:44', status: 'completed', stepsDone: 6, stepsTotal: 6, elapsed: '44s', currentStep: '', initiator: 'POS · Caisse 3',
    steps: [
      S('cart-outline', 'VIP checkout', 'done', '08:44:00', '0.2s', 'Member tier = VIP'),
      S('git-branch-outline', 'Is VIP?', 'done', '08:44:01', '0.1s', 'tier = vip → yes'),
      S('star-outline', 'Award bonus points', 'done', '08:44:02', '0.8s', '+250 points'),
      S('people-circle-outline', 'Update CRM', 'done', '08:44:03', '1.1s', 'Lifetime points updated'),
      S('mail-outline', 'Send thank-you', 'done', '08:44:05', '1.9s', 'Template · VIP thanks'),
      S('flag-outline', 'Complete', 'done', '08:44:44', '—', 'Process complete'),
    ] },
  { id: 'R-4816', wfId: 'wf5', wf: 'Daily sales digest', trigger: 'schedule', entity: 'Digest · Jul 2',
    startedAt: 'Today · 08:00', status: 'completed', stepsDone: 4, stepsTotal: 4, elapsed: '21s', currentStep: '', initiator: 'Scheduler',
    steps: [
      S('time-outline', 'Daily · 08:00', 'done', '08:00:00', '0.1s', 'Scheduled trigger'),
      S('grid-outline', 'Compile sales', 'done', '08:00:01', '14.0s', '312 orders · 6 553 500 F'),
      S('chatbubbles-outline', 'Post to WhatsApp Business', 'done', '08:00:16', '1.2s', 'WhatsApp Business · #leadership'),
      S('flag-outline', 'Complete', 'done', '08:00:21', '—', 'Process complete'),
    ] },
  { id: 'R-4815', wfId: 'wf2', wf: 'New customer onboarding', trigger: 'form', entity: 'Thomas Ngwa · thomas.ngwa@gmail.com',
    startedAt: 'Today · 07:52', status: 'completed', stepsDone: 6, stepsTotal: 6, elapsed: '37s', currentStep: '', initiator: 'Web form',
    steps: [
      S('document-text-outline', 'Form submitted', 'done', '07:52:00', '0.1s', 'Customer onboarding form'),
      S('people-circle-outline', 'Create CRM contact', 'done', '07:52:01', '1.2s', 'HubSpot · Contact created'),
      S('git-branch-outline', 'Marketing opt-in?', 'done', '07:52:02', '0.1s', 'consent = false → skip email'),
      S('mail-outline', 'Send welcome email', 'skipped', '', '', 'Opted out of marketing'),
      S('grid-outline', 'Add to sheet', 'done', '07:52:03', '0.8s', 'Appended to Customers 2026'),
      S('flag-outline', 'Complete', 'done', '07:52:37', '—', 'Process complete'),
    ] },
  { id: 'R-4814', wfId: 'wf3', wf: 'Low-stock reorder', trigger: 'schedule', entity: 'Reorder · 7 items',
    startedAt: 'Today · 06:00', status: 'completed', stepsDone: 5, stepsTotal: 5, elapsed: '1m 08s', currentStep: '', initiator: 'Scheduler',
    steps: [
      S('time-outline', 'Daily · 06:00', 'done', '06:00:00', '0.1s', 'Scheduled trigger'),
      S('grid-outline', 'Scan inventory', 'done', '06:00:01', '32.0s', '7 items below par'),
      S('git-branch-outline', 'Any below par?', 'done', '06:00:33', '0.1s', 'count > 0 → yes'),
      S('globe-outline', 'Raise purchase orders', 'done', '06:00:34', '33.0s', '3 POs created with suppliers'),
      S('flag-outline', 'Complete', 'done', '06:01:08', '—', 'Process complete'),
    ] },
  { id: 'R-4813', wfId: 'wf6', wf: 'VIP loyalty reward', trigger: 'order', entity: 'Order #1031 · 75 500 F',
    startedAt: 'Yesterday · 21:12', status: 'completed', stepsDone: 6, stepsTotal: 6, elapsed: '49s', currentStep: '', initiator: 'POS · Caisse 2',
    steps: [
      S('cart-outline', 'VIP checkout', 'done', '21:12:00', '0.2s', 'Member tier = VIP'),
      S('git-branch-outline', 'Is VIP?', 'done', '21:12:01', '0.1s', 'tier = vip → yes'),
      S('star-outline', 'Award bonus points', 'done', '21:12:02', '0.7s', '+525 points'),
      S('people-circle-outline', 'Update CRM', 'done', '21:12:03', '1.0s', 'Lifetime points updated'),
      S('mail-outline', 'Send thank-you', 'done', '21:12:05', '1.8s', 'Template · VIP thanks'),
      S('flag-outline', 'Complete', 'done', '21:12:49', '—', 'Process complete'),
    ] },
  { id: 'R-4812', wfId: 'wf4', wf: 'Refund approval', trigger: 'form', entity: 'Refund · Order #0971 · 23 000 F',
    startedAt: 'Yesterday · 18:03', status: 'completed', stepsDone: 5, stepsTotal: 7, elapsed: '2m 55s', currentStep: '', initiator: 'Njike P.',
    steps: [
      S('document-text-outline', 'Refund requested', 'done', '18:03:00', '0.1s', 'Refund request form'),
      S('git-branch-outline', 'Over 36 000 F?', 'done', '18:03:01', '0.1s', 'amount < 36 000 → no approval'),
      S('card-outline', 'Issue refund', 'done', '18:03:02', '2.2s', 'Reversal captured · MTN MoMo API'),
      S('mail-outline', 'Email customer', 'done', '18:03:05', '1.7s', 'Refund confirmation'),
      S('flag-outline', 'Complete', 'done', '18:05:55', '—', 'Process complete'),
    ] },
  { id: 'R-4811', wfId: 'wf1', wf: 'Wholesale order fulfillment', trigger: 'order', entity: 'Order #1024 · 273 500 F',
    startedAt: 'Yesterday · 16:41', status: 'completed', stepsDone: 7, stepsTotal: 9, elapsed: '4m 02s', currentStep: '', initiator: 'POS · Caisse 1',
    steps: [
      S('cart-outline', 'Order over 180 000 F', 'done', '16:41:00', '0.2s', 'Triggered by order #1024'),
      S('create-outline', 'Collect PO details', 'done', '16:41:03', '5.0s', 'Wholesale PO form submitted'),
      S('shield-checkmark-outline', 'Finance approval', 'done', '16:43:20', '—', 'Approved by Finance manager'),
      S('git-branch-outline', 'Approved?', 'done', '16:43:21', '0.1s', 'yes'),
      S('globe-outline', 'Sync to ERP', 'done', '16:43:22', '1.8s', '201 Created'),
      S('chatbubbles-outline', 'Notify warehouse', 'done', '16:43:24', '0.9s', 'WhatsApp Business · #fulfillment'),
      S('flag-outline', 'Fulfilled', 'done', '16:45:02', '—', 'Process complete'),
    ] },
  { id: 'R-4810', wfId: 'wf2', wf: 'New customer onboarding', trigger: 'form', entity: 'Blaise N. · b.nkoulou@gmail.com',
    startedAt: 'Yesterday · 15:19', status: 'failed', stepsDone: 2, stepsTotal: 6, elapsed: '9s', currentStep: 'Create CRM contact', initiator: 'Web form',
    steps: [
      S('document-text-outline', 'Form submitted', 'done', '15:19:00', '0.1s', 'Customer onboarding form'),
      S('people-circle-outline', 'Create CRM contact', 'failed', '15:19:01', '8.0s', 'HubSpot 429 — rate limit exceeded'),
      S('git-branch-outline', 'Marketing opt-in?', 'skipped', '', '', 'Not reached'),
      S('mail-outline', 'Send welcome email', 'skipped', '', '', 'Not reached'),
      S('grid-outline', 'Add to sheet', 'skipped', '', '', 'Not reached'),
      S('flag-outline', 'Complete', 'skipped', '', '', 'Not reached'),
    ] },
];

Object.assign(window, { TRIGGERS, WF_STATUS, RUN_STATUS, STEP_STATUS, WORKFLOWS, RUNS });
