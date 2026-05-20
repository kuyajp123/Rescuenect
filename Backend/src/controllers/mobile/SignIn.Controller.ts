import { admin } from '@/db/firestoreConfig';
import { getBarangayByValue, normalizeBarangayValue } from '@/config/locationConfig';
import { SignInModel } from '@/models/mobile/SignInModel';
import { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();

const getAllowedGoogleClientIds = () => {
  const clientIds = process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '';
  return clientIds
    .split(',')
    .map(clientId => clientId.trim())
    .filter(Boolean);
};

export class SignInController {
  static async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { idToken, user } = req.body;
    const googleClientIds = getAllowedGoogleClientIds();

    if (!idToken) {
      res.status(400).json({ message: 'Google ID token is required' });
      return;
    }

    if (googleClientIds.length === 0) {
      res.status(500).json({ message: 'Google Sign-In is not configured on the backend' });
      return;
    }

    try {
      // Verify Google ID token
      const ticket = await client.verifyIdToken(
        {
          idToken: idToken,
          audience: googleClientIds,
        },
      ).catch(error => {
        console.error('Google token verification failed:', {
          message: error instanceof Error ? error.message : String(error),
          allowedAudiences: googleClientIds,
        });
        return null;
      });

      if (!ticket) {
        res.status(401).json({
          message: 'Invalid Google token',
          detail: 'The token audience does not match the backend Google client configuration.',
        });
        return;
      }

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        res.status(401).json({ message: 'Invalid Google token' });
        return;
      }

      // Create or get Firebase user
      let firebaseUser;
      let isNewUser = false;
      try {
        firebaseUser = await admin.auth().getUserByEmail(payload.email!);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
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
        phoneNumber: user?.phoneNumber || null,
      });

      res.status(200).json({
        token: customToken,
        user: userData,
        isNewUser,
        barangay: user?.barangay || null,
        phoneNumber: user?.phoneNumber || null,
      });

      return;
    } catch (error: any) {
      console.error('Sign-in error:', error);
      next(error);
    }
  }

  static async saveBarangayController(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { uid, barangay } = req.body;
    const normalizedBarangay = typeof barangay === 'string' ? normalizeBarangayValue(barangay) : '';

    if (!uid || !normalizedBarangay) {
      res.status(400).json({ message: 'User ID and barangay are required' });
      return;
    }

    const matchedBarangay = getBarangayByValue(normalizedBarangay);
    if (!matchedBarangay) {
      res.status(400).json({ message: 'Selected barangay is not covered by the active Rescuenect client' });
      return;
    }

    try {
      await SignInModel.saveBarangay(uid, matchedBarangay.value);
      res.json({ success: true, message: 'Barangay saved successfully' });
    } catch (error: any) {
      console.error('Error saving barangay:', error);
      res.status(500).json({ success: false, message: 'Failed to save barangay' });
      next(error);
    }
  }

  static async saveUserInfoController(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { uid, firstName, lastName, phoneNumber, e164PhoneNumber } = req.body;

    if (!uid || !firstName || !lastName || !phoneNumber || !e164PhoneNumber) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    try {
      await SignInModel.saveUserInfo(uid, {
        firstName,
        lastName,
        phoneNumber,
        e164PhoneNumber,
      });
      res.status(200).json({ success: true, message: 'User info saved successfully' });
    } catch (error: any) {
      console.error('Error saving user info:', error);
      res.status(500).json({ success: false, message: 'Failed to save user info' });
      next(error);
    }
  }

  static async deleteUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { uid } = req.body;

    if (!uid) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    try {
      await SignInModel.deleteUser(uid);
      await admin.auth().deleteUser(uid);

      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user' });
      next(error);
    }
  }
}
