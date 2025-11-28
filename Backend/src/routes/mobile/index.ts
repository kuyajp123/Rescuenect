import { Router } from 'express';
import authRoutes from './authRoutes';
import geoCodingRoutes from './geoCoding';
import statusRoutes from './statusRoutes';
import userDataRoutes from './userData';

const mobileRouter = Router();

mobileRouter.use('/auth', authRoutes);

mobileRouter.use('/status', statusRoutes);

mobileRouter.use('/data', userDataRoutes);

mobileRouter.use('/api', geoCodingRoutes);

export default mobileRouter;
