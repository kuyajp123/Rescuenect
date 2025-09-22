import db from "@/db/firebaseConfig";
import { FieldValue } from "firebase-admin/firestore";
import isEqual from "lodash/isEqual";

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
    createdAt: string;
    archivedAt?: string | null;
}

export class StatusModel {
    private static collection = db.collection("status");

    static async saveStatus(data: StatusData): Promise<void> {
        try {
            const docRef = this.collection.doc(data.uid);
            const docSnap = await docRef.get();
            const docData = docSnap.data();

            if (docSnap.exists && docData) {
            // Remove timestamps and system fields before comparison
            const { createdAt, updatedAt, archivedAt, ...cleanExistingDoc } = docData;
            const { createdAt: incomingCreatedAt, archivedAt: incomingArchivedAt, ...cleanIncomingData } = data;
            
            const isSame = isEqual(cleanExistingDoc, cleanIncomingData);

            if (!isSame) {
                // Archive the old record in history
                await docRef.collection("history").add({
                ...docData,
                archivedAt: FieldValue.serverTimestamp(),
                });

                console.log("📚 Old record archived to history");

                // Update the main doc
                await docRef.set(
                {
                    ...data,
                    updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
                );

                console.log("✅ Updated and history saved");
            } else {
                console.log("⏸️ No changes detected, nothing saved");
            }
            } else {
            // Create new doc if none exists
            await docRef.set({
                ...data,
                createdAt: FieldValue.serverTimestamp(),
            });
            console.log("New status created ✅");
            }
        } catch (error) {
            console.error("Error saving status:", error);
            throw new Error("Failed to save status");
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