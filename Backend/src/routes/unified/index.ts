import { Router } from 'express';
import { UnifiedController } from '@/controllers/unified/Unified.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';

const unifiedRoutes = Router();

unifiedRoutes.use(AuthMiddleware.verifyToken);

unifiedRoutes.get('/getCenters', UnifiedController.getCenters);

export default unifiedRoutes;