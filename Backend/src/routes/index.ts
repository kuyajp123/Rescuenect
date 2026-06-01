import { HealthController } from '@/controllers/HealthController';
import express from 'express';
import adminRouter from './admin';
import internalRouter from './internal';
import mobileRouter from './mobile';
import publicRouter from './public';
import unifiedRoutes from './unified';

const mainRouter = express.Router();

// Health check endpoints (no auth required)
mainRouter.get('/health', HealthController.healthCheck);
mainRouter.get('/health/firebase', HealthController.firebaseHealthCheck);
mainRouter.get('/health/full', HealthController.fullHealthCheck);

mainRouter.use('/public', publicRouter);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/internal', internalRouter);
mainRouter.use('/mobile', mobileRouter);
mainRouter.use('/unified', unifiedRoutes);

export default mainRouter;
