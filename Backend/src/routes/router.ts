import express, { Request, Response, RequestHandler } from "express";
const router = express.Router();
import { checkTokenExisitence, renewToken, verifyToken } from '@/middleware';

interface tokenType extends Request {
    googleID: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    birthDate: string;
    picture: string;
}

router.get("/verifyToken", verifyToken as RequestHandler);

import { userProfile } from "@/controllers";
router.get("/profile", verifyToken as RequestHandler, async (req, res: Response) => {
    await userProfile(req as tokenType, res);
});

import { imageProxy } from "@/middleware";
router.get("/image-proxy", imageProxy as RequestHandler);


router.get("/renewToken", checkTokenExisitence, renewToken as RequestHandler, verifyToken as RequestHandler);

import logout from "@/controllers/logout";
router.get("/logout", logout);

export default router;