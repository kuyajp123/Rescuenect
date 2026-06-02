import { admin, db, withRetry } from '@/db/firestoreConfig';
import { getEffectiveClientId } from '@/utils/adminScope';

export class ResidentsModel {
  private static pathRef() {
    return db.collection('users');
  }

  private static normalizeEmail(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  private static async getAuthUidByEmail(emails: string[]): Promise<Map<string, string>> {
    const uniqueEmails = Array.from(new Set(emails.filter(Boolean)));
    const authUidByEmail = new Map<string, string>();

    for (let index = 0; index < uniqueEmails.length; index += 100) {
      const chunk = uniqueEmails.slice(index, index + 100);
      const result = await admin.auth().getUsers(chunk.map(email => ({ email })));

      result.users.forEach(user => {
        const email = this.normalizeEmail(user.email);
        if (email) {
          authUidByEmail.set(email, user.uid);
        }
      });
    }

    return authUidByEmail;
  }

  public static async getResidents(clientId?: string): Promise<any[]> {
    try {
      return await withRetry(async () => {
        const snapshot = await this.pathRef().get();
        const residentCandidates: Array<{
          data: FirebaseFirestore.DocumentData;
          docId: string;
          effectiveClientId: string | undefined;
          email: string;
        }> = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          const effectiveClientId = getEffectiveClientId(data);
          if (clientId && effectiveClientId !== clientId) {
            return;
          }

          const email = this.normalizeEmail(data.email);
          if (!email) {
            return;
          }

          residentCandidates.push({
            data,
            docId: doc.id,
            effectiveClientId,
            email,
          });
        });

        const authUidByEmail = await this.getAuthUidByEmail(residentCandidates.map(candidate => candidate.email));
        const residents: any[] = [];

        residentCandidates.forEach(candidate => {
          const authUid = authUidByEmail.get(candidate.email);
          if (!authUid) {
            console.warn(`Skipping orphan resident profile without Auth user: ${candidate.docId} (${candidate.email})`);
            return;
          }

          if (candidate.docId !== authUid) {
            console.warn(
              `Skipping stale resident profile with mismatched Auth UID: ${candidate.docId} (${candidate.email}) -> ${authUid}`
            );
            return;
          }

          residents.push({
            ...candidate.data,
            id: candidate.docId,
            uid: authUid,
            clientId: candidate.effectiveClientId,
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
