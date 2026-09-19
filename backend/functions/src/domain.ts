/**
 * Koomzo POS — Workflow Orchestrator
 * ------------------------------------------------------------------
 * Backend domain model (TypeScript).
 *
 * Two layers:
 *   1. AUTHORING model  — the workflow definition the Orchestrator UI
 *      serializes to JSON and persists. This mirrors the `processJson`
 *      shape and the WF_TYPES registry in the front-end 1:1.
 *   2. RUNTIME model     — everything the execution engine creates while
 *      a definition is running: runs, per-step executions, human tasks,
 *      and trigger registrations. The UI never writes these.
 *
 * Target: Firebase (Firestore + Cloud Functions) on GCP.
 * ================================================================== */

/* ============================================================== *
 * 1. SHARED PRIMITIVES
 * ============================================================== */

/** Firestore document id. */
export type Id = string;

/** ISO-8601 timestamp string, or a Firestore Timestamp server-side. */
export type IsoDate = string;

/** Handlebars-style binding, e.g. "{{order.total}}" or a literal value. */
export type Expr = string;

export type NodeCategory =
  | 'trigger'
  | 'form'
  | 'human'
  | 'integration'
  | 'logic'
  | 'end';

/** Every step kind the palette can drop. Mirrors WF_TYPES keys exactly. */
export type StepType =
  // triggers
  | 'trig.order'
  | 'trig.form'
  | 'trig.schedule'
  | 'trig.webhook'
  // human / form
  | 'form'
  | 'approval'
  | 'task'
  // integrations / external tools + URLs
  | 'http'
  | 'email'
  | 'slack'
  | 'sheets'
  | 'payment'
  | 'crm'
  // logic
  | 'condition'
  | 'delay'
  | 'end';

/* ============================================================== *
 * 2. PER-TYPE STEP CONFIG  (mirrors defaultConfig())
 * ============================================================== */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type Comparator = '=' | '≠' | '>' | '<' | '≥' | '≤';

export interface TrigOrderConfig {
  /** Optional filter rule, e.g. amount threshold. */
  field?: string;
  op?: Comparator;
  value?: string;
}
export interface TrigFormConfig {
  formRef: string;
}
export interface TrigScheduleConfig {
  freq: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';
  at: string; // "09:00"
  timezone?: string; // IANA, e.g. "America/New_York"
}
export interface TrigWebhookConfig {
  method: HttpMethod;
  url: string; // inbound URL minted by the backend
  secret?: string; // ref into Secret Manager, never the raw value
}

export interface FormConfig {
  formRef: string;
}
export interface ApprovalConfig {
  approver: string;
  sla: string; // "24 hours"
}
export interface TaskConfig {
  assignee: string;
  due: string; // "2 days"
}

export interface HttpConfig {
  method: HttpMethod;
  url: string;
  auth?: string; // Secret Manager ref (e.g. "sm://http-erp-token"), never the raw token
  headers?: Record<string, Expr>;
  body?: Expr;
}
export interface EmailConfig {
  to: Expr;
  template: string;
  subject?: Expr;
}
export interface SlackConfig {
  account: string; // connected-app id
  channel: string;
  message?: Expr;
}
export interface SheetsConfig {
  account: string;
  sheet: string;
  row?: Expr[];
}
export interface PaymentConfig {
  account: string; // "Stripe"
  amount: Expr; // "{{order.total}}"
}
export interface CrmConfig {
  account: string; // "HubSpot"
  object: string; // "Contact"
}

export interface ConditionConfig {
  field: string; // "order.total"
  op: Comparator;
  value: string;
}
export interface DelayConfig {
  amount: string; // "1"
  unit: 'minutes' | 'hours' | 'days';
}

/** Discriminated map: StepType -> its config shape. */
export interface StepConfigMap {
  'trig.order': TrigOrderConfig;
  'trig.form': TrigFormConfig;
  'trig.schedule': TrigScheduleConfig;
  'trig.webhook': TrigWebhookConfig;
  form: FormConfig;
  approval: ApprovalConfig;
  task: TaskConfig;
  http: HttpConfig;
  email: EmailConfig;
  slack: SlackConfig;
  sheets: SheetsConfig;
  payment: PaymentConfig;
  crm: CrmConfig;
  condition: ConditionConfig;
  delay: DelayConfig;
  end: Record<string, never>;
}

/* ============================================================== *
 * 3. AUTHORING MODEL  (exactly what the UI saves as JSON)
 * ============================================================== */

/**
 * A `next` entry is either:
 *   - a step id string  → the single "out" edge, or
 *   - { yes: id } / { no: id }  → a labelled branch (condition node).
 * This matches the UI's serialization:
 *   next: edges.map(e => e.branch === 'out' ? e.to : { [e.branch]: e.to })
 */
export type NextRef = Id | { yes: Id } | { no: Id };

/** One node in the authored process graph. */
export interface Step<T extends StepType = StepType> {
  id: Id;
  type: T;
  name: string;
  config?: StepConfigMap[T];
  next: NextRef[];
  /** Canvas coords — authoring-only, ignored by the runtime. */
  ui?: { x: number; y: number };
}

export type WorkflowStatus = 'draft' | 'live';

/**
 * The persisted workflow definition. `steps` is the JSON blob the
 * Orchestrator produces; everything else is server-managed metadata.
 *
 * Firestore: /workflows/{workflowId}
 */
export interface WorkflowDefinition {
  id: Id;
  name: string;
  status: WorkflowStatus;
  /** Monotonic; a new immutable version is written on each Publish. */
  version: number;
  steps: Step[];

