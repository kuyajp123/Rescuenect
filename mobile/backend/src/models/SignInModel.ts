import { db } from '@/db/firebaseConfig'

export class SignInModel {
    static async signInUser(uid: string, data: any): Promise<any | null> {
        const userRef = db.collection('users').doc(uid);

        try {
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                return {
                    id: userDoc.id,
                    ...userDoc.data()
                };
            } else {
                const userData = {
                    uid: data.uid,
                    email: data.email,
                    firstName: data.familyName,
                    lastName: data.givenName || '',
                    name: data.name,
                    photo: data.photo,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await userRef.set(userData, { merge: true });
                return {
                    id: userRef.id,
                    ...userData
                };
            }
        } catch (error) {
            console.error("Error signing in user:", error);
            throw new Error("Failed to sign in user");
        }
    }

    static async saveBarangay(uid: string, barangay: string): Promise<void> {
        const userRef = db.collection('users').doc(uid);

       try {
            await userRef.set({ barangay }, { merge: true });
        } catch (error: Error | any) {
            console.error("Error saving barangay:", error);
            throw new Error("Failed to save barangay");
        }
    }

    static async saveUserInfo(uid: string, data: any): Promise<void> {
        const userRef = db.collection('users').doc(uid);

        try {
            await userRef.set(data, { merge: true });
        } catch (error: Error | any) {
            console.error("Error saving user info:", error);
            throw new Error("Failed to save user info");
        }
    }
}