# Koomzo POS — Workflow Orchestrator Runtime

Backend runtime for the Workflow Orchestrator, on **Firebase + GCP**. The
Orchestrator UI only *authors* workflows and saves the graph as a JSON
`steps[]` blob; this project stores, versions, triggers, and **executes** them.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design and
[`functions/src/domain.ts`](./functions/src/domain.ts) for the typed domain model.

## Layout

```
firebase.json            Hosting/Functions/Firestore/emulator config
firestore.rules          Multi-tenant security rules (runtime = function-only)
firestore.indexes.json   Composite indexes for runs / tasks / triggers
functions/
  package.json
  tsconfig.json
  .env.example           Local env template
  src/
    index.ts             Cloud Functions entry points (all triggers/callables)
    domain.ts            Authoring + runtime types + executor contract
    config.ts            Env + collection names
    firestore.ts         Admin SDK init
    authoring.ts         validate + publish (immutable versions, trigger sync)
    dispatcher.ts        event -> matching triggers -> new run
    engine.ts            runStep: execute one step, advance the cursor
    human.ts             resolve human task -> resume run
    executors/           one handler per StepType
      index.ts           dispatch table
      logic.ts           condition / delay / end
      http.ts            generic HTTP / URL call
      integrations.ts    email / slack / payment / crm / sheets
      human.ts           form / approval / task (park + create /tasks doc)
    util/
      bindings.ts        {{expr}} resolution against run context
      secrets.ts         Secret Manager loader (refs only in Firestore)
      queue.ts           Pub/Sub step enqueue
      tasks.ts           Cloud Tasks scheduling (delays / SLAs)
```

## Prerequisites

- Node.js 20, `npm`
- Firebase CLI: `npm i -g firebase-tools`
- A Firebase project on the Blaze plan (Functions + Pub/Sub + Cloud Tasks + Secret Manager)

## Setup

```bash
cd functions
npm install
cp .env.example .env          # fill in your project id / secrets
```

Create the backing resources once:

```bash
gcloud pubsub topics create workflow-steps
gcloud tasks queues create workflow-timers --location=us-central1
```

## Run locally (emulators)

```bash
cd functions
npm run serve      # builds, then starts functions + firestore + pubsub + auth emulators
```

Emulator UI: http://localhost:4000

## Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

## How it runs (one line each)

1. **Author** → UI calls `saveWorkflow` (draft JSON).
2. **Publish** → `publishWorkflow` validates, snapshots an immutable version, syncs `/triggers`.
3. **Fire** → `onOrderPlaced` / `webhookIn` / `scheduleTick` → `dispatch` → new `/runs` doc + first step queued.
4. **Execute** → `stepRunner` (Pub/Sub) runs one step via its executor, merges output into context, enqueues `next`.
5. **Wait** → delays schedule a Cloud Task (`resumeDelay`); human steps create a `/tasks` doc and park.
6. **Resume** → `submitForm` / `decideApproval` / `completeTask` resolve the task and re-enqueue `next`.

## Security model

- **Firebase Auth** on every callable; `orgId` claim scopes all data.
- Clients may read their org's `workflows`, `runs`, `tasks`; **all runtime writes go through Functions** (Admin SDK) — enforced by `firestore.rules`.
- Integration credentials live in **Secret Manager**; Firestore stores only `secretRef` strings.
- Webhooks are HMAC-verified with `WEBHOOK_SIGNING_SECRET`.

> Note: executor bodies for paid providers (Stripe, Slack, SendGrid, HubSpot)
> are illustrative stubs — wire in the real SDK/keys before production use.
