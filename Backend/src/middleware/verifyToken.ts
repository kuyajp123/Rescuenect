import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
require('dotenv').config();

interface CustomRequest extends Request {
    userid: string,
    email: string,
    name: string
}

export const verifyToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET!;

    try {
        if (!token) {
            console.log("invalid token");
        }
        const decoded = jwt.verify(token as string, JWT_SECRET) as JwtPayload;

        req.userid = decoded.id;
        req.email = decoded.email;
        req.name = decoded.name;

        next();
    } catch (error) {
        next(error);
    }

}
