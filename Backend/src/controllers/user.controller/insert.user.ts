import User from "../../models/user";
import { Response, Request, NextFunction } from "express";

interface UserType extends Request {
    googleID: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    birthDate: string;
    picture: string;
}

const insertUser = async (req: any, _: Response, next: NextFunction) => {

    const googleID = req.googleID as UserType;
    const email = req.email as UserType;
    const firstName = req.firstName as UserType;
    const lastName = req.lastName as UserType;
    const name = req.name as UserType;
    const birthDate = req.birthDate as UserType;
    const picture = req.picture as UserType;

    try {
        const user = await User.findOne({ userid: googleID });

        if (!user) {
            const newUser = new User({
                userid: googleID,
                email: email,
                firstName: firstName,
                lastName: lastName,
                name: name,
                birthDate: birthDate,
                picture: picture
            });
            await newUser.save();
            return next();
            
        } else {
            return next();
        }
    } catch (error) {
        return next();
    }
}

export default insertUser;