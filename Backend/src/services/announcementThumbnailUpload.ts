import { ensureBucketExists } from '@/components/UploadImageBucket';
import { supabase } from '@/lib/supabase';

export class AnnouncementThumbnailUploadService {
  private static readonly BUCKET_NAME = 'announcement-thumbnails';

  static async uploadAnnouncementThumbnail(
    file: Express.Multer.File,
    userId: string,
    announcementId: string
  ): Promise<string> {
    try {
      await ensureBucketExists(this.BUCKET_NAME);

      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const filePath = `${userId}/${announcementId}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError);

        if (uploadError.message?.includes('Bucket not found')) {
          console.log('🔁 Bucket not found, creating and retrying...');
          await ensureBucketExists(this.BUCKET_NAME);

          const { error: retryError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });

          if (retryError) {
            throw new Error(`Failed to upload thumbnail after retry: ${retryError.message}`);
          }
        } else {
          throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
        }
      }

      const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);
      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL from Supabase');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Error in uploadAnnouncementThumbnail:', error);
      throw error;
    }
  }

  static async deleteAnnouncementThumbnail(thumbnailUrl: string): Promise<void> { 
    try {
      if (!thumbnailUrl || thumbnailUrl.trim() === '') {
        return;
      }

      const url = new URL(thumbnailUrl);
      const pathSegments = url.pathname.split('/');
      const bucketIndex = pathSegments.findIndex(segment => segment === this.BUCKET_NAME);
      if (bucketIndex === -1) {
        throw new Error('Invalid thumbnail URL');
      }

      const filePath = pathSegments.slice(bucketIndex + 1).join('/');
      const decodedPath = decodeURIComponent(filePath);

      const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([decodedPath]);
      if (error) {
        console.error('❌ Error deleting announcement thumbnail:', error);
      }
    } catch (error) {
      console.error('❌ Error in deleteAnnouncementThumbnail:', error);
    }
  }
}
