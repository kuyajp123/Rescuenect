import express from 'express';
import authRoutes from './authRoutes';
import configRoutes from './configRoutes';
import evacuationRoutes from './evacuationRoutes';
import statusRoutes from './statusRoutes';

const adminRouter = express.Router();

adminRouter.use('/auth', authRoutes);

adminRouter.use('/status', statusRoutes);

adminRouter.use('/config', configRoutes);

adminRouter.use('/evacuation', evacuationRoutes);

export default adminRouter;
