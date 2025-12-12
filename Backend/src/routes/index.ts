import { HealthController } from '@/controllers/HealthController';
import express from 'express';
import adminRouter from './admin';
import mobileRouter from './mobile';
import unifiedRoutes from './unified';

const mainRouter = express.Router();

// Health check endpoints (no auth required)
mainRouter.get('/health', HealthController.healthCheck);
mainRouter.get('/health/firebase', HealthController.firebaseHealthCheck);
mainRouter.get('/health/full', HealthController.fullHealthCheck);

mainRouter.use('/admin', adminRouter);
mainRouter.use('/mobile', mobileRouter);
mainRouter.use('/unified', unifiedRoutes);

export default mainRouter;
