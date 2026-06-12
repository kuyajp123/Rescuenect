import { SignInModel } from '@/models/admin/SignInModel';
import { ClientModel } from '@/models/admin/ClientModel';
import { canLguAdminCompleteOnboarding, canLguAdminUseClient } from '@/utils/accessControl';
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

      if (user.status !== 'active') {
        res.status(403).json({ message: 'Admin account is inactive' });
        return;
      }

      if (user.role === 'lgu_admin') {
        const client = user.clientId ? await ClientModel.getClientById(user.clientId) : null;
        const canCompleteSetup = !user.onboardingComplete && canLguAdminCompleteOnboarding(client?.status);
        if (!client || (!canLguAdminUseClient(client.status) && !canCompleteSetup)) {
          res.status(403).json({ message: 'LGU client is not active' });
          return;
        }
      }

      res.status(200).json({ message: 'User signed in successfully', user });
    } catch (error) {
      res.status(500).json({ message: `Failed to sign in user: ${error}` });
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    const { uid, firstName, lastName, phone, bio, barangay, address, logoUrl, logoPath } = req.body;
    const isLguAdmin = req.adminUser?.role === 'lgu_admin';

    if (!uid || !firstName || !lastName || !phone || !address || (isLguAdmin && !barangay)) {
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
        logoUrl,
        logoPath,
        onboardingComplete: false,
      });
      res.status(200).json({ message: 'Profile updated successfully', success: true });
    } catch (error) {
      if (
        error instanceof Error &&
        [
          'Barangay is not covered by your LGU client',
          'LGU logo is required for onboarding',
          'Upload the LGU logo before completing onboarding',
        ].includes(error.message)
      ) {
        res.status(400).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: `Failed to update profile: ${error}` });
    }
  }

  static async completeOnboarding(req: Request, res: Response): Promise<void> {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      await import('@/db/firestoreConfig').then(({ db }) => {
        return db.collection('admin').doc(uid).update({
          onboardingComplete: true,
          updatedAt: new Date(),
        });
      });
      res.status(200).json({ message: 'Onboarding completed successfully', success: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ message: 'Failed to complete onboarding' });
    }
  }
}
