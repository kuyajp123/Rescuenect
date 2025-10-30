import express from 'express';
import authRoutes from './authRoutes';
import statusRoutes from './status';

const adminRouter = express.Router();

adminRouter.use('/auth', authRoutes);

adminRouter.use('/status', statusRoutes);

export default adminRouter;
