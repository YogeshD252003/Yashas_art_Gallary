import type { Firestore } from 'firebase-admin/firestore';

/** Load admin inbox addresses from Firestore `admins` collection (+ env fallback). */
export async function fetchAdminEmails(db: Firestore): Promise<string[]> {
  const snapshot = await db.collection('admins').get();
  const emails = new Set<string>();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const email = (data.email || doc.id) as string;
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emails.add(email.trim().toLowerCase());
    }
  }

  const fallback = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;
  if (fallback && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fallback)) {
    emails.add(fallback.trim().toLowerCase());
  }

  return [...emails];
}
