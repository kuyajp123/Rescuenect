import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const checkTokenExisitence = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token!;
    const JWT_SECRET = process.env.JWT_SECRET!;
    const refreshToken = req.cookies.refreshToken!;
    const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!;

    try {
        if (token) {
            const decodedToken = jwt.verify(token, JWT_SECRET);
            const decodedRefreshToken = jwt.verify(refreshToken, JWT_REFRESH_TOKEN_SECRET);
            
            
        }
        
    } catch (error) {
        next(error);
    }
}