import { db } from '@/db/firestoreConfig';
import { canonicalizeClientId } from '@/config/locationConfig';
import { FieldValue } from 'firebase-admin/firestore';

type ContactCategory = {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  order?: number;
};

type ContactItem = {
  id: string;
  categoryId: string;
  name: string;
  value: string;
  action: string;
  iconKey: string;
  iconColor: string;
  isActive: boolean;
  order?: number;
};

type ContactsPayload = {
  categories: ContactCategory[];
  contacts: ContactItem[];
  updatedAt?: string;
};

export class ContactModel {
  private static docRef(clientId: string) {
    return db.collection('contacts').doc(canonicalizeClientId(clientId) ?? clientId);
  }

  public static async saveContacts(payload: ContactsPayload, userId: string, clientId: string): Promise<void> {
    const canonicalClientId = canonicalizeClientId(clientId) ?? clientId;
    try {
      await this.docRef(canonicalClientId).set(
        {
          clientId: canonicalClientId,
          categories: payload.categories ?? [],
          contacts: payload.contacts ?? [],
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: userId,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('❌ Error saving contacts:', error);
      throw error;
    }
  }

  public static async getContacts(clientId: string): Promise<Record<string, unknown>> {
    const canonicalClientId = canonicalizeClientId(clientId) ?? clientId;
    try {
      const doc = await this.docRef(canonicalClientId).get();
      if (!doc.exists) {
        return { categories: [], contacts: [] };
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Error fetching contacts:', error);
      throw error;
    }
  }
}
