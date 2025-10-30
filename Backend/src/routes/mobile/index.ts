import { Router } from 'express';
import authRoutes from './auth';
import geoCodingRoutes from './geoCoding';
import statusRoutes from './status';
import userDataRoutes from './userData';

const mobileRouter = Router();

mobileRouter.use('/auth', authRoutes);

mobileRouter.use('/status', statusRoutes);

mobileRouter.use('/data', userDataRoutes);

mobileRouter.use('/api', geoCodingRoutes);

export default mobileRouter;
