import express from 'express';
import authRoutes from './authRoutes';

const router = express.Router();

// router.post('/auth/signin', AuthMiddleware.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
//     await LoginController.handleLogin(req, res);
// });

router.use('/auth', authRoutes);

export default router;
