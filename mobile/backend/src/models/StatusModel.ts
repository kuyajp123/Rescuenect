import db from "@/db/firebaseConfig";

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
}

export class StatusModel {
    static async saveStatus(data: StatusData): Promise<void> {
        try {
            await db.collection('status').add(data);
        } catch (error) {
            console.error('Error saving status:', error);
            throw new Error('Failed to save status');
        }
    }
} 