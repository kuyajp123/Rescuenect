import { db } from '@/db/firestoreConfig';
import { AnnouncementThumbnailUploadService } from '@/services/announcementThumbnailUpload';
import { FieldValue } from 'firebase-admin/firestore';

export class AnnouncementModel {
  private static pathRef() {
    return db.collection('announcements');
  }

  public static async addAnnouncement(
    data: Record<string, unknown>,
    file: Express.Multer.File | undefined,
    userId: string
  ): Promise<string> {
    try {
      const docRef = await this.pathRef().add({
        ...data,
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

  public static async deleteAnnouncement(announcementId: string): Promise<void> { 
    try {
      const docRef = this.pathRef().doc(announcementId);
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error('Announcement not found');
      }

      const data = doc.data();
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
}
