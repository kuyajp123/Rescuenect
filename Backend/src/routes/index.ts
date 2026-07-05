import { HealthController } from '@/controllers/HealthController';
import { MaintenanceMiddleware } from '@/middlewares/MaintenanceMiddleware';
import { routeRateLimiters } from '@/middlewares/RateLimitMiddleware';
import express from 'express';
import adminRouter from './admin';
import mobileRouter from './mobile';
import publicRouter from './public';
import unifiedRoutes from './unified';

const mainRouter = express.Router();

// Apply maintenance mode middleware to all routes
mainRouter.use(MaintenanceMiddleware.maintenanceModeMiddleware);

// Health check endpoints (no auth required)
mainRouter.get('/health', HealthController.healthCheck);
mainRouter.get('/health/firebase', HealthController.firebaseHealthCheck);
mainRouter.get('/health/full', HealthController.fullHealthCheck);

mainRouter.use('/public/clients', routeRateLimiters.publicRead);
mainRouter.use('/public/mobile-app/latest', routeRateLimiters.publicRead);
mainRouter.use('/public/mobile-app/eas-webhook', routeRateLimiters.publicWrite);
mainRouter.use('/public/psgc', routeRateLimiters.publicRead);
mainRouter.use('/public/lgu-requests', routeRateLimiters.publicWrite);
mainRouter.use('/mobile/api/geoCoding', routeRateLimiters.expensive);
mainRouter.use('/mobile/status/createStatus', routeRateLimiters.expensive);
mainRouter.use('/mobile/danger-zones/createReport', routeRateLimiters.dangerZoneReport);
mainRouter.use('/admin/super', routeRateLimiters.sensitive);
mainRouter.use('/admin', routeRateLimiters.authenticatedApi);
mainRouter.use('/mobile', routeRateLimiters.authenticatedApi);
mainRouter.use('/unified', routeRateLimiters.publicRead);

mainRouter.use('/public', publicRouter);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/mobile', mobileRouter);
mainRouter.use('/unified', unifiedRoutes);

export default mainRouter;
