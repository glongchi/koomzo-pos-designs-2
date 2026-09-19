import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { CONFIG } from '../config';

const client = new SecretManagerServiceClient();
const cache = new Map<string, string>();

/**
 * Load a secret by its reference. Accepts either a bare secret name
 * ("slack-koomzo") or a full resource name / "sm://" ref. Values are
 * cached per warm instance. Never store the raw secret in Firestore.
 */
export async function loadSecret(ref: string): Promise<string> {
  if (cache.has(ref)) return cache.get(ref)!;
  const name = toResourceName(ref);
  const [version] = await client.accessSecretVersion({ name });
  const value = version.payload?.data?.toString() ?? '';
  cache.set(ref, value);
  return value;
}

function toResourceName(ref: string): string {
  let r = ref.replace(/^sm:\/\//, '');
  if (r.startsWith('projects/')) return r.includes('/versions/') ? r : `${r}/versions/latest`;
  return `projects/${CONFIG.project}/secrets/${r}/versions/latest`;
}
