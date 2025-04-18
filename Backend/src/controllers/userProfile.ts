import { Response, Request } from "express";
import { verifyToken } from "../middleware/verifyToken";

interface CustomRequest extends Request {
    googleID: string;
    email: string,
    firstName: string,
    lastName: string,
    name: string,
    birthDate: string,
    picture: string
}

export const userProfile = async (req: CustomRequest, res: Response) => {
await verifyToken(req as CustomRequest, res, (err) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const userID = req.googleID;
        const email = req.email;
        const name = req.name;
        const firstName = req.firstName;
        const lastName = req.lastName;
        const birthDate = req.birthDate;
        const picture = req.picture;

        console.log({userID, email, name, firstName, lastName, birthDate, picture});

    res.status(200).json({
        success: true,
        message: 'User profile',
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
  });
}
  // Protected Route Example
//   app.get('/dashboard', async (req: any, res, next) => {
//     await verifyToken(req as CustomRequest, res, next);
  
//     res.send(`Welcome <br>
//       user ID: ${req.user.userID}
//       <br>
//       email: ${req.user.email}
//       <br>
//       first name: ${req.user.firstName}
//       <br>
//       last name: ${req.user.lastName}
//       <br>
//       whole name: ${req.user.name}
//       <br>
//       birth day: ${req.user.birthDate}
//       <br>
//       picture: ${req.user.picture}
//       `);
//   });