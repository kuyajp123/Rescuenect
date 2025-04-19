import express, { Request } from "express";
import { verifyToken } from "../middleware/verifyToken";
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

import  userProfile  from "../controllers/userProfile";
router.get("/profile", async (req, res) => {
    await verifyToken(req as CustomRequest, res, (error) => {
        if (error) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    });
    const customReq = req as CustomRequest;
    await userProfile(customReq, res);
});

import logout from "../controllers/logOut";
router.get("/logout", logout);

export default router;