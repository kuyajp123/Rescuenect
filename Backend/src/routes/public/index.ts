import express from 'express';
import lguRequestRoutes from './lguRequestRoutes';
import psgcRoutes from './psgcRoutes';

const publicRouter = express.Router();

publicRouter.use('/psgc', psgcRoutes);
publicRouter.use('/lgu-requests', lguRequestRoutes);

export default publicRouter;
