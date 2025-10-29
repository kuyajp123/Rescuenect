import { Router } from 'express';
import { SignInController } from '@/controllers/mobile/SignIn';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';

const useDataRoutes = Router();

useDataRoutes.use(AuthMiddleware.verifyToken);

useDataRoutes.post('/saveBarangay', SignInController.saveBarangayController);
useDataRoutes.post('/saveUserInfo', SignInController.saveUserInfoController);

export default useDataRoutes;
