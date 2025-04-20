import express, { Request, Response, NextFunction } from 'express'
const authRouter = express.Router();
import passport from 'passport';
import { createToken } from '../middleware/create.token';
import insertUser from '../controllers/user.controller/insert.user';
const FRONTEND_URL = process.env.FRONTEND_URL!;

authRouter.get('/auth/google', passport.authenticate('google', { 
    scope: [
    'profile',  
    'email',  
    'openid',  
    'https://www.googleapis.com/auth/user.birthday.read'  
    ]
 }
));

interface googleAuth extends express.Request {
    googleID: string;
    email: string,
    firstName: string,
    lastName: string,
    name: string,
    birthDate: string,
    picture: string
}

authRouter.get('/auth/google/callback', passport.authenticate('google', { session: false }), 
    async (req: Request, res: Response, next: NextFunction) => {
        const googleData = req as googleAuth;

        try {
            const { user } = googleData.user as any;

            googleData.googleID = user.googleID;
            googleData.email = user.email;
            googleData.firstName = user.firstName;
            googleData.lastName = user.lastName;
            googleData.birthDate = user.birthDate;
            googleData.picture = user.picture;

            await insertUser(req as googleAuth, res, next);
            await createToken(req as googleAuth, res, next);
            res.redirect(`${FRONTEND_URL}/profile`);
        } catch (error) {
            next(error);
        }
    }
);

export default authRouter;