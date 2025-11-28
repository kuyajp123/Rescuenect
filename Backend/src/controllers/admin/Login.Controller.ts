import { SignInModel } from '@/models/admin/SignInModel';
import { Request, Response } from 'express';

export class LoginController {
  static async handleLogin(req: Request, res: Response): Promise<void> {
    const adminEmailsRaw = process.env.ADMIN_EMAILS!;
    if (!adminEmailsRaw) {
      throw new Error('ADMIN_EMAILS env variable is not set');
    }

    const adminEmails = JSON.parse(adminEmailsRaw);
    const allowedEmails = Object.values(adminEmails);

    const { email, uid, fcmToken, barangay } = req.body;

    if (!email || !allowedEmails.includes(email)) {
      res.status(403).json({ message: 'Access denied' });
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
}
