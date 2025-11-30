import express from 'express';
import adminRouter from './admin';
import mobileRouter from './mobile';
import unifiedRoutes from './unified';

const mainRouter = express.Router();

mainRouter.use('/admin', adminRouter);
mainRouter.use('/mobile', mobileRouter);
mainRouter.use('/unified', unifiedRoutes);

export default mainRouter;
