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
            try {
                firebaseUser = await admin.auth().getUserByEmail(payload.email!);
            } catch (error) {
                // User doesn't exist, create new user
                firebaseUser = await admin.auth().createUser({
                    uid: payload.sub,
                    email: payload.email,
                    displayName: payload.name,
                    photoURL: payload.picture,
                });
            }

            // Create custom token for client
            const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

            // Save/update user in your database
            const userData = await SignInModel.signInUser(firebaseUser.uid, {
                email: payload.email,
                givenName: payload.given_name || user?.givenName,
                familyName: payload.family_name || user?.familyName,
                name: payload.name || user?.name,
                photo: payload.picture || user?.photo
            });

            res.status(200).json({ 
                token: customToken,
                user: userData 
            });
            return;
        } catch (error: any) {
            console.error('Sign-in error:', error);
            next(error);
        }
    }
}