import { ensureBucketExists } from '@/components/UploadImageBucket';
import { supabase } from '@/lib/supabase';

export class CarouselImageUploadService {
  private static readonly BUCKET_NAME = 'carousel-slides';

  static async uploadCarouselImage(
    file: Express.Multer.File,
    clientId: string,
    slideId: string
  ): Promise<string> {
    try {
      await ensureBucketExists(this.BUCKET_NAME);

      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const filePath = `${clientId}/${slideId}.${fileExtension}`;

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
            throw new Error(`Failed to upload carousel image after retry: ${retryError.message}`);
          }
        } else {
          throw new Error(`Failed to upload carousel image: ${uploadError.message}`);
        }
      }

      const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);
      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL from Supabase');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Error in uploadCarouselImage:', error);
      throw error;
    }
  }

  static async deleteCarouselImage(imageUrl: string): Promise<void> {
    try {
      if (!imageUrl || imageUrl.trim() === '') return;

      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      const bucketIndex = pathSegments.findIndex(segment => segment === this.BUCKET_NAME);
      if (bucketIndex === -1) {
        throw new Error('Invalid carousel image URL');
      }

      const filePath = pathSegments.slice(bucketIndex + 1).join('/');
      const decodedPath = decodeURIComponent(filePath);

      const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([decodedPath]);
      if (error) {
        console.error('❌ Error deleting carousel image:', error);
      }
    } catch (error) {
      console.error('❌ Error in deleteCarouselImage:', error);
    }
  }
}
