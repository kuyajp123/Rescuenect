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
                    familyName: data.familyName,
                    givenName: data.givenName || '',
                    name: data.name,
                    photo: data.photo,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await userRef.set(userData);
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
}