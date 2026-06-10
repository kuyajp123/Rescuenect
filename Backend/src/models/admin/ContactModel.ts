import { db } from '@/db/firestoreConfig';
import { canonicalizeClientId } from '@/config/locationConfig';
import { FieldValue } from 'firebase-admin/firestore';
import { ClientModel } from './ClientModel';

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
  logoUrl?: string | null;
  logoPath?: string | null;
  updatedAt?: string;
};

export class ContactModel {
  private static docRef(clientId: string) {
    return db.collection('contacts').doc(canonicalizeClientId(clientId) ?? clientId);
  }

  public static async saveContacts(payload: ContactsPayload, userId: string, clientId: string): Promise<void> {
    const canonicalClientId = canonicalizeClientId(clientId) ?? clientId;
    try {
      const client = await ClientModel.getClientById(canonicalClientId);
      const requestedLogoUrl = typeof payload.logoUrl === 'string' ? payload.logoUrl.trim() : '';

      if (!client) {
        throw new Error('Client not found');
      }

      if (!client.logoUrl) {
        throw new Error('LGU logo is required before saving contacts');
      }
      if (requestedLogoUrl && requestedLogoUrl !== client.logoUrl) {
        throw new Error('Uploaded LGU logo was not found for this client');
      }

      await this.docRef(canonicalClientId).set(
        {
          clientId: canonicalClientId,
          clientName: client.name,
          municipalityName: client.municipalityName,
          provinceName: client.provinceName,
          logoUrl: client.logoUrl,
          logoPath: client.logoPath ?? null,
          logoWidth: client.logoWidth ?? null,
          logoHeight: client.logoHeight ?? null,
          logoUpdatedAt: client.logoUpdatedAt ?? null,
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
      const [doc, client] = await Promise.all([
        this.docRef(canonicalClientId).get(),
        ClientModel.getClientById(canonicalClientId),
      ]);
      const data = doc.exists ? doc.data() ?? {} : {};

      return {
        id: doc.exists ? doc.id : canonicalClientId,
        categories: Array.isArray(data.categories) ? data.categories : [],
        contacts: Array.isArray(data.contacts) ? data.contacts : [],
        ...data,
        clientId: canonicalClientId,
        clientName: data.clientName ?? client?.name ?? null,
        municipalityName: data.municipalityName ?? client?.municipalityName ?? null,
        provinceName: data.provinceName ?? client?.provinceName ?? null,
        logoUrl: data.logoUrl ?? client?.logoUrl ?? null,
        logoPath: data.logoPath ?? client?.logoPath ?? null,
        logoWidth: data.logoWidth ?? client?.logoWidth ?? null,
        logoHeight: data.logoHeight ?? client?.logoHeight ?? null,
        logoUpdatedAt: data.logoUpdatedAt ?? client?.logoUpdatedAt ?? null,
      };
    } catch (error) {
      console.error('❌ Error fetching contacts:', error);
      throw error;
    }
  }
}
