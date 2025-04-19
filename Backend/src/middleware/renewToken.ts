import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
require('dotenv').config();
const FRONTEND_URL = process.env.FRONTEND_URL!;

interface CustomRequest extends Request {
    googleID: string,
    email: string,
    firstName: string,
    lastName: string,
    name: string,
    birthDate: string,
    picture: string
}

const renewToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!;
  const JWT_SECRET = process.env.JWT_SECRET!;

  const refreshToken = req.cookies.refreshToken;
  const accessToken = req.cookies.token;

try {
  if (!refreshToken) {
    console.log("refresh token not found");
    res
    .status(401)
    .clearCookie("refreshToken", { httpOnly: true })
    .clearCookie("token", { httpOnly: true });
    return;
  } else if (accessToken) {
    console.log("access token already exists");
  }

  if (!JWT_REFRESH_TOKEN_SECRET || !JWT_SECRET) {
    console.log("invalid JWT_SECRET or JWT_REFRESH_TOKEN_SECRET");
    res
    .status(401)
    .clearCookie("refreshToken", { httpOnly: true })
    .clearCookie("token", { httpOnly: true });
    return;
  }

    const decoded = jwt.verify(refreshToken as string, JWT_REFRESH_TOKEN_SECRET) as JwtPayload;

    const { userid, email, firstName, lastName, name, birthDate, picture } = decoded;

    const newAccessToken = jwt.sign(
      { userid, email, firstName, lastName, name, birthDate, picture },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res
      .clearCookie("token", { httpOnly: true })
      .cookie("token", newAccessToken, { httpOnly: true });

    next();
  } catch (error) {
    next(error);
  }
};

export default renewToken;
