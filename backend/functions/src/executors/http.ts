import type { StepContext, StepResult, HttpConfig } from '../domain';
import { resolveDeep } from '../util/bindings';

/**
 * http — the generic "call any API / URL" step. Also the base other
 * integration executors delegate to. Uses fetch (Node 20 global).
 */
export async function http(ctx: StepContext): Promise<StepResult> {
  const cfg = resolveDeep(ctx.step.config as HttpConfig, ctx.run.context);
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(cfg.headers || {}) };

  if (cfg.auth) {
    // cfg.auth is a Secret Manager ref, never a raw token in the definition.
    const token = await ctx.secret(cfg.auth);
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    const res = await fetch(cfg.url, {
      method: cfg.method || 'GET',
      headers,
      body: cfg.method && cfg.method !== 'GET' && cfg.body ? String(cfg.body) : undefined,
    });
    const text = await res.text();
    const data = safeJson(text);
    ctx.log(`http ${cfg.method} ${cfg.url} -> ${res.status}`);
    if (!res.ok) {
      return { kind: 'fail', message: `HTTP ${res.status}: ${text.slice(0, 200)}`, retryable: res.status >= 500 };
    }
    return { kind: 'continue', output: { status: res.status, body: data } };
  } catch (err) {
    return { kind: 'fail', message: (err as Error).message, retryable: true };
  }
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}
