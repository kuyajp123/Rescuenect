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
  private static docRef() {
    return db.collection('contacts').doc('main');
  }

  public static async saveContacts(payload: ContactsPayload, userId: string): Promise<void> {
    try {
      await this.docRef().set(
        {
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

  public static async getContacts(): Promise<Record<string, unknown>> {
    try {
      const doc = await this.docRef().get();
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
