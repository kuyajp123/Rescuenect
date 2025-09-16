// import { Request, Response, Router } from 'express';
// import { AuthMiddleware } from '@/middlewares/AuthMiddleware';
// import { SignInController } from '@/controllers/SignInController';
// import { StatusController } from '@/controllers/StatusController';

// const router = Router();

// // sign in related routes 
// router.post('/auth/signin', SignInController.signIn); //


// router.post('/data/saveBarangay', SignInController.saveBarangayController); //
// router.post('/data/saveUserInfo', SignInController.saveUserInfoController); //


// const protectedRoutes = Router();

// // Status related routes
// protectedRoutes.post('/createStatus', StatusController.createStatus);
// protectedRoutes.get('/getStatus/:uid', StatusController.getStatus);

// router.use(AuthMiddleware.verifyToken, protectedRoutes);



// // Protected route example
// router.get('/protected', AuthMiddleware.verifyToken, (req: Request, res: Response) => {
//     res.status(200).json({ message: 'You have accessed a protected route!', user: (req as any).user });
// });

// export default router;