import express from 'express';
import adminRouter from './admin';
import mobileRouter from './mobile';

const mainRouter = express.Router();

mainRouter.use('/admin', adminRouter);
mainRouter.use('/mobile', mobileRouter);

export default mainRouter;
