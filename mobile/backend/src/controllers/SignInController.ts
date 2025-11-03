import { SignInModel } from '@/models/SignInModel';
import { admin } from '@/db/firebaseConfig'
import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class SignInController {
    static async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { idToken, user } = req.body;

        if (!idToken) {
            res.status(400).json({ message: "Google ID token is required" });
            return;
        }

        try {
            // Verify Google ID token
            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            
            const payload = ticket.getPayload();
            if (!payload) {
                res.status(401).json({ message: "Invalid Google token" });
                return;
            }

            // Create or get Firebase user
            let firebaseUser;
            let isNewUser = false;
            try {
                firebaseUser = await admin.auth().getUserByEmail(payload.email!);
            } catch (error: any) {
                if (error.code === "auth/user-not-found") {
                    firebaseUser = await admin.auth().createUser({
                        email: payload.email,
                        displayName: payload.name,
                        photoURL: payload.picture,
                    });
                    isNewUser = true;
                } else {
                    throw error; // rethrow other errors
                }
            }

            // Create custom token for client
            const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

            // Save/update user in your database
            const userData = await SignInModel.signInUser(firebaseUser.uid, {
                uid: firebaseUser.uid,
                email: payload.email,
                givenName: payload.given_name || user?.givenName,
                familyName: payload.family_name || user?.familyName,
                photo: payload.picture || user?.photo,
                barangay: user?.barangay || null,
                phoneNumber: user?.phoneNumber || null
            });

            res.status(200).json({ 
                token: customToken,
                user: userData,
                isNewUser,
                barangay: user?.barangay || null,
                phoneNumber: user?.phoneNumber || null
            });

            console.log("Backend Firebase UID:", firebaseUser.uid);
            return;
        } catch (error: any) {
            console.error('Sign-in error:', error);
            next(error);
        }
    }

    static async saveBarangayController(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { uid, barangay } = req.body;

        if (!uid || !barangay) {
            res.status(400).json({ message: "User ID and barangay are required" });
            return;
        }

        try {
            await SignInModel.saveBarangay(uid, barangay);
            res.json({ success: true, message: "Barangay saved successfully" });
        } catch (error: any) {
            console.error('Error saving barangay:', error);
            res.status(500).json({ success: false, message: "Failed to save barangay" });
            next(error);
        }
    }

    static async saveUserInfoController(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { uid, firstName, lastName, phoneNumber, e164PhoneNumber } = req.body;

        if (!uid || !firstName || !lastName || !phoneNumber || !e164PhoneNumber) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }

        try {
            await SignInModel.saveUserInfo(uid, {
                firstName,
                lastName,
                phoneNumber,
                e164PhoneNumber
            });
            res.status(200).json({ success: true, message: "User info saved successfully" });
        } catch (error: any) {
            console.error('Error saving user info:', error);
            res.status(500).json({ success: false, message: "Failed to save user info" });
            next(error);
        }
    }
}