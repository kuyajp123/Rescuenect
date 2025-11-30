import { db } from '@/db/firestoreConfig';

export class UnifiedModel {
  private static pathRef() {
    return db.collection('centers');
  }

  public static async getCenters() {
    try {
      const snapshot = await this.pathRef().get();
      const centers: any[] = [];
      snapshot.forEach(doc => {
        centers.push({ id: doc.id, ...doc.data() });
      });
      return centers;
    } catch (error) {
      console.error('❌ Error in EvacuationModel.addCenter:', error);
      throw error;
    }
  }
}
