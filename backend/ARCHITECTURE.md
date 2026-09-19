# Koomzo POS — Workflow Orchestrator: Backend Runtime on Firebase + GCP

The Orchestrator UI is an **authoring tool only**. It serializes the graph to a
JSON `steps[]` blob (the `processJson` shape) and saves it. Everything below is
the **runtime** that stores, versions, triggers, and executes those definitions.

---

## 1. Component map

```
                         ┌────────────────────────────────────────────┐
   Orchestrator UI ──────▶  Firebase Hosting  (static authoring app)   │
   (authors JSON)         └────────────────────────────────────────────┘
        │  save / publish
        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Firestore  (system of record)                                             │
│    /workflows/{id}                 draft definition (JSON steps[])          │
│    /workflows/{id}/versions/{v}    immutable published snapshots            │
│    /triggers/{id}                  materialized trigger index (live only)   │
│    /runs/{id}                      one execution + working context          │
│    /runs/{id}/steps/{execId}       per-step execution log                   │
│    /tasks/{id}                     human inbox (form / approval / task)     │
│    /connections/{id}               integration accounts (secret refs only)  │
└──────────────────────────────────────────────────────────────────────────┘
        │ Firestore onWrite triggers                    ▲ resume
        ▼                                               │
┌──────────────────────────────────────────────────────────────────────────┐
│  Cloud Functions for Firebase  (the engine)                                │
│                                                                            │
│   authoring      saveWorkflow · publishWorkflow (callable, authed)         │
│   ingress        onOrderPlaced (Firestore) · webhookIn (HTTPS)             │
│                  scheduleTick (Pub/Sub from Cloud Scheduler)               │
│   dispatcher     matches event → TriggerRegistration → creates a Run       │
│   stepRunner     Pub/Sub-driven; executes one step, advances the cursor    │
│   executors      one handler per StepType (http, email, slack, condition…) │
│   humanCallback  submitForm / decideApproval / completeTask (callable)     │
│   timers         resumeDelay / slaBreach (Cloud Tasks callbacks)           │
└──────────────────────────────────────────────────────────────────────────┘
        │ side effects
        ▼
   Pub/Sub (step queue) · Cloud Tasks (delays, SLAs) · Cloud Scheduler (cron)
   Secret Manager (integration tokens) · Cloud Logging/Trace (observability)
   External APIs (Stripe, Slack, Sheets, HubSpot, arbitrary HTTP/URLs)
```

---

## 2. Authoring & versioning

- **Save (draft):** UI calls a callable Function `saveWorkflow` → writes the JSON
  to `/workflows/{id}` with `status: "draft"`, bumps `updatedAt`. Cheap, frequent.
- **Publish:** `publishWorkflow` validates the graph (one trigger, no dangling
  `next`, no cycles into triggers, every branch wired), then writes an **immutable**
  `/workflows/{id}/versions/{v}` snapshot and flips `status: "live"`. In-flight runs
  keep executing the version they started on — draft edits never mutate them.
- **Trigger sync:** the same publish step (or a Firestore `onWrite`) reconciles
  `/triggers` so only the live version's trigger steps are dispatchable.
- **Validation lives server-side**, not in the UI, so the JSON is always trusted
  before it can run.

## 3. How a run starts (ingress → dispatcher)

Each trigger type has an ingress Function that normalizes the event and hands it
to the shared **dispatcher**:

| Trigger step   | Ingress                                                        |
| -------------- | -------------------------------------------------------------- |
| `trig.order`   | Firestore `onWrite` on the POS orders collection (or Pub/Sub). |
| `trig.webhook` | HTTPS Function at a minted path; verifies the shared secret.   |
| `trig.schedule`| Cloud Scheduler → Pub/Sub tick, matched against cron `match`.  |
| `trig.form`    | `submitForm` callable when an inbound form is posted.          |

The dispatcher looks up matching `/triggers`, evaluates any filter (`order.total > 500`),
creates a `/runs/{id}` with `status: "running"` + the initial `context`, and
publishes the first step id to the **step queue** (Pub/Sub).

## 4. Executing steps (the engine loop)

