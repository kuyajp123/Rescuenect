import { admin } from '@/db/firebaseConfig'
import { NextFunction, Request, Response } from 'express';

export class AuthMiddleware {
  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    console.log("Authorization header:", req.headers.authorization);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Unauthorized");
    } 

    const idToken = authHeader.split(" ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (!decodedToken) {
          res.status(401).json({ message: "Unauthorized" });
          return;
      }

      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token" });
      console.error("Token verification error:", error);
      next(error);
    }
  }
}
