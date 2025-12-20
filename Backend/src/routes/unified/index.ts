import { UnifiedController } from '@/controllers/unified/Unified.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const unifiedRoutes = Router();

unifiedRoutes.get('/getCenters', UnifiedController.getCenters);

unifiedRoutes.get('/getNotificationDetails', UnifiedController.getNotificationDetails);

// protected routes in the following

unifiedRoutes.use(AuthMiddleware.verifyToken);

unifiedRoutes.post('/markNotificationAsRead', UnifiedController.markNotificationAsRead);

unifiedRoutes.post('/markNotificationAsHidden', UnifiedController.markNotificationAsHidden);

unifiedRoutes.get('/getResidentStatuses', UnifiedController.getResidentStatuses);

unifiedRoutes.post('/markAllNotificationsAsRead', UnifiedController.markAllNotificationsAsRead);

unifiedRoutes.post('/markAllNotificationsAsHidden', UnifiedController.markAllNotificationsAsHidden);

export default unifiedRoutes;
