import { ContactController } from '@/controllers/admin/Contact.Controller';
import { upload } from '@/config/multer';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const contactRouter = Router();

contactRouter.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireClientAccess);

contactRouter.get('/getContacts', ContactController.getContacts);
contactRouter.post(
  '/upload-logo',
  AdminMiddleware.blockLguWritesWhenClientDeletionScheduled,
  upload.single('logo'),
  ContactController.uploadClientLogo
);
contactRouter.post('/addContact', AdminMiddleware.blockLguWritesWhenClientDeletionScheduled, ContactController.saveContacts);

export default contactRouter;
