import { db } from '@/db/firestoreConfig';

export class EvacuationModel {
  private static pathRef() {
    return db.collection('centers');
  }

  public static async addCenter(data: any) {
    try {
      const docRef = await this.pathRef().add(data);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error in StatusModel.getVersions:', error);
      throw error;   
    }
  }
}
