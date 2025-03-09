import express from 'express'
const router = express.Router();
import passport from 'passport';

import { createToken } from '../utils/jwt';

router.get('/auth/google', passport.authenticate('google', { 
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
    firstName: string;
    lastName: string;
    userid: string,
    name: string
}

router.get('/auth/google/callback', passport.authenticate('google', { session: false }), 
    (req, res, next) => {
        const { user } = req.user as any;
        
        (req as CustomRequest).googleID = user.googleID;
        (req as CustomRequest).email = user.email;
        (req as CustomRequest).firstName = user.firstName;
        (req as CustomRequest).lastName = user.lastName;

        createToken(req as CustomRequest, res, next).catch(next);
});



export default router;