import { Response, Request, NextFunction } from "express";
import jwt from 'jsonwebtoken';
require('dotenv').config();

interface CustomRequest extends Request {
    googleID: string,
    email: string,
    firstName: string,
    lastName: string,
    name: string,
    birthDate: string,
    picture: string
}
export const createToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const JWT_SECRET = process.env.JWT_SECRET!
    const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!

    if ( !JWT_SECRET || !JWT_REFRESH_TOKEN_SECRET ){
        res.status(500).json({ success: false, message: 'JWT not provided' });
        next(new Error('JWT_SECRET or REFERESH_TOKEN is not provided'));
    }

    const userid = req.googleID;
    const email = req.email;
    const name = req.name;

    let token: string = '';
    let refreshToken: string = '';

    try {
        token = jwt.sign(
            {
                userid: userid,
                email: email,
                firstName: req.firstName,
                lastName: req.lastName,
                name: name,
                birthDate: req.birthDate,
                picture: req.picture
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        )

        refreshToken = jwt.sign(
            {
                userid: userid,
                email: email,
                firstName: req.firstName,
                lastName: req.lastName,
                name: name,
                birthDate: req.birthDate,
                picture: req.picture
            },
            JWT_REFRESH_TOKEN_SECRET,
            { expiresIn: '30d' }
        )
    } catch (error) {
        next(error);
    }

    res
    .status(200)
    .cookie('token', token, { httpOnly: true, maxAge: 60 * 60 * 1000 }) // 1 hour
    .cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 60 * 60 * 24 * 30 * 1000 }) // 30 days
    // .json({ success: true,  message: 'Login successful' })
    
}