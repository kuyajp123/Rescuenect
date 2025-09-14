import db from "@/db/firebaseConfig";
import { FieldValue } from "firebase-admin/firestore";

interface StatusData {
    uid: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    statusType: 'safe' | 'evacuated' | 'affected' | 'missing';
    lat: number | null;
    lng: number | null;
    loc?: string | null;
    note: string;
    image: string;
    shareLocation: boolean;
    shareContact: boolean;
    created_at: string;
    updated_at?: string;
}

export class StatusModel {
    private static collection = db.collection("status");

    static async saveStatus(data: StatusData): Promise<void> {
        try {
            const docRef = this.collection.doc(data.uid);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                await docRef.set(
                    {
                        ...data,
                        updated_at: FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
            } else {
                await docRef.set({
                    ...data,
                    created_at: FieldValue.serverTimestamp(),
                    updated_at: FieldValue.serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('Error saving status:', error);
            throw new Error('Failed to save status');
        }
    }

    static async getStatusByUid(uid: string): Promise<StatusData | null> {
        try {
            const docRef = this.collection.doc(uid);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                return docSnap.data() as StatusData;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching status:', error);
            throw new Error('Failed to fetch status');
        }
    }

    static async deleteStatus(uid: string): Promise<void> {
        try {
            const docRef = this.collection.doc(uid);
            await docRef.delete();
        } catch (error) {
            console.error('Error deleting status:', error);
            throw new Error('Failed to delete status');
        }
    }
} 