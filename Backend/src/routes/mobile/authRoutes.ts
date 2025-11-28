import { SignInController } from '@/controllers/mobile/SignIn.Controller';
import { Router } from 'express';

const authRoutes = Router();

// sign in related routes
authRoutes.post('/signin', SignInController.signIn);

export default authRoutes;
