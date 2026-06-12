import { Router } from 'express';
import authRoutes from './authRoutes';
import dangerZoneRoutes from './dangerZoneRoutes';
import geoCodingRoutes from './geoCoding';
import statusRoutes from './statusRoutes';
import userDataRoutes from './userData';

const mobileRouter = Router();

mobileRouter.use('/auth', authRoutes);

mobileRouter.use('/status', statusRoutes);

mobileRouter.use('/danger-zones', dangerZoneRoutes);

mobileRouter.use('/data', userDataRoutes);

mobileRouter.use('/api', geoCodingRoutes);

export default mobileRouter;
