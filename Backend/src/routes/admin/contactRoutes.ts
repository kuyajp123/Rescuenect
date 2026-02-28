import { ContactController } from '@/controllers/admin/Contact.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const contactRouter = Router();

contactRouter.use(AuthMiddleware.verifyToken);

contactRouter.get('/getContacts', ContactController.getContacts);
contactRouter.post('/addContact', ContactController.saveContacts);

export default contactRouter;
