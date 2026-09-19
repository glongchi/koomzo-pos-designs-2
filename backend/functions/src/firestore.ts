import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

initializeApp();

export const db = getFirestore();
export { FieldValue, Timestamp };

/** ISO string for "now" — the runtime stores ISO strings on documents. */
export const nowIso = () => new Date().toISOString();
