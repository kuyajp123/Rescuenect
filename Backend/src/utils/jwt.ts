import express, { Response, Request, NextFunction } from "express";
const app = express();
import jwt from 'jsonwebtoken';
require('dotenv').config();

interface CustomRequest extends Request {
    googleID: string;
    email: string;
    firstName: string;
    lastName: string;
}
export const createToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const JWT_SECRET = process.env.JWT_SECRET!
    const REFERESH_TOKEN = process.env.REFERESH_TOKEN!

    if ( !JWT_SECRET || !REFERESH_TOKEN ){
        res.status(500).json({ success: false, message: 'JWT not provided' });
        next(new Error('JWT_SECRET or REFERESH_TOKEN is not provided'));
    }

    const userID = req.googleID;
    const email = req.email;
    const firstName = req.firstName;
    const lastName = req.lastName;
    const name = firstName.concat(' ', lastName);

    let token: string = '';
    let refreshToken: string = '';

    try {
        token = jwt.sign(
            {
                userID: userID,
                email: email,
                name: name
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        )

        refreshToken = jwt.sign(
            {
                userID: userID,
                email: email,
                name: name
            },
            REFERESH_TOKEN,
            { expiresIn: '1h' }
        )
    } catch (error) {
        next(error);
    }

    res
    .status(200)
    .cookie('token', token, { httpOnly: true })
    .cookie('refreshToken', refreshToken, { httpOnly: true })
    .json({ success: true,  message: 'Login successful' })

    console.log(token, refreshToken);

    next();
    
}