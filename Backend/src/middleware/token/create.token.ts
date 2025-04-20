import { Response, Request, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface googleAuth extends Request {
    googleID: string;
}

export const createToken = async (req: googleAuth, res: Response, next: NextFunction) => {
    const JWT_SECRET = process.env.JWT_SECRET!
    const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!

    if ( !JWT_SECRET || !JWT_REFRESH_TOKEN_SECRET ){
        res.status(500).json({ success: false, message: 'JWT not provided' });
        return next(new Error('JWT_SECRET or REFERESH_TOKEN is not provided'));
    }

    const googleID = req.googleID;

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;

    try {
        const token = jwt.sign(
            {
                id: uuidv4(),
                issueDate: formattedDate,  
                userid: googleID,
                role: ['user'],
            },
            JWT_SECRET,
            { expiresIn: '1h', algorithm: 'HS256' }
        )

        const refreshToken = jwt.sign(
            {
                id: uuidv4(),
                issueDate: formattedDate, 
                userid: googleID,
            },
            JWT_REFRESH_TOKEN_SECRET,
            { expiresIn: '30d', algorithm: 'HS256' }
        )

        res
            .status(200)
            .cookie('token', token, { httpOnly: true, maxAge: 60 * 60 * 1000 }) // 1 hour
            .cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 60 * 60 * 24 * 30 * 1000 }) // 30 days

        return next();
    } catch (error) {
        return next(error);
    }
    
}

export default createToken;