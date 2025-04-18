import express from 'express'
const authRouter = express.Router();
import passport from 'passport';
import { verifyToken } from '../middleware/verifyToken';
import { createToken } from '../controllers/createToken';
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
    async (req, res, next) => {
        try {
            const { user } = req.user as any;
            // console.log({ user });

            (req as CustomRequest).googleID = user.googleID;
            (req as CustomRequest).email = user.email;
            (req as CustomRequest).firstName = user.firstName;
            (req as CustomRequest).lastName = user.lastName;
            (req as CustomRequest).name = user.name;
            (req as CustomRequest).birthDate = user.birthDate;
            (req as CustomRequest).picture = user.picture;
            
            await createToken(req as CustomRequest, res, next);
            await verifyToken(req as CustomRequest, res, next);

            res.redirect(`${FRONTEND_URL}/profile`);
            // res.redirect(`http://localhost:4000/dashboard`);

        } catch (error) {
            next(error);
        }
    }
);




export default authRouter;