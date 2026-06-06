import express from 'express';
import clientRoutes from './clientRoutes';
import lguRequestRoutes from './lguRequestRoutes';
import psgcRoutes from './psgcRoutes';

const publicRouter = express.Router();

publicRouter.use('/clients', clientRoutes);
publicRouter.use('/psgc', psgcRoutes);
publicRouter.use('/lgu-requests', lguRequestRoutes);

export default publicRouter;
