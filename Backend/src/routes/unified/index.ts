import { UnifiedController } from '@/controllers/unified/Unified.Controller';
import { Router } from 'express';

const unifiedRoutes = Router();

unifiedRoutes.get('/getCenters', UnifiedController.getCenters);

unifiedRoutes.get('/getNotificationDetails', UnifiedController.getNotificationDetails);

export default unifiedRoutes;
