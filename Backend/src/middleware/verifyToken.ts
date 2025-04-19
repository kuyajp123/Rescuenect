import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
require('dotenv').config();

interface CustomRequest extends Request {
    googleID: string,
    email: string,
    name: string
}

export const verifyToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token!;
    const refreshToken = req.cookies.refreshToken!;
    const JWT_SECRET = process.env.JWT_SECRET! 

    try {
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        } else if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }
        if (!JWT_SECRET) {
            console.log("invalid JWT_SECRET");
        }
        const decoded = jwt.verify(token as string, JWT_SECRET) as JwtPayload;
        req.user = decoded;

    } catch (error) {
        next(error);
    }

}
