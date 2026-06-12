import { db } from '@/db/firestoreConfig';
import { CarouselImageUploadService } from '@/services/CarouselImageUploadService';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'carouselSlides';

export interface CarouselSlide {
  id: string;
  clientId: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  order: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const serialize = (id: string, data: FirebaseFirestore.DocumentData): CarouselSlide => ({
  id,
  clientId: data.clientId ?? '',
  title: data.title ?? '',
  subtitle: data.subtitle ?? '',
  description: data.description ?? '',
  imageUrl: data.imageUrl ?? '',
  order: data.order ?? 1,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export class CarouselModel {
  private static col() {
    return db.collection(COLLECTION);
  }

  public static async getSlidesByClientId(clientId: string): Promise<CarouselSlide[]> {
    try {
      const snap = await this.col().where('clientId', '==', clientId).orderBy('order', 'asc').get();
      return snap.docs.map(d => serialize(d.id, d.data()));
    } catch (error) {
      console.error('❌ CarouselModel.getSlidesByClientId:', error);
      throw error;
    }
  }

  public static async countByClientId(clientId: string): Promise<number> {
    const snap = await this.col().where('clientId', '==', clientId).get();
    return snap.size;
  }

  public static async createSlide(
    clientId: string,
    fields: { title: string; subtitle: string; description: string; order: number },
    file: Express.Multer.File
  ): Promise<CarouselSlide> {
    try {
      const docRef = this.col().doc();
      const imageUrl = await CarouselImageUploadService.uploadCarouselImage(file, clientId, docRef.id);
      const now = FieldValue.serverTimestamp();
      await docRef.set({ clientId, ...fields, imageUrl, createdAt: now, updatedAt: now });
      const created = await docRef.get();
      return serialize(docRef.id, created.data()!);
    } catch (error) {
      console.error('❌ CarouselModel.createSlide:', error);
      throw error;
    }
  }

  public static async updateSlide(
    id: string,
    clientId: string,
    updates: Record<string, unknown>,
    file?: Express.Multer.File
  ): Promise<CarouselSlide> {
    try {
      const docRef = this.col().doc(id);
      const snap = await docRef.get();

      if (!snap.exists || snap.data()?.clientId !== clientId) {
        throw Object.assign(new Error('Carousel slide not found.'), { status: 404 });
      }

      if (file) {
        const oldUrl = snap.data()?.imageUrl as string | undefined;
        if (oldUrl) await CarouselImageUploadService.deleteCarouselImage(oldUrl);
        updates.imageUrl = await CarouselImageUploadService.uploadCarouselImage(file, clientId, id);
      }

      updates.updatedAt = FieldValue.serverTimestamp();
      await docRef.update(updates);
      const updated = await docRef.get();
      return serialize(id, updated.data()!);
    } catch (error) {
      console.error('❌ CarouselModel.updateSlide:', error);
      throw error;
    }
  }

  public static async deleteSlide(id: string, clientId: string): Promise<void> {
    try {
      const docRef = this.col().doc(id);
      const snap = await docRef.get();

      if (!snap.exists || snap.data()?.clientId !== clientId) {
        throw Object.assign(new Error('Carousel slide not found.'), { status: 404 });
      }

      const imageUrl = snap.data()?.imageUrl as string | undefined;
      if (imageUrl) await CarouselImageUploadService.deleteCarouselImage(imageUrl);

      await docRef.delete();
    } catch (error) {
      console.error('❌ CarouselModel.deleteSlide:', error);
      throw error;
    }
  }
  public static async reorderSlides(clientId: string, orderedIds: string[]): Promise<void> {
    try {
      const existingSnap = await this.col().where('clientId', '==', clientId).get();
      const validIds = new Set(existingSnap.docs.map(d => d.id));

      const batch = db.batch();
      const now = FieldValue.serverTimestamp();

      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        if (validIds.has(id)) {
          const docRef = this.col().doc(id);
          batch.update(docRef, { order: i + 1, updatedAt: now });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('❌ CarouselModel.reorderSlides:', error);
      throw error;
    }
  }
}
