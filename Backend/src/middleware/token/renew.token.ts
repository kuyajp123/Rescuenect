import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
require('dotenv').config();
const FRONTEND_URL = process.env.FRONTEND_URL!;

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
    const { userid, email, firstName, lastName, name, birthDate, picture } = decoded;

    const newAccessToken = jwt.sign(
      { userid, email, firstName, lastName, name, birthDate, picture },
      JWT_SECRET,
      { expiresIn: "1h" }
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
