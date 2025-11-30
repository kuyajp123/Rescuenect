import { ensureBucketExists } from '@/components/UploadImageBucket';
import { db } from '@/db/firestoreConfig';
import { supabase } from '@/lib/supabase';
import { FieldValue } from 'firebase-admin/firestore';

export class EvacuationModel {
  private static pathRef() {
    return db.collection('centers');
  }

  public static async addCenter(data: any, files: Express.Multer.File[]): Promise<string> {
    try {
      await ensureBucketExists('evacuation-centers');
      // Save data first, without images, add created_at field
      const docRef = await this.pathRef().add({
        ...data,
        images: [],
        createdAt: FieldValue.serverTimestamp(),
      });

      const fileUrls: string[] = [];

      if (files && Array.isArray(files)) {
        for (const [index, file] of files.entries()) {
          const fileExtension = file.originalname.split('.').pop() || 'jpg';
          const filePath = `evacuation-centers/${docRef.id}/image-${index + 1}.${fileExtension}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('evacuation-centers')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });
          if (uploadError) {
            console.error('❌ Supabase upload error for evacuation center image:', uploadError);
            continue;
          }
          const { data: urlData } = supabase.storage.from('evacuation-centers').getPublicUrl(filePath);
          if (urlData && urlData.publicUrl) {
            fileUrls.push(urlData.publicUrl);
          }
        }
        // Update the document with image URLs
        await docRef.update({ images: fileUrls });
      }
      return docRef.id;
    } catch (error) {
      console.error('❌ Error in EvacuationModel.addCenter:', error);
      throw error;
    }
  }

  public static async deleteCenter(id: string): Promise<void> {
    try {
      // Get the document to find image URLs
      const docRef = this.pathRef().doc(id);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data && Array.isArray(data.images)) {
          // Extract file paths from public URLs
          const filePaths = data.images
            .map((url: string) => {
              const match = url.match(/\/public\/evacuation-centers\/(.+)$/);
              return match ? decodeURIComponent(match[1]) : null;
            })
            .filter((p: string | null) => !!p);
          if (filePaths.length > 0) {
            const { error: deleteError } = await supabase.storage
              .from('evacuation-centers')
              .remove(filePaths as string[]);
            if (deleteError) {
              console.error('❌ Supabase image delete error:', deleteError);
            }
          }
        }
      }
      await docRef.delete();
    } catch (error) {
      console.error('❌ Error in EvacuationModel.deleteCenter:', error);
      throw error;
    }
  }
}
