import { ensureBucketExists } from '@/components/UploadImageBucket';
import { db } from '@/db/firestoreConfig';
import { supabase } from '@/lib/supabase';
import { DocumentReference, FieldValue } from 'firebase-admin/firestore';

export class EvacuationModel {
  private static readonly BUCKET_NAME = 'evacuation-centers';

  private static pathRef() {
    return db.collection('centers');
  }

  private static getFileExtension(originalName: string): string {
    return originalName.split('.').pop() || 'jpg';
  }

  private static getFilePathFromPublicUrl(url: string): string | null {
    try {
      const pathname = new URL(url).pathname;
      const marker = `/public/${this.BUCKET_NAME}/`;
      const markerIndex = pathname.indexOf(marker);

      if (markerIndex === -1) {
        return null;
      }

      return decodeURIComponent(pathname.slice(markerIndex + marker.length));
    } catch {
      return null;
    }
  }

  private static getPublicUrl(filePath: string): string {
    const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for evacuation center image');
    }

    return urlData.publicUrl;
  }

  private static async uploadImage(file: Express.Multer.File, filePath: string): Promise<string> {
    const { error: uploadError } = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

    if (uploadError) {
      throw new Error(`Failed to upload evacuation center image: ${uploadError.message}`);
    }

    return this.getPublicUrl(filePath);
  }

  private static async removeImages(filePaths: string[]): Promise<void> {
    if (filePaths.length === 0) {
      return;
    }

    try {
      const { error: deleteError } = await supabase.storage.from(this.BUCKET_NAME).remove(filePaths);

      if (deleteError) {
        console.error('Supabase image delete error:', deleteError);
      }
    } catch (error) {
      console.error('Supabase image cleanup failed:', error);
    }
  }

  public static async addCenter(data: any, files: Express.Multer.File[]): Promise<string> {
    let docRef: DocumentReference | null = null;
    const uploadedFilePaths: string[] = [];

    try {
      await ensureBucketExists(this.BUCKET_NAME);

      // Create the Firestore document first so file paths can include its ID.
      docRef = await this.pathRef().add({
        ...data,
        images: [],
        createdAt: FieldValue.serverTimestamp(),
      });

      const fileUrls: string[] = [];

      if (files && Array.isArray(files)) {
        for (const [index, file] of files.entries()) {
          const fileExtension = this.getFileExtension(file.originalname);
          const filePath = `${this.BUCKET_NAME}/${docRef.id}/image-${index + 1}.${fileExtension}`;
          const publicUrl = await this.uploadImage(file, filePath);

          uploadedFilePaths.push(filePath);
          fileUrls.push(publicUrl);
        }
      }

      await docRef.update({ images: fileUrls });
      return docRef.id;
    } catch (error) {
      console.error('Error in EvacuationModel.addCenter:', error);
      await this.removeImages(uploadedFilePaths);

      if (docRef) {
        try {
          await docRef.delete();
        } catch (cleanupError) {
          console.error('Failed to delete partial evacuation center document:', cleanupError);
        }
      }

      throw error;
    }
  }

  public static async deleteCenter(id: string): Promise<void> {
    try {
      const docRef = this.pathRef().doc(id);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const data = docSnap.data();

        if (data && Array.isArray(data.images)) {
          const filePaths = data.images
            .map((url: string) => this.getFilePathFromPublicUrl(url))
            .filter((path: string | null): path is string => Boolean(path));

          await this.removeImages(filePaths);
        }
      }

      await docRef.delete();
    } catch (error) {
      console.error('Error in EvacuationModel.deleteCenter:', error);
      throw error;
    }
  }

  public static async updateCenter(
    id: string,
    data: any,
    newFiles: Express.Multer.File[],
    keptImages: string[]
  ): Promise<void> {
    const uploadedFilePaths: string[] = [];

    try {
      await ensureBucketExists(this.BUCKET_NAME);
      const docRef = this.pathRef().doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new Error('Evacuation center not found');
      }

      const currentData = docSnap.data();
      const currentImages = (currentData?.images as string[]) || [];
      const imagesToDelete = currentImages.filter(img => !keptImages.includes(img));

      const newImageUrls: string[] = [];
      if (newFiles && Array.isArray(newFiles)) {
        for (const [index, file] of newFiles.entries()) {
          const fileExtension = this.getFileExtension(file.originalname);
          const timestamp = Date.now();
          const filePath = `${this.BUCKET_NAME}/${docRef.id}/image-${timestamp}-${index}.${fileExtension}`;
          const publicUrl = await this.uploadImage(file, filePath);

          uploadedFilePaths.push(filePath);
          newImageUrls.push(publicUrl);
        }
      }

      const finalImages = [...keptImages, ...newImageUrls];

      await docRef.update({
        ...data,
        images: finalImages,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const filePathsToDelete = imagesToDelete
        .map(url => this.getFilePathFromPublicUrl(url))
        .filter((path: string | null): path is string => Boolean(path));

      await this.removeImages(filePathsToDelete);
    } catch (error) {
      console.error('Error in EvacuationModel.updateCenter:', error);
      await this.removeImages(uploadedFilePaths);
      throw error;
    }
  }
}
