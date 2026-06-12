import { upload } from '@/config/multer';
import { ContactController } from '@/controllers/admin/Contact.Controller';
import { LoginController } from '@/controllers/admin/Login.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { routeRateLimiters } from '@/middlewares/RateLimitMiddleware';
import { Router } from 'express';

const authRoutes = Router();

authRoutes.post('/signin', routeRateLimiters.auth, AuthMiddleware.verifyToken, LoginController.handleLogin);
authRoutes.post(
  '/upload-client-logo',
  AuthMiddleware.verifyToken,
  AdminMiddleware.requireAdmin,
  upload.single('logo'),
  ContactController.uploadClientLogo
);
authRoutes.post('/update-profile', AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, LoginController.updateProfile);

authRoutes.post('/complete-onboarding', AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, LoginController.completeOnboarding);

export default authRoutes;
