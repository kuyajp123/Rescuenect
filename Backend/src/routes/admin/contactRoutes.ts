import { ContactController } from '@/controllers/admin/Contact.Controller';
import { AdminMiddleware } from '@/middlewares/AdminMiddleware';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const contactRouter = Router();

contactRouter.use(AuthMiddleware.verifyToken, AdminMiddleware.requireAdmin, AdminMiddleware.requireClientAccess);

contactRouter.get('/getContacts', ContactController.getContacts);
contactRouter.post('/addContact', ContactController.saveContacts);

export default contactRouter;
