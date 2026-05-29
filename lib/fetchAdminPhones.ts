import type { Firestore } from 'firebase-admin/firestore';
import { resolveAdminPhoneList } from './orderNotifications.js';

/** Load phone numbers from all documents in the `admins` collection. */
export async function fetchAdminPhoneNumbers(db: Firestore): Promise<string[]> {
  const snapshot = await db.collection('admins').get();
  const raw = snapshot.docs.map((doc) => {
    const data = doc.data();
    return (data.phone || data.mobile_number || data.mobileNumber) as string | undefined;
  });
  return resolveAdminPhoneList(raw);
}
