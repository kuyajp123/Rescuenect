import db from '@/db/firestoreConfig';

export class UserDataModel {
  private static pathRef(userId: string) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error(`Invalid userId provided: ${userId}`);
    }

    return db.collection('users').doc(userId.trim());
  }

  static async saveLocationData(userLocationData: {
    uid: string;
    label: string;
    location: string;
    coordinates: { lat: number; lng: number };
  }) {
    try {
      const ref = this.pathRef(userLocationData.uid);
      await ref.set(
        {
          savedLocations: userLocationData,
        },
        { merge: true }
      );
      return userLocationData;
    } catch (error) {
      console.error('Error saving location data:', error);
      throw error;
    }
  }
}
