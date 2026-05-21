import { db } from '@/db/firestoreConfig';
import { AnnouncementThumbnailUploadService } from '@/services/announcementThumbnailUpload';
import { getEffectiveClientId } from '@/utils/adminScope';
import { FieldValue } from 'firebase-admin/firestore';

export class AnnouncementModel {
  private static pathRef() {
    return db.collection('announcements');
  }

  public static async addAnnouncement(
    data: Record<string, unknown>,
    file: Express.Multer.File | undefined,
    userId: string,
    clientId: string = 'naic'
  ): Promise<string> {
    try {
      const docRef = await this.pathRef().add({
        ...data,
        clientId,
        thumbnail: null,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: userId,
      });

      if (file) {
        const thumbnailUrl = await AnnouncementThumbnailUploadService.uploadAnnouncementThumbnail(
          file,
          userId,
          docRef.id
        );
        await docRef.update({ thumbnail: thumbnailUrl });
      }

      return docRef.id;
    } catch (error) {
      console.error('❌ Error in AnnouncementModel.addAnnouncement:', error);
      throw error;
    }
  }

  public static async updateAnnouncement(
    announcementId: string,
    data: Record<string, unknown>,
    file: Express.Multer.File | undefined,
    userId: string,
    clientId?: string
  ): Promise<void> {
    try {
      const docRef = this.pathRef().doc(announcementId);
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error('Announcement not found');
      }

      if (clientId && getEffectiveClientId(doc.data() ?? {}) !== clientId) {
        throw new Error('Announcement not found');
      }

      const updatePayload: Record<string, unknown> = {
        ...data,
        clientId: clientId || getEffectiveClientId(doc.data() ?? {}),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      };

      if (file) {
        const existingThumbnail = doc.data()?.thumbnail as string | undefined;
        if (existingThumbnail) {
          await AnnouncementThumbnailUploadService.deleteAnnouncementThumbnail(existingThumbnail);
        }
        const thumbnailUrl = await AnnouncementThumbnailUploadService.uploadAnnouncementThumbnail(
          file,
          userId,
          announcementId
        );
        updatePayload.thumbnail = thumbnailUrl;
      }

      await docRef.update(updatePayload);
    } catch (error) {
      console.error('âŒ Error in AnnouncementModel.updateAnnouncement:', error);
      throw error;
    }
  }

  public static async deleteAnnouncement(announcementId: string, clientId?: string): Promise<void> {
    try {
      const docRef = this.pathRef().doc(announcementId);
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error('Announcement not found');
      }

      const data = doc.data();
      if (clientId && getEffectiveClientId(data ?? {}) !== clientId) {
        throw new Error('Announcement not found');
      }
      const thumbnailUrl = data?.thumbnail as string | undefined;

      if (thumbnailUrl) {
        await AnnouncementThumbnailUploadService.deleteAnnouncementThumbnail(thumbnailUrl);
      }

      await docRef.delete();
    } catch (error) {
      console.error('❌ Error in AnnouncementModel.deleteAnnouncement:', error);
      throw error;
    }
  }

  public static async getAnnouncements(clientId?: string): Promise<FirebaseFirestore.DocumentData[]> {
    try {
      const snapshot = await this.pathRef().orderBy('createdAt', 'desc').get();
      const announcements: FirebaseFirestore.DocumentData[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (clientId && getEffectiveClientId(data) !== clientId) return;
        announcements.push({ id: doc.id, ...data, clientId: getEffectiveClientId(data) });
      });
      return announcements;
    } catch (error) {
      console.error('❌ Error in AnnouncementModel.getAnnouncements:', error);
      throw error;
    }
  }
}
