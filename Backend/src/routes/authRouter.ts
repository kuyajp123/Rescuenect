import express, { Request, Response, NextFunction } from 'express'
const authRouter = express.Router();
import passport from 'passport';
import { verifyToken } from '../middleware/verifyToken';
import { createToken } from '../middleware/createToken';
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

interface CustomRequest extends express.Request {
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
        const CustomReq = req as CustomRequest;
        try {
            const { user } = CustomReq.user as any;

            CustomReq.googleID = user.googleID;
            CustomReq.email = user.email;
            CustomReq.firstName = user.firstName;
            CustomReq.lastName = user.lastName;
            CustomReq.name = user.name;
            CustomReq.birthDate = user.birthDate;
            CustomReq.picture = user.picture;
            
            await createToken(CustomReq, res, next);
            res.redirect(`${FRONTEND_URL}/profile`);

        } catch (error) {
            next(error);
        }
    }
);




export default authRouter;