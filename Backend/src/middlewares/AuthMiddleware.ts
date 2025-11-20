import { admin } from '@/db/firestoreConfig';
import { NextFunction, Request, Response } from 'express';

export class AuthMiddleware {
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Missing or invalid authorization header' });
      return;
    }

    const idToken = authHeader.split(' ')[1];

    if (!idToken || idToken === 'null' || idToken === 'undefined') {
      res.status(401).json({ message: 'Missing or invalid token' });
      return;
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (!decodedToken) {
        console.error('❌ Token verification failed: no decoded token');
        res.status(401).json({ message: 'Token verification failed' });
        return;
      }

      (req as any).user = decodedToken;
      next();
    } catch (error) {
      console.error('❌ Token verification error:', {
        error: error instanceof Error ? error.message : error,
        tokenLength: idToken?.length || 0,
        tokenPrefix: idToken?.substring(0, 20) + '...',
      });
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  }
}
