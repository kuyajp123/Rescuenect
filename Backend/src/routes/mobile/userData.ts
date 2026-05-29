import { SignInController } from '@/controllers/mobile/SignIn.Controller';
import { UserDataController } from '@/controllers/mobile/User.Data.Controller';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { ResidentClientMiddleware } from '@/middlewares/ResidentClientMiddleware';
import { Router } from 'express';

const useDataRoutes = Router();

useDataRoutes.get('/locationCoverage', SignInController.getLocationCoverageController);

useDataRoutes.use(AuthMiddleware.verifyToken, AuthMiddleware.requireOwnUid);

useDataRoutes.get('/profile', UserDataController.getProfileController);
useDataRoutes.post(
  '/saveBarangay',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  SignInController.saveBarangayController
);
useDataRoutes.post(
  '/saveUserInfo',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  SignInController.saveUserInfoController
);
useDataRoutes.post(
  '/saveLocation',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  UserDataController.saveLocationController
);
useDataRoutes.get('/getLocations', UserDataController.getLocationsController);
useDataRoutes.delete(
  '/deleteLocation',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  UserDataController.deleteLocationController
);
useDataRoutes.post(
  '/markNotificationAsReadInStatusResolved',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  UserDataController.markNotificationAsReadInStatusResolvedController
);
useDataRoutes.post(
  '/markNotificationAsDeleted',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  UserDataController.markNotificationAsDeletedController
);

// FCM Token Management Routes
useDataRoutes.post(
  '/updateFcmToken',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  UserDataController.updateFcmTokenController
);
useDataRoutes.post(
  '/removeFcmToken',
  ResidentClientMiddleware.blockWritesWhenClientUnavailable,
  UserDataController.removeFcmTokenController
);
useDataRoutes.get('/getFcmTokens', UserDataController.getFcmTokensController);

useDataRoutes.delete('/deleteUser', SignInController.deleteUserController);

export default useDataRoutes;
