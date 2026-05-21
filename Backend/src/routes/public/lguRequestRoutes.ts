import { PublicLguRequestController } from '@/controllers/public/LguRequest.Controller';
import { Router } from 'express';

const lguRequestRoutes = Router();

lguRequestRoutes.post('/', PublicLguRequestController.createRequest);

export default lguRequestRoutes;
