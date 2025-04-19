import express, { Request, Response, RequestHandler } from "express";
const router = express.Router();

interface CustomRequest extends Request {
    googleID: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    birthDate: string;
    picture: string;
}

import { verifyToken } from "../middleware/verifyToken";
router.get("/verifyToken", verifyToken as RequestHandler);

import  userProfile  from "../controllers/userProfile";
router.get("/profile", verifyToken as RequestHandler, async (req, res: Response) => {
    await userProfile(req as CustomRequest, res);
});

import renewToken from "../middleware/renewToken";
router.get("/renewToken", renewToken as RequestHandler);

import logout from "../controllers/logout";
router.get("/logout", logout);

export default router;