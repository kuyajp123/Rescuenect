import express, { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
import { SignInController } from '@/controllers/SignInController';

const router = express.Router();

router.post('/auth/signin', SignInController.signIn);


export default router;