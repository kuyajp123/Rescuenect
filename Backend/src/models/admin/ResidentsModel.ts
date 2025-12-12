import { db, withRetry } from '@/db/firestoreConfig';

export class ResidentsModel {
  private static pathRef() {
    return db.collection('users');
  }

  public static async getResidents(): Promise<any[]> {
    try {
      return await withRetry(async () => {
        const snapshot = await this.pathRef().get();
        const residents: any[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          residents.push({
            id: doc.id,
            ...data,
          });
        });
        return residents;
      }, 'ResidentsModel.getResidents');
    } catch (error) {
      console.error('❌ Error in ResidentsModel.getResidents:', error);
      throw error;
    }
  }
}
