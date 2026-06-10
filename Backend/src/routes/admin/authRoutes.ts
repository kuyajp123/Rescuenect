import { upload } from '@/config/multer';
import { ContactController } from '@/controllers/admin/Contact.Controller';
import { LoginController } from '@/controllers/admin/Login.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const authRoutes = Router();

authRoutes.post('/signin', AuthMiddleware.verifyToken, LoginController.handleLogin);
authRoutes.post(
  '/upload-client-logo',
  AuthMiddleware.verifyToken,
  AdminMiddleware.requireAdmin,
  upload.single('logo'),
  ContactController.uploadClientLogo
);
authRoutes.post('/update-profile', AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, LoginController.updateProfile);

export default authRoutes;
