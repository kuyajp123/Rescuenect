import { HealthController } from '@/controllers/HealthController';
import { routeRateLimiters } from '@/middlewares/RateLimitMiddleware';
import express from 'express';
import adminRouter from './admin';
import mobileRouter from './mobile';
import publicRouter from './public';
import unifiedRoutes from './unified';

const mainRouter = express.Router();

// Health check endpoints (no auth required)
mainRouter.get('/health', HealthController.healthCheck);
mainRouter.get('/health/firebase', HealthController.firebaseHealthCheck);
mainRouter.get('/health/full', HealthController.fullHealthCheck);

mainRouter.use('/admin/auth', routeRateLimiters.auth);
mainRouter.use('/mobile/auth', routeRateLimiters.auth);
mainRouter.use('/public/psgc', routeRateLimiters.publicRead);
mainRouter.use('/public/lgu-requests', routeRateLimiters.publicWrite);
mainRouter.use('/mobile/api/geoCoding', routeRateLimiters.expensive);
mainRouter.use('/mobile/status/createStatus', routeRateLimiters.expensive);
mainRouter.use('/admin/super', routeRateLimiters.sensitive);
mainRouter.use('/admin', routeRateLimiters.authenticatedApi);
mainRouter.use('/mobile', routeRateLimiters.authenticatedApi);
mainRouter.use('/unified', routeRateLimiters.publicRead);

mainRouter.use('/public', publicRouter);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/mobile', mobileRouter);
mainRouter.use('/unified', unifiedRoutes);

export default mainRouter;
