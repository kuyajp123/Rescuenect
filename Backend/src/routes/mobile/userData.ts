import { SignInController } from '@/controllers/mobile/SignIn.Controller';
import { UserDataController } from '@/controllers/mobile/User.Data.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { Router } from 'express';

const useDataRoutes = Router();

useDataRoutes.get('/locationCoverage', SignInController.getLocationCoverageController);

useDataRoutes.use(AuthMiddleware.verifyToken, AuthMiddleware.requireOwnUid);

useDataRoutes.get('/profile', UserDataController.getProfileController);
useDataRoutes.post('/saveBarangay', SignInController.saveBarangayController);
useDataRoutes.post('/saveUserInfo', SignInController.saveUserInfoController);
useDataRoutes.post('/saveLocation', UserDataController.saveLocationController);
useDataRoutes.get('/getLocations', UserDataController.getLocationsController);
useDataRoutes.delete('/deleteLocation', UserDataController.deleteLocationController);
useDataRoutes.post(
  '/markNotificationAsReadInStatusResolved',
  UserDataController.markNotificationAsReadInStatusResolvedController
);
useDataRoutes.post('/markNotificationAsDeleted', UserDataController.markNotificationAsDeletedController);

// FCM Token Management Routes
useDataRoutes.post('/updateFcmToken', UserDataController.updateFcmTokenController);
useDataRoutes.post('/removeFcmToken', UserDataController.removeFcmTokenController);
useDataRoutes.get('/getFcmTokens', UserDataController.getFcmTokensController);

useDataRoutes.delete('/deleteUser', SignInController.deleteUserController);

export default useDataRoutes;
