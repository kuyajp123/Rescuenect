import express from 'express';
import authRoutes from './authRoutes';

const adminRouter = express.Router();

adminRouter.use('/auth', authRoutes);

export default adminRouter;
