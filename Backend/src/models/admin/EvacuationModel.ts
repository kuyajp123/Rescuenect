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

  public static async getCenters() {
    try {
      const snapshot = await this.pathRef().get();
      const centers: any[] = [];
      snapshot.forEach(doc => {
        centers.push({ id: doc.id, ...doc.data() });
      });
      return centers;
    } catch (error) {
      console.error('❌ Error in EvacuationModel.addCenter:', error);
      throw error;
    }
  }
}
