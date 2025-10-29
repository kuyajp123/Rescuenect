import { LoginController } from '@/controllers/admin/LoginController';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const authRoutes = Router();

authRoutes.use(AuthMiddleware.verifyToken); 

authRoutes.post('/signin', LoginController.handleLogin);

export default authRoutes;
