import express, { Request, Response, RequestHandler } from "express";
const router = express.Router();

interface tokenType extends Request {
    googleID: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    birthDate: string;
    picture: string;
}

import verifyToken from "../middleware/verify.token";
router.get("/verifyToken", verifyToken as RequestHandler);

import  userProfile  from "../controllers/user.profile";
router.get("/profile", verifyToken as RequestHandler, async (req, res: Response) => {
    await userProfile(req as tokenType, res);
});

import renewToken from "../middleware/renew.token";
import checkTokenExisitence from "../middleware/check.token.exisitence";
router.get("/renewToken", checkTokenExisitence, renewToken as RequestHandler, verifyToken as RequestHandler);

import logout from "../controllers/logout";
router.get("/logout", logout);

export default router;