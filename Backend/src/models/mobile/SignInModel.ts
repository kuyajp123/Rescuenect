import { resolveResidentLocationSelection, type ResidentLocationSelection } from '@/config/locationConfig';
import type { DynamicResidentLocationSelection } from '@/models/admin/ClientModel';
import { db } from '@/db/firestoreConfig';

export class SignInModel {
  private static userRef = (uid: string) => db.collection('users').doc(uid);

  private static getLocationUpgrade(data: any): ResidentLocationSelection | null {
    if (!data?.barangay || data?.clientId || data?.weatherLocationKey) {
      return null;
    }

    return resolveResidentLocationSelection({ barangay: data.barangay });
  }

  static async signInUser(uid: string, data: any): Promise<any | null> {
    try {
      const userDoc = await this.userRef(uid).get();
      if (userDoc.exists) {
        const existingData = userDoc.data() ?? {};
        const locationUpgrade = this.getLocationUpgrade(existingData);

        if (locationUpgrade) {
          await this.userRef(uid).set(
            {
              ...locationUpgrade,
              updatedAt: new Date(),
            },
            { merge: true }
          );
        }

        return {
          id: userDoc.id,
          ...existingData,
          ...(locationUpgrade ?? {}),
        };
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
        return {
          id: uid,
          ...userData,
        };
      }
    } catch (error) {
      console.error('Error signing in user:', error);
      throw new Error('Failed to sign in user');
    }
  }

  static async saveBarangay(uid: string, locationSelection: ResidentLocationSelection | DynamicResidentLocationSelection): Promise<void> {
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
      const locationUpgrade = this.getLocationUpgrade(existingData);

      await this.userRef(uid).set(
        {
          ...data,
          ...(locationUpgrade ?? {}),
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
      await this.userRef(uid).delete();
    } catch (error: Error | any) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
}
