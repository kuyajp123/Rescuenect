import { Response, Request } from "express";

interface CustomRequest extends Request {
    googleID: string;
    email: string,
    firstName: string,
    lastName: string,
    name: string,
    birthDate: string,
    picture: string
}

const userProfile = async (req: CustomRequest, res: Response) => {

    try {
        const { userID, email, name, firstName, lastName, birthDate, picture } = req.user as any;
        res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: {
                userID,
                email,
                name,
                firstName,
                lastName,
                birthDate,
                picture
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching user profile",
            error: (error as Error).message
        });
    }
}

export default userProfile;