import { db, withRetry } from '@/db/firestoreConfig';
import { getEffectiveClientId } from '@/utils/adminScope';

export class ResidentsModel {
  private static pathRef() {
    return db.collection('users');
  }

  public static async getResidents(clientId?: string): Promise<any[]> {
    try {
      return await withRetry(async () => {
        const snapshot = await this.pathRef().get();
        const residents: any[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (clientId && getEffectiveClientId(data) !== clientId) {
            return;
          }

          residents.push({
            id: doc.id,
            ...data,
            clientId: getEffectiveClientId(data),
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
