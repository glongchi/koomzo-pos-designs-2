import type { StepContext, StepResult } from '../domain';
import { resolveDeep } from '../util/bindings';

/**
 * Thin typed wrappers over external providers. Each resolves bindings,
 * loads its account credential from Secret Manager, and calls the provider.
 * Bodies are illustrative — swap in the real SDK/endpoint per provider.
 */

export async function email(ctx: StepContext): Promise<StepResult> {
  const cfg = resolveDeep(ctx.step.config as { to: string; subject?: string; template: string }, ctx.run.context);
  ctx.log(`email -> ${cfg.to} (template ${cfg.template})`);
  // await sendgrid.send({ to: cfg.to, subject: cfg.subject, templateId: cfg.template, dynamicTemplateData: ctx.run.context });
  return { kind: 'continue', output: { sent: true, to: cfg.to } };
}

export async function slack(ctx: StepContext): Promise<StepResult> {
  const cfg = resolveDeep(ctx.step.config as { account: string; channel: string; message?: string }, ctx.run.context);
  const token = await ctx.secret(`slack-${cfg.account}`);
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ channel: cfg.channel, text: cfg.message || 'Workflow notification' }),
  });
  const data = (await res.json()) as { ok: boolean; error?: string };
  if (!data.ok) return { kind: 'fail', message: `Slack: ${data.error}`, retryable: true };
  return { kind: 'continue', output: { ok: true } };
}

export async function payment(ctx: StepContext): Promise<StepResult> {
  const cfg = resolveDeep(ctx.step.config as { account: string; amount: string }, ctx.run.context);
  const key = await ctx.secret(`stripe-${cfg.account}`);
  ctx.log(`payment ${cfg.amount} via ${cfg.account}`);
  // const stripe = new Stripe(key); await stripe.paymentIntents.create({ amount, currency, ... }, { idempotencyKey: ctx.run.id + ctx.step.id });
  void key;
  return { kind: 'continue', output: { charged: cfg.amount } };
}

export async function crm(ctx: StepContext): Promise<StepResult> {
  const cfg = resolveDeep(ctx.step.config as { account: string; object: string }, ctx.run.context);
  ctx.log(`crm upsert ${cfg.object} in ${cfg.account}`);
  return { kind: 'continue', output: { upserted: cfg.object } };
}

export async function sheets(ctx: StepContext): Promise<StepResult> {
  const cfg = resolveDeep(ctx.step.config as { account: string; sheet: string; row?: unknown[] }, ctx.run.context);
  ctx.log(`sheets append to ${cfg.sheet}`);
  return { kind: 'continue', output: { appended: true } };
}
