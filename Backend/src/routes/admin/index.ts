import express from 'express';
import authRoutes from './authRoutes';
import configRoutes from './configRoutes';
import statusRoutes from './status';

const adminRouter = express.Router();

adminRouter.use('/auth', authRoutes);

adminRouter.use('/status', statusRoutes);

adminRouter.use('/config', configRoutes);

export default adminRouter;
