import { Request, Response } from "express";

const logout = (req: Request, res: Response) => {

    res.status(200)
        .clearCookie("token")
        .clearCookie("refreshToken")
        .redirect(process.env.FRONTEND_URL!);
}

export default logout;