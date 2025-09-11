import express, { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { SignInController } from '@/controllers/SignInController';
import { StatusController } from '@/controllers/StatusController';

const router = express.Router();

// sign in related routes 
router.post('/auth/signin', SignInController.signIn);
router.post('/save/barangay', SignInController.saveBarangayController);
router.post('/save/userInfo', SignInController.saveUserInfoController);


// Status related routes
router.post('/createStatus', StatusController.createStatus);


export default router;