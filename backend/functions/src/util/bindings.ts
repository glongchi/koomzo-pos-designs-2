/**
 * Resolve "{{binding}}" expressions against a run's working context.
 *   "{{order.total}}"          -> ctx.order.total
 *   "Hello {{customer.name}}"  -> interpolated string
 *   literal (no braces)        -> returned as-is
 */
export function resolveExpr(expr: unknown, context: Record<string, unknown>): unknown {
  if (typeof expr !== 'string') return expr;
  const whole = expr.match(/^\{\{\s*([\w.[\]]+)\s*\}\}$/);
  if (whole) return getPath(context, whole[1]);
  // interpolate inside a larger string
  return expr.replace(/\{\{\s*([\w.[\]]+)\s*\}\}/g, (_, path) => {
    const v = getPath(context, path);
    return v == null ? '' : String(v);
  });
}

/** Deep-resolve every string value in an object/array of config. */
export function resolveDeep<T>(value: T, context: Record<string, unknown>): T {
  if (Array.isArray(value)) return value.map((v) => resolveDeep(v, context)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveDeep(v, context);
    return out as T;
  }
  return resolveExpr(value, context) as T;
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path
    .replace(/\[(\w+)\]/g, '.$1')
    .split('.')
    .reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), obj);
}

/** Coerce a resolved value to a number for comparisons. */
export function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v));
  return Number.isNaN(n) ? 0 : n;
}
