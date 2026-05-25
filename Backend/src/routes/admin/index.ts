import express from 'express';
import authRoutes from './authRoutes';
import configRoutes from './configRoutes';
import evacuationRoutes from './evacuationRoutes';
import residentsRoutes from './residentsRoutes';
import statusRoutes from './statusRoutes';
import announcementRoutes from './announcementRoutes';
import contactRoutes from './contactRoutes';
import superRoutes from './superRoutes';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';

const adminRouter = express.Router();

adminRouter.use('/auth', authRoutes);

adminRouter.get('/me', AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, (req, res) => {
  res.status(200).json({ user: req.adminUser });
});

adminRouter.use('/super', superRoutes);

adminRouter.use('/status', statusRoutes);

adminRouter.use('/config', configRoutes);

adminRouter.use('/evacuation', evacuationRoutes);

adminRouter.use('/residents', residentsRoutes);

adminRouter.use('/announcement', announcementRoutes);

adminRouter.use('/contacts', contactRoutes);

export default adminRouter;
