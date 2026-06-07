import express from 'express';
import clientRoutes from './clientRoutes';
import lguRequestRoutes from './lguRequestRoutes';
import mobileAppRoutes from './mobileAppRoutes';
import psgcRoutes from './psgcRoutes';

const publicRouter = express.Router();

publicRouter.use('/clients', clientRoutes);
publicRouter.use('/mobile-app', mobileAppRoutes);
publicRouter.use('/psgc', psgcRoutes);
publicRouter.use('/lgu-requests', lguRequestRoutes);

export default publicRouter;
