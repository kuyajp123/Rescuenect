import { db } from '@/db/firestoreConfig';

export class SignInModel {
    static async SignUser(email: string, uid: string) {
        try {
        const userSnapshot = await db.collection('admin').where('uid', '==', uid).get();
        if (userSnapshot.empty) {
            const create = await db.collection('admin').doc(uid).create({ email, uid });

            if (!create.writeTime) {
                throw new Error('Failed to create user');
            }
            
            return create.writeTime ? { email, uid } : null;
        }

        return userSnapshot.docs[0].data(); // Return the first matching user
        } catch (error) {
        console.error('Error fetching user by uid:', error);
        throw new Error('Failed to fetch user');
        }
    }
}