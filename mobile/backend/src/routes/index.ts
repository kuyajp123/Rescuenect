import { Router } from 'express';
import authRoutes from './authRoutes';
import userDataRoutes from './userDataRoutes';
import statusRoutes from './statusRoutes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/data', userDataRoutes);

router.use('/status', statusRoutes);


export default router;