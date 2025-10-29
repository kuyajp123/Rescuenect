import { Router } from 'express';
import { SignInController } from '@/controllers/mobile/SignIn';

const authRoutes = Router();

// sign in related routes
authRoutes.post('/signin', SignInController.signIn);

export default authRoutes;
