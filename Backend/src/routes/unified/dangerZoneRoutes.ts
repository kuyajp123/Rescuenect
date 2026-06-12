import { DangerZoneController } from '@/controllers/unified/DangerZone.Controller';
import { Router } from 'express';

const dangerZoneRoutes = Router();

dangerZoneRoutes.get('/public', DangerZoneController.getPublic);

export default dangerZoneRoutes;
