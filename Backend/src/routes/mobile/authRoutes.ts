import { SignInController } from '@/controllers/mobile/SignIn.Controller';
import { routeRateLimiters } from '@/middlewares/RateLimitMiddleware';
import { Router } from 'express';

const authRoutes = Router();

// sign in related routes
authRoutes.post('/signin', routeRateLimiters.auth, SignInController.signIn);
// authRoutes.get('/config-diagnostics', SignInController.getConfigDiagnostics);

export default authRoutes;
