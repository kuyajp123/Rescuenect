import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
require('dotenv').config();
const FRONTEND_URL = process.env.FRONTEND_URL!;

interface CustomRequest extends Request {
    googleID: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    birthDate: string;
    picture: string;
}

export const verifyToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token!;
    const refreshToken = req.cookies.refreshToken!;
    const JWT_SECRET = process.env.JWT_SECRET!;

    try {
        if (!token) {
            console.log("Unauthorized");
             res
            .status(401)
            .clearCookie("refreshToken", { httpOnly: true })
            .clearCookie("token", { httpOnly: true });
        } else if (!refreshToken) {
            console.log("Refresh token not found");
             res
            .status(401)
            .clearCookie("refreshToken", { httpOnly: true })
            .clearCookie("token", { httpOnly: true });
        }
        if (!JWT_SECRET) {
            console.log("invalid JWT_SECRET");
            res
            .status(401)
            .clearCookie("refreshToken", { httpOnly: true })
            .clearCookie("token", { httpOnly: true });
        }
        const decoded = jwt.verify(token as string, JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }

}
