import express, { Request } from "express";
import { userProfile } from "../controllers/userProfile";
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

router.use("/profile", async (req: Request, res) => {
    const customReq = req as CustomRequest;
    await userProfile(customReq, res);
});

export default router;