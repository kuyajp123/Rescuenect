import { upload } from '@/config/multer';
import { CarouselController } from '@/controllers/admin/Carousel.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const carouselRoutes = Router();

carouselRoutes.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireClientAccess);

carouselRoutes.get('/all', CarouselController.getSlides);

carouselRoutes.post(
  '/create',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  upload.single('image'),
  CarouselController.createSlide
);

carouselRoutes.put(
  '/update/:id',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  upload.single('image'),
  CarouselController.updateSlide
);

carouselRoutes.delete(
  '/delete/:id',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  CarouselController.deleteSlide
);

carouselRoutes.put(
  '/reorder',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  CarouselController.reorderSlides
);

carouselRoutes.put(
  '/save-all',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  upload.any(),
  CarouselController.saveAll
);

export default carouselRoutes;
