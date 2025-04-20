import { Response, Request } from "express";
import User from "../../models/user";
import jwt from "jsonwebtoken";

interface tokenType extends Request {
    googleID: string;
    email: string,
    firstName: string,
    lastName: string,
    name: string,
    birthDate: string,
    picture: string
}

const userProfile = async (req: tokenType, res: Response) => {
    const token = req.cookies.token!;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const { userid } = decoded as { userid: string };

    try {
        const data = await User.findOne({ userid : userid }).select("-__v -_id -createdAt -updatedAt").lean();
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        } else {
            return res.status(200).json({ data });
        }
        
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching user profile",
            error: (error as Error).message
        });
    }
}

export default userProfile;