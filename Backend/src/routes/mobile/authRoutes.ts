import { SignInController } from '@/controllers/mobile/SignIn.Controller';
import { Router } from 'express';

const authRoutes = Router();

// sign in related routes
authRoutes.post('/signin', SignInController.signIn);
authRoutes.get('/config-diagnostics', SignInController.getConfigDiagnostics);

export default authRoutes;
