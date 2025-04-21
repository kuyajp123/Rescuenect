import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();
const FRONTEND_URL = process.env.FRONTEND_URL!;
import getDateNow from "@/utils/date.now";

interface tokenType extends Request {
    googleID: string,
    email: string,
    firstName: string,
    lastName: string,
    name: string,
    birthDate: string,
    picture: string
}

export const renewToken = async (req: tokenType, res: Response, next: NextFunction) => {
  const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!;
  const JWT_SECRET = process.env.JWT_SECRET!;
  const refreshToken = req.cookies.refreshToken;

try {
    const decoded = jwt.verify(refreshToken as string, JWT_REFRESH_TOKEN_SECRET) as JwtPayload;

    if (!decoded) {
      res.status(401).clearCookie("refreshToken", { httpOnly: true }).redirect(FRONTEND_URL);
      return;
    }

    const { userid } = decoded;
    const formattedDate = getDateNow();

    const newAccessToken = jwt.sign(
      { 
        id: uuidv4(),
        issueDate: formattedDate,
        userid,
        role: ['user'],
      },
      JWT_SECRET,
      { expiresIn: "1h", algorithm: 'HS256' }
    );

    res
      .status(200)
      .clearCookie("token", { httpOnly: true })
      .cookie("token", newAccessToken, { httpOnly: true, maxAge: 60 * 60 * 1000 });

    return next();
  } catch (error) {
    return next(error);
  }
};

export default renewToken;
