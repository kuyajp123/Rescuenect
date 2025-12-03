import { UnifiedController } from '@/controllers/unified/Unified.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const unifiedRoutes = Router();

unifiedRoutes.get('/getCenters', UnifiedController.getCenters);

unifiedRoutes.get('/getNotificationDetails', UnifiedController.getNotificationDetails);

unifiedRoutes.use(AuthMiddleware.verifyToken);

unifiedRoutes.post('/markNotificationAsRead', UnifiedController.markNotificationAsRead);

export default unifiedRoutes;
