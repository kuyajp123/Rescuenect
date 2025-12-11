import { db } from '@/db/firestoreConfig';

export class SignInModel {
  private static userRef = (uid: string) => db.collection('users').doc(uid);

  static async signInUser(uid: string, data: any): Promise<any | null> {
    try {
      const userDoc = await this.userRef(uid).get();
      if (userDoc.exists) {
        return {
          id: userDoc.id,
          ...userDoc.data(),
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

  static async saveBarangay(uid: string, barangay: string): Promise<void> {
    try {
      await this.userRef(uid).set({ barangay }, { merge: true });
    } catch (error: Error | any) {
      console.error('Error saving barangay:', error);
      throw new Error('Failed to save barangay');
    }
  }

  static async saveUserInfo(uid: string, data: any): Promise<void> {
    try {
      await this.userRef(uid).set(data, { merge: true });
    } catch (error: Error | any) {
      console.error('Error saving user info:', error);
      throw new Error('Failed to save user info');
    }
  }
}
