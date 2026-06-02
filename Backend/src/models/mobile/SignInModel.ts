import { ClientModel, type DynamicResidentLocationSelection } from '@/models/admin/ClientModel';
import { admin, db } from '@/db/firestoreConfig';
import { FieldValue } from 'firebase-admin/firestore';

export class SignInModel {
  private static userRef = (uid: string) => db.collection('users').doc(uid);
  private static statusRef = (uid: string) => db.collection('status').doc(uid);

  private static normalizeEmail(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  private static async withClientStatus(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const clientId = typeof data.clientId === 'string' && data.clientId.trim() ? data.clientId.trim() : null;
    if (!clientId) {
      return {
        ...data,
        clientStatus: null,
        clientDeletionEffectiveAt: null,
      };
    }

    const client = await ClientModel.getClientById(clientId);
    return {
      ...data,
      clientId: client?.id ?? clientId,
      clientName: client?.name ?? data.clientName,
      clientStatus: client?.status ?? null,
      clientDeletionEffectiveAt: client?.deletionEffectiveAt ?? null,
      clientDeletionStatus: client?.deletionStatus ?? null,
    };
  }

  private static async getLocationUpgrade(data: any): Promise<DynamicResidentLocationSelection | null> {
    if (!data?.barangay || data?.clientId || data?.weatherLocationKey) {
      return null;
    }

    return ClientModel.resolveResidentLocationSelection({ barangay: data.barangay });
  }

  private static async getLocationRefresh(data: any): Promise<DynamicResidentLocationSelection | null> {
    if (!data?.barangay || !data?.clientId) {
      return null;
    }

    return ClientModel.resolveResidentLocationSelection({
      barangay: data.barangay,
      clientId: data.clientId,
      provinceCode: data.provinceCode,
      municipalityCode: data.municipalityCode,
      barangayCode: data.barangayCode,
    });
  }

  private static async deleteStaleResidentProfilesForEmail(activeUid: string, email: unknown): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!activeUid || !normalizedEmail) {
      return;
    }

    const snapshot = await db.collection('users').where('email', '==', normalizedEmail).get();
    if (snapshot.empty) {
      return;
    }

    const batch = db.batch();
    let deleteCount = 0;

    for (const doc of snapshot.docs) {
      if (doc.id === activeUid) {
        continue;
      }

      let isStaleProfile = true;
      try {
        const authUser = await admin.auth().getUser(doc.id);
        isStaleProfile = this.normalizeEmail(authUser.email) !== normalizedEmail;
      } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') {
          throw error;
        }
      }

      if (!isStaleProfile) {
        console.warn(`Duplicate resident Auth identity found for ${normalizedEmail}: ${doc.id}`);
        continue;
      }

      batch.delete(doc.ref);
      deleteCount++;
    }

    if (deleteCount > 0) {
      await batch.commit();
      console.warn(`Deleted ${deleteCount} stale resident profile(s) for ${normalizedEmail}`);
    }
  }

  static async signInUser(uid: string, data: any): Promise<any | null> {
    try {
      await this.deleteStaleResidentProfilesForEmail(uid, data.email);

      const userDoc = await this.userRef(uid).get();
      if (userDoc.exists) {
        const existingData = userDoc.data() ?? {};
        const locationUpdate =
          (await this.getLocationRefresh(existingData)) ?? (await this.getLocationUpgrade(existingData));

        if (locationUpdate) {
          await this.userRef(uid).set(
            {
              ...locationUpdate,
              updatedAt: new Date(),
            },
            { merge: true }
          );
        }

        return this.withClientStatus({
          id: userDoc.id,
          ...existingData,
          ...(locationUpdate ?? {}),
        });
      } else {
        const userData = {
          uid: data.uid,
          email: data.email,
          firstName: data.givenName,
          lastName: data.familyName || '',
          photo: data.photo,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await this.userRef(uid).set(userData, { merge: true });
        return this.withClientStatus({
          id: uid,
          ...userData,
        });
      }
    } catch (error) {
      console.error('Error signing in user:', error);
      throw new Error('Failed to sign in user');
    }
  }

  static async saveBarangay(uid: string, locationSelection: DynamicResidentLocationSelection): Promise<void> {
    try {
      await this.userRef(uid).set(
        {
          ...locationSelection,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch (error: Error | any) {
      console.error('Error saving barangay:', error);
      throw new Error('Failed to save barangay');
    }
  }

  static async saveUserInfo(uid: string, data: any): Promise<void> {
    try {
      const userDoc = await this.userRef(uid).get();
      const existingData = userDoc.exists ? userDoc.data() ?? {} : {};
      const locationUpdate =
        (await this.getLocationRefresh(existingData)) ?? (await this.getLocationUpgrade(existingData));

      await this.userRef(uid).set(
        {
          ...data,
          ...(locationUpdate ?? {}),
        },
        { merge: true }
      );
    } catch (error: Error | any) {
      console.error('Error saving user info:', error);
      throw new Error('Failed to save user info');
    }
  }

  static async deleteUser(uid: string): Promise<void> {
    try {
      await this.hideResidentStatusesForDeletedAccount(uid);
      await this.userRef(uid).delete();
    } catch (error: Error | any) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  private static async hideResidentStatusesForDeletedAccount(uid: string): Promise<void> {
    const snapshot = await this.statusRef(uid).collection('statuses').get();

    if (snapshot.empty) {
      return;
    }

    let batch = db.batch();
    let writes = 0;

    const commitBatch = async () => {
      if (writes === 0) {
        return;
      }

      await batch.commit();
      batch = db.batch();
      writes = 0;
    };

    for (const doc of snapshot.docs) {
      batch.set(
        doc.ref,
        {
          residentVisible: false,
          ownerAccountDeleted: true,
          retainedForAdmin: true,
          accountDeletedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      writes++;

      if (writes >= 450) {
        await commitBatch();
      }
    }

    await commitBatch();
  }
}