`stepRunner` is subscribed to the step-queue topic. For each message it:

1. Loads the run + the step from the pinned version.
2. Resolves `{{bindings}}` against `run.context`.
3. Dispatches to the executor for that `StepType` (see `ExecutorRegistry`).
4. Applies the `StepResult`:
   - **continue** → write `StepExecution`, merge `output` into context, enqueue the
     `next` step(s). `condition` picks the `yes`/`no` branch here.
   - **wait** → set run `status: "waiting"`. Delays schedule a **Cloud Task**
     (`resumeDelay`) for the exact resume time; human steps create a `/tasks` doc
     and (optionally) an SLA Cloud Task; async integrations park on a callback.
   - **end** → mark run `completed`, stamp `finishedAt`.
   - **fail** → retry with backoff if `retryable` (Pub/Sub redelivery / Cloud
     Tasks), else mark run `failed` with the offending `stepId`.

Because each step is an idempotent queue message, the engine is **durable and
horizontally scalable** — a step that runs for hours (an approval) costs nothing
while parked, and crashes just redeliver.

## 5. Human-in-the-loop

`form`, `approval`, and `task` steps create a `/tasks/{id}` doc and park the run.
The inbox UI (or POS surface) reads `/tasks` scoped by `assignedTo`. Completing a
task calls an authed callable (`decideApproval`, `submitForm`, `completeTask`) that
writes the `result`, resolves the task, and re-enqueues the run's `next` step. An
SLA Cloud Task fires `slaBreach` if the deadline passes first.

## 6. Integrations & secrets

- `/connections` stores integration accounts but **only a `secretRef`** — the OAuth
  token / API key lives in **Secret Manager**, fetched at execution time via
  `ctx.secret(ref)`. Definitions and Firestore never hold raw credentials.
- The `http` executor is the generic "call any API / URL" node; the others
  (`slack`, `sheets`, `payment`→Stripe, `crm`→HubSpot, `email`) are thin typed
  wrappers over their providers.
- All outbound calls run behind per-provider rate limiting and retry with
  idempotency keys so a redelivered step never double-charges or double-posts.

## 7. Security & multi-tenancy

- **Firebase Auth** identifies users; every doc carries `orgId`.
- **Firestore Security Rules** enforce org isolation for reads the UI makes
  (`/workflows`, `/tasks`); all **writes to `/runs`, `/tasks` results, and version
  snapshots go through callable Functions**, never direct client writes — the
  runtime collections are function-only.
- Webhook ingress verifies HMAC signatures; scheduled/queue Functions are not
  publicly invocable.

## 8. Observability & ops

- `StepExecution` logs give a full per-run audit trail; `/runs` powers the "Runs"
  screen the toolbar links to.
- Cloud Logging + Cloud Trace + Error Reporting on every Function; alert on run
  failure rate and SLA breaches.
- Dead-letter topic on the step queue captures poison messages for replay.

## 9. Firestore layout summary

```
/workflows/{id}                     WorkflowDefinition   (draft, client-readable)
/workflows/{id}/versions/{v}        WorkflowVersion      (immutable, engine-run)
/triggers/{id}                      TriggerRegistration  (live index)
/connections/{id}                   Connection           (secretRef only)
/runs/{id}                          WorkflowRun
/runs/{id}/steps/{execId}           StepExecution
/tasks/{id}                         HumanTask            (human inbox)
```

## 10. GCP services at a glance

| Concern                     | Service                                   |
| --------------------------- | ----------------------------------------- |
| Authoring app hosting       | Firebase Hosting                          |
| System of record           | Cloud Firestore                           |
| Engine / handlers          | Cloud Functions for Firebase (2nd gen)    |
| Step dispatch (durable)    | Pub/Sub                                   |
| Delays & SLA timers        | Cloud Tasks                               |
| Scheduled triggers         | Cloud Scheduler                           |
| Identity & rules           | Firebase Auth + Firestore Security Rules  |
| Integration credentials    | Secret Manager                            |
| Logs / traces / alerts     | Cloud Logging, Trace, Error Reporting     |
| Heavy/long integration work | Cloud Run (optional, for >9-min jobs)    |
```
