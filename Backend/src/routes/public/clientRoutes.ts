import { PublicClientController } from '@/controllers/public/Client.Controller';
import { Router } from 'express';

const clientRoutes = Router();

clientRoutes.get('/', PublicClientController.getActiveClients);

export default clientRoutes;
