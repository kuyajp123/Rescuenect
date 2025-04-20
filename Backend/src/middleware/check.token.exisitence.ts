import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const checkTokenExisitence = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token!;
    const JWT_SECRET = process.env.JWT_SECRET!;
    const refreshToken = req.cookies.refreshToken!;
    const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!;

    try {
        if (!JWT_REFRESH_TOKEN_SECRET || !JWT_SECRET) {
            console.log("invalid JWT_SECRET or JWT_REFRESH_TOKEN_SECRET");
            res
            .status(401)
            .clearCookie("refreshToken", { httpOnly: true })
            .clearCookie("token", { httpOnly: true });
            return;
        }

        if (!refreshToken) {
            console.log("refresh token not found");
            res
            .status(401)
            .clearCookie("refreshToken", { httpOnly: true })
            .clearCookie("token", { httpOnly: true });
            return;
        }

        if (token) {
            const decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload;
            const { userid } = decodedToken ;

            let refreshTokenUserid: JwtPayload["userid"] = null;
            const decodedRefreshToken = jwt.verify(refreshToken, JWT_REFRESH_TOKEN_SECRET) as JwtPayload;
            if (typeof decodedRefreshToken === "object" && "userid" in decodedRefreshToken) {
                refreshTokenUserid = decodedRefreshToken.userid;
            }

            if (userid !== refreshTokenUserid) {
                res
                .status(401)
                .clearCookie("token", { httpOnly: true })
                .clearCookie("refreshToken", { httpOnly: true });
                return;
            } else {
                return next();
            }
        }
        
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            res
            .status(401)
            .redirect("/renewToken");
            return;
        }
        return next(error);
    }
}

export default checkTokenExisitence;