import { supabase } from '@/lib/supabase';

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'status-images';

  static async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('❌ Error listing buckets:', listError);
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        // console.log('🪣 Creating bucket:', this.BUCKET_NAME);

        // Create the bucket
        const { data: createData, error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true, // Make bucket public for easy URL access
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880, // 5MB limit
        });

        if (createError) {
          console.error('❌ Error creating bucket:', createError);
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }

        // console.log('✅ Bucket created successfully:', createData);
      } else {
        // console.log('✅ Bucket already exists:', this.BUCKET_NAME);
      }
    } catch (error) {
      console.error('❌ Error in ensureBucketExists:', error);
      throw error;
    }
  }

  static async uploadStatusImage(
    file: Express.Multer.File,
    userId: string,
    parentId: string,
    versionId: string
  ): Promise<string> {
    try {
      // Ensure bucket exists before uploading
      await this.ensureBucketExists();

      // Generate unique file path (remove duplicate 'status-images' prefix)
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const filePath = `${userId}/${parentId}-${versionId}.${fileExtension}`;

      // console.log('📤 Uploading image to Supabase:', {
      //   bucket: this.BUCKET_NAME,
      //   filePath,
      //   size: file.size,
      //   mimetype: file.mimetype,
      // });

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true, // Replace if exists (for status updates)
        });

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError);

        // If bucket not found, try creating it and retry once
        if (uploadError.message?.includes('Bucket not found')) {
          console.log('🔄 Bucket not found, creating and retrying...');
          await this.ensureBucketExists();

          // Retry upload
          const { data: retryData, error: retryError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });

          if (retryError) {
            throw new Error(`Failed to upload image after retry: ${retryError.message}`);
          }

          console.log('✅ Image uploaded successfully on retry:', retryData.path);
        } else {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
      } else {
        // console.log('✅ Image uploaded successfully:', uploadData.path);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL from Supabase');
      }

      // console.log('✅ Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Error in uploadStatusImage:', error);
      throw error;
    }
  }

  static async deleteStatusImage(imageUrl: string): Promise<void> {
    try {
      if (!imageUrl || imageUrl === '') {
        return; // Nothing to delete
      }

      // Extract file path from public URL
      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      const filePath = pathSegments.slice(-3).join('/'); // userId/filename

      // console.log('🗑️ Deleting image from Supabase:', filePath);

      const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([`status-images/${filePath}`]);

      if (error) {
        console.error('❌ Error deleting image:', error);
        // Don't throw - deletion failure shouldn't break status operations
      } else {
        // console.log('✅ Image deleted successfully');
      }
    } catch (error) {
      console.error('❌ Error in deleteStatusImage:', error);
      // Don't throw - deletion failure shouldn't break status operations
    }
  }

  static async replaceStatusImage(
    oldImageUrl: string,
    newFile: Express.Multer.File,
    userId: string,
    parentId: string,
    versionId: string
  ): Promise<string> {
    try {
      // Delete old image first (optional - upsert handles replacement)
      if (oldImageUrl && oldImageUrl !== '') {
        await this.deleteStatusImage(oldImageUrl);
      }

      // Upload new image
      return await this.uploadStatusImage(newFile, userId, parentId, versionId);
    } catch (error) {
      console.error('❌ Error in replaceStatusImage:', error);
      throw error;
    }
  }
}
