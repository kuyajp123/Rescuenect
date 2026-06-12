import { CarouselModel } from '@/models/admin/CarouselModel';
import { getClientScopeFromRequest } from '@/utils/adminScope';
import { Request, Response } from 'express';

const MIN_SLIDES = 2;
const MAX_SLIDES = 4;

const sanitizeText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};

export class CarouselController {
  // GET /admin/carousel/all
  static async getSlides(req: Request, res: Response): Promise<void> {
    try {
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'Client ID is required' });
        return;
      }
      const slides = await CarouselModel.getSlidesByClientId(clientId);
      res.status(200).json({ slides });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get carousel slides', error: (error as Error).message });
    }
  }

  // POST /admin/carousel/create
  static async createSlide(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.uid as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'Client ID is required' });
        return;
      }

      const count = await CarouselModel.countByClientId(clientId);
      if (count >= MAX_SLIDES) {
        res.status(400).json({ message: `Maximum of ${MAX_SLIDES} carousel slides allowed.` });
        return;
      }

      const title = sanitizeText(req.body.title, 60);
      if (!title) {
        res.status(400).json({ message: 'Title is required.' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ message: 'Image is required.' });
        return;
      }

      const fields = {
        title,
        subtitle: sanitizeText(req.body.subtitle, 80),
        description: sanitizeText(req.body.description, 300),
        order: Math.min(MAX_SLIDES, Math.max(1, parseInt(req.body.order ?? '1', 10))),
      };

      const slide = await CarouselModel.createSlide(clientId, fields, req.file);
      res.status(201).json({ message: 'Carousel slide created.', slide });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create carousel slide', error: (error as Error).message });
    }
  }

  // PUT /admin/carousel/update/:id
  static async updateSlide(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'Slide ID is required' });
      return;
    }

    try {
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'Client ID is required' });
        return;
      }

      const updates: Record<string, unknown> = {};
      if (typeof req.body.title === 'string') updates.title = sanitizeText(req.body.title, 60);
      if (typeof req.body.subtitle === 'string') updates.subtitle = sanitizeText(req.body.subtitle, 80);
      if (typeof req.body.description === 'string') updates.description = sanitizeText(req.body.description, 300);
      if (req.body.order !== undefined) {
        updates.order = Math.min(MAX_SLIDES, Math.max(1, parseInt(req.body.order, 10)));
      }

      const slide = await CarouselModel.updateSlide(id, clientId, updates, req.file);
      res.status(200).json({ message: 'Carousel slide updated.', slide });
    } catch (error) {
      const status = (error as any).status === 404 ? 404 : 500;
      res.status(status).json({ message: (error as Error).message });
    }
  }

  // DELETE /admin/carousel/delete/:id
  static async deleteSlide(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'Slide ID is required' });
      return;
    }

    try {
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'Client ID is required' });
        return;
      }

      const count = await CarouselModel.countByClientId(clientId);
      if (count <= MIN_SLIDES) {
        res.status(400).json({ message: `At least ${MIN_SLIDES} carousel slides must remain.` });
        return;
      }

      await CarouselModel.deleteSlide(id, clientId);
      res.status(200).json({ message: 'Carousel slide deleted.' });
    } catch (error) {
      const status = (error as any).status === 404 ? 404 : 500;
      res.status(status).json({ message: (error as Error).message });
    }
  }
  // PUT /admin/carousel/reorder
  static async reorderSlides(req: Request, res: Response): Promise<void> {
    try {
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'Client ID is required' });
        return;
      }

      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        res.status(400).json({ message: 'orderedIds array is required' });
        return;
      }

      await CarouselModel.reorderSlides(clientId, orderedIds);
      res.status(200).json({ message: 'Carousel slides reordered.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to reorder carousel slides', error: (error as Error).message });
    }
  }

  // PUT /admin/carousel/save-all
  static async saveAll(req: Request, res: Response): Promise<void> {
    try {
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'Client ID is required' });
        return;
      }

      const payloadStr = req.body.payload;
      if (!payloadStr) {
        res.status(400).json({ message: 'Payload is required' });
        return;
      }

      const payload = JSON.parse(payloadStr);
      const { slides, deletedIds } = payload;
      
      if (!Array.isArray(slides) || !Array.isArray(deletedIds)) {
        res.status(400).json({ message: 'Invalid payload structure' });
        return;
      }

      if (slides.length < MIN_SLIDES) {
        res.status(400).json({ message: `At least ${MIN_SLIDES} carousel slides must remain.` });
        return;
      }
      if (slides.length > MAX_SLIDES) {
        res.status(400).json({ message: `Maximum of ${MAX_SLIDES} carousel slides allowed.` });
        return;
      }

      const files = (req.files as Express.Multer.File[]) || [];

      // Validate titles and required images for new slides
      for (const slide of slides) {
        if (!slide.title || !slide.title.trim()) {
          res.status(400).json({ message: 'All slides must have a title.' });
          return;
        }
        if (slide.isNew && !files.find(f => f.fieldname === slide.imageFieldName)) {
          res.status(400).json({ message: 'New slides must have an image.' });
          return;
        }
      }

      const existingSlides = await CarouselModel.getSlidesByClientId(clientId);
      const existingIds = new Set(existingSlides.map(s => s.id));

      // Verify ownership of edited slides
      for (const slide of slides) {
        if (!slide.isNew && !existingIds.has(slide.id)) {
          res.status(400).json({ message: `Slide ${slide.id} not found or belongs to another client.` });
          return;
        }
      }

      // Verify ownership of deleted slides
      for (const id of deletedIds) {
        if (!existingIds.has(id)) {
          res.status(400).json({ message: `Deleted slide ${id} not found or belongs to another client.` });
          return;
        }
      }

      // Execute Deletions
      for (const id of deletedIds) {
        await CarouselModel.deleteSlide(id, clientId);
      }

      const finalOrderedIds: string[] = [];

      // Execute Creates and Updates
      for (const slide of slides) {
        const file = files.find(f => f.fieldname === slide.imageFieldName);
        
        const fields = {
          title: sanitizeText(slide.title, 60),
          subtitle: sanitizeText(slide.subtitle, 80),
          description: sanitizeText(slide.description, 300),
          order: slide.order
        };

        if (slide.isNew) {
          const newSlide = await CarouselModel.createSlide(clientId, fields, file!);
          finalOrderedIds.push(newSlide.id);
        } else {
          if (slide.isEdited || file) {
            await CarouselModel.updateSlide(slide.id, clientId, fields, file);
          }
          finalOrderedIds.push(slide.id);
        }
      }

      // Execute Reorder
      await CarouselModel.reorderSlides(clientId, finalOrderedIds);

      // Return updated slides
      const savedSlides = await CarouselModel.getSlidesByClientId(clientId);
      res.status(200).json({ message: 'Carousel saved successfully', slides: savedSlides });

    } catch (error) {
      console.error('❌ CarouselController.saveAll:', error);
      res.status(500).json({ message: 'Failed to save carousel slides', error: (error as Error).message });
    }
  }
}
