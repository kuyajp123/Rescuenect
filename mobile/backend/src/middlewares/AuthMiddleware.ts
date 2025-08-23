import { admin } from '@/db/firebaseConfig'
import { NextFunction, Request, Response } from 'express';

export class AuthMiddleware {
  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    const idToken = req.body.idToken;
    
    if (!idToken) {
      res.status(401).send('token not provided');
      return;
    }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      if (!decoded) {
          res.status(401).json({ message: "Unauthorized" });
          return;
      }

      req.body.uid = decoded.sub;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  }
}
