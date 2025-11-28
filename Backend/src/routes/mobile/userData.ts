import { SignInController } from '@/controllers/mobile/SignIn.Controller';
import { UserDataController } from '@/controllers/mobile/User.Data.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const useDataRoutes = Router();

useDataRoutes.use(AuthMiddleware.verifyToken);

useDataRoutes.post('/saveBarangay', SignInController.saveBarangayController);
useDataRoutes.post('/saveFcmTokenRefresh', SignInController.saveFcmTokenRefreshController);
useDataRoutes.post('/saveUserInfo', SignInController.saveUserInfoController);
useDataRoutes.post('/saveLocation', UserDataController.saveLocationController);
useDataRoutes.get('/getLocations', UserDataController.getLocationsController);
useDataRoutes.delete('/deleteLocation', UserDataController.deleteLocationController);

export default useDataRoutes;
