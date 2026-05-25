import { db } from '@/db/firestoreConfig';
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
  private static docRef(clientId: string = 'naic') {
    return db.collection('contacts').doc(clientId);
  }

  public static async saveContacts(payload: ContactsPayload, userId: string, clientId: string = 'naic'): Promise<void> {
    try {
      await this.docRef(clientId).set(
        {
          clientId,
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

  public static async getContacts(clientId: string = 'naic'): Promise<Record<string, unknown>> {
    try {
      const doc = await this.docRef(clientId).get();
      if (!doc.exists && clientId === 'naic') {
        const legacyDoc = await db.collection('contacts').doc('main').get();
        if (legacyDoc.exists) {
          return { id: legacyDoc.id, clientId, ...legacyDoc.data() };
        }
      }
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