  orgId: Id;
  createdBy: Id;
  updatedBy: Id;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  publishedAt?: IsoDate;
}

/**
 * Immutable published snapshot the runtime actually executes against.
 * Draft edits never affect in-flight runs.
 *
 * Firestore: /workflows/{workflowId}/versions/{version}
 */
export interface WorkflowVersion {
  id: Id; // `${workflowId}@${version}`
  workflowId: Id;
  version: number;
  name: string;
  steps: Step[];
  publishedBy: Id;
  publishedAt: IsoDate;
}

/* ============================================================== *
 * 4. RUNTIME MODEL  (engine-owned; UI never writes these)
 * ============================================================== */

export type RunStatus =
  | 'running'
  | 'waiting'   // parked on a human task, delay, or async callback
  | 'completed'
  | 'failed'
  | 'canceled';

/**
 * One execution of a workflow version.
 * Firestore: /runs/{runId}
 */
export interface WorkflowRun {
  id: Id;
  workflowId: Id;
  version: number;
  status: RunStatus;

  /** Where the run entered — which trigger fired and its payload. */
  trigger: { stepId: Id; type: StepType; payload: Record<string, unknown> };

  /** Mutable working context: variables steps read/write via {{bindings}}. */
  context: Record<string, unknown>;

  /** Step ids currently active (>1 only with parallel branches). */
  cursor: Id[];

  startedAt: IsoDate;
  finishedAt?: IsoDate;
  error?: { stepId: Id; message: string; code?: string };
  orgId: Id;
}

export type StepStatus =
  | 'pending'
  | 'running'
  | 'waiting'
  | 'succeeded'
  | 'failed'
  | 'skipped';

/**
 * Immutable-ish log of a single step firing within a run.
 * Firestore: /runs/{runId}/steps/{stepExecId}
 */
export interface StepExecution {
  id: Id;
  runId: Id;
  stepId: Id;
  type: StepType;
  status: StepStatus;

  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  /** For condition: which branch was taken. */
  branchTaken?: 'yes' | 'no' | 'out';

  attempts: number;
  startedAt: IsoDate;
  finishedAt?: IsoDate;
  error?: { message: string; code?: string; retryable: boolean };
}

/* ---- Human-in-the-loop tasks (form / approval / task) ---- */

export type TaskStatus = 'open' | 'approved' | 'rejected' | 'submitted' | 'expired';

/**
 * A parked human step that a run is `waiting` on. Completing it
 * (via an authed callable) resumes the run.
 * Firestore: /tasks/{taskId}
 */
export interface HumanTask {
  id: Id;
  runId: Id;
  stepId: Id;
  kind: 'form' | 'approval' | 'task';
  status: TaskStatus;

  assignedTo: string; // user id, role, or group
  title: string;
  formRef?: string;          // for `form` steps
  slaAt?: IsoDate;           // deadline; a Cloud Task fires on breach
  result?: Record<string, unknown>; // submitted form data / approval note

  createdAt: IsoDate;
  resolvedAt?: IsoDate;
  resolvedBy?: Id;
  orgId: Id;
}

/* ---- Trigger registry (how live workflows get invoked) ---- */

/**
 * Materialized index of every active trigger across live workflows, so
 * an inbound event (order placed, webhook hit, schedule tick) can fan
 * out to the right workflow versions without scanning all definitions.
 * Firestore: /triggers/{triggerId}
 */
export interface TriggerRegistration {
  id: Id;
  workflowId: Id;
  version: number;
  stepId: Id;
  type: Extract<StepType, `trig.${string}`>;
  /** Matcher used by the dispatcher (event name, webhook path, cron, filter). */
  match: Record<string, unknown>;
  enabled: boolean;
  orgId: Id;
}

/* ---- Connected external apps (Slack, Stripe, HubSpot, …) ---- */

/**
 * OAuth / API credentials for an integration account. The token itself
 * lives in Secret Manager; this doc only holds a reference + metadata.
 * Firestore: /connections/{connectionId}
 */
export interface Connection {
  id: Id;
  provider: 'slack' | 'sheets' | 'stripe' | 'hubspot' | 'email' | 'http';
  label: string;
  secretRef: string; // "sm://projects/…/secrets/slack-koomzo/versions/latest"
  status: 'connected' | 'expired' | 'revoked';
  orgId: Id;
  createdAt: IsoDate;
}

/* ============================================================== *
 * 5. EXECUTOR CONTRACT  (one handler per StepType)
 * ============================================================== */

export interface StepContext {
  run: WorkflowRun;
  step: Step;
  /** Resolve "{{order.total}}" etc. against run.context. */
  resolve: (expr: Expr) => unknown;
  /** Load a decrypted secret by its Secret Manager ref. */
  secret: (ref: string) => Promise<string>;
  log: (msg: string, data?: unknown) => void;
}

/** What a step handler returns to the engine. */
export type StepResult =
  | { kind: 'continue'; output?: Record<string, unknown>; branch?: 'yes' | 'no' | 'out' }
  | { kind: 'wait'; reason: 'human' | 'delay' | 'callback'; resumeAt?: IsoDate; taskId?: Id }
  | { kind: 'end' }
  | { kind: 'fail'; message: string; retryable?: boolean };

export type StepHandler = (ctx: StepContext) => Promise<StepResult>;

/** Registry the engine dispatches through — one entry per StepType. */
export type ExecutorRegistry = Partial<Record<StepType, StepHandler>>;
