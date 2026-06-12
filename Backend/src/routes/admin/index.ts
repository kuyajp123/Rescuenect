import express from 'express';
import authRoutes from './authRoutes';
import configRoutes from './configRoutes';
import evacuationRoutes from './evacuationRoutes';
import residentsRoutes from './residentsRoutes';
import statusRoutes from './statusRoutes';
import announcementRoutes from './announcementRoutes';
import contactRoutes from './contactRoutes';
import lguRoutes from './lguRoutes';
import superRoutes from './superRoutes';
import carouselRoutes from './carouselRoutes';
import dangerZoneRoutes from './dangerZoneRoutes';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';

const adminRouter = express.Router();

adminRouter.use('/auth', authRoutes);

adminRouter.get(
  '/me',
  AuthMiddleware.verifyToken,
  AdminMiddleware.requireAdmin,
  AdminMiddleware.requireClientAccess,
  (req, res) => {
    res.status(200).json({ user: req.adminUser });
  }
);

adminRouter.use('/super', superRoutes);
adminRouter.use('/lgu', lguRoutes);

adminRouter.use('/status', statusRoutes);

adminRouter.use('/config', configRoutes);

adminRouter.use('/evacuation', evacuationRoutes);

adminRouter.use('/danger-zones', dangerZoneRoutes);

adminRouter.use('/residents', residentsRoutes);

adminRouter.use('/announcement', announcementRoutes);

adminRouter.use('/contacts', contactRoutes);

adminRouter.use('/carousel', carouselRoutes);

export default adminRouter;
