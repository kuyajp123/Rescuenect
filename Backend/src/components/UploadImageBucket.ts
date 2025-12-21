import { supabase } from '@/lib/supabase';

export async function ensureBucketExists(BUCKET_NAME: string) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      // console.log('🪣 Creating bucket:', BUCKET_NAME);

      // Create the bucket
      const { data: createData, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Make bucket public for easy URL access
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 52428800, // 50MB limit
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
    } else {
      // Update existing bucket limit
      // console.log('✅ Updating existing bucket limit:', BUCKET_NAME);
      const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 52428800, // 50MB limit
      });

      if (updateError) {
        console.warn('⚠️ Failed to update existing bucket limit:', updateError);
      }
    }
  } catch (error) {
    console.error('❌ Error in ensureBucketExists:', error);
    throw error;
  }
}
