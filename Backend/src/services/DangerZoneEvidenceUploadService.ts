import { ensureBucketExists } from '@/components/UploadImageBucket';
import { supabase } from '@/lib/supabase';

export class DangerZoneEvidenceUploadService {
  private static readonly BUCKET_NAME = 'danger-zone-evidence';

  private static getFileExtension(originalName: string): string {
    return originalName.split('.').pop() || 'jpg';
  }

  static async uploadEvidenceImage(
    file: Express.Multer.File,
    params: {
      clientId: string;
      dangerZoneId: string;
    }
  ): Promise<string> {
    await ensureBucketExists(this.BUCKET_NAME);

    const extension = this.getFileExtension(file.originalname);
    const filePath = `${params.clientId}/${params.dangerZoneId}/evidence-${Date.now()}.${extension}`;

    const { error } = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

    if (error) {
      throw new Error(`Failed to upload danger-zone evidence: ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for danger-zone evidence');
    }

    return urlData.publicUrl;
  }
}
