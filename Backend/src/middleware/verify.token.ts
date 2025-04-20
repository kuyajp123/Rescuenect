import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
require('dotenv').config();
const FRONTEND_URL = process.env.FRONTEND_URL!;

interface tokenType extends Request {
    id: string,
    issueDate: string,
    googleID: string,
    roles?: string[],
}

const verifyToken = async (req: tokenType, res: Response, next: NextFunction) => {
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
            return;
        } else if (!refreshToken) {
            console.log("Refresh token not found");
             res
            .status(401)
            .clearCookie("refreshToken", { httpOnly: true })
            .clearCookie("token", { httpOnly: true });
            return;
        }
        if (!JWT_SECRET) {
            console.log("invalid JWT_SECRET");
            res
            .status(401)
            .clearCookie("refreshToken", { httpOnly: true })
            .clearCookie("token", { httpOnly: true });
            return;
        }
        const decoded = jwt.verify(token as string, JWT_SECRET) as JwtPayload;

        if (!decoded) {
            console.log("Token is invalid or expired");
            res
            .status(401)
            .clearCookie("refreshToken", { httpOnly: true })
            .clearCookie("token", { httpOnly: true });
            return;
        }else{
            res.status(200);
            return next();
        }
    } catch (error) {
        return next(error);
    }

}

export default verifyToken;
