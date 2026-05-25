import { SignInModel } from '@/models/admin/SignInModel';
import { Request, Response } from 'express';

export class LoginController {
  static async handleLogin(req: Request, res: Response): Promise<void> {
    const { fcmToken, barangay } = req.body;
    const email = req.user?.email;
    const uid = req.user?.uid;

    if (!email || !uid) {
      res.status(401).json({ message: 'Verified Firebase user is required' });
      return;
    }

    try {
      const user = await SignInModel.SignUser(email, uid, barangay, fcmToken);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({ message: 'User signed in successfully', user });
    } catch (error) {
      res.status(500).json({ message: `Failed to sign in user: ${error}` });
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    const { uid, firstName, lastName, phone, bio, barangay, address } = req.body;

    if (!uid || !firstName || !lastName || !phone || !barangay || !address) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (req.user?.uid !== uid) {
      res.status(403).json({ message: 'You can only update your own profile' });
      return;
    }

    try {
      await SignInModel.updateProfile(uid, {
        firstName,
        lastName,
        phone,
        bio: bio || 'Rescuenect Administrator',
        barangay,
        address,
      });
      res.status(200).json({ message: 'Profile updated successfully', success: true });
    } catch (error) {
      if (error instanceof Error && error.message === 'Barangay is not covered by your LGU client') {
        res.status(400).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: `Failed to update profile: ${error}` });
    }
  }
}
