import { admin } from '@/db/firebaseConfig'
import { NextFunction, Request, Response } from 'express';

export class AuthMiddleware {
  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    console.log("Authorization header:", req.headers.authorization);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid authorization header" });
    } 

    const idToken = authHeader.split(" ")[1];

    // ✅ Fix: Check if token is null or empty
    if (!idToken || idToken === 'null' || idToken === 'undefined') {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (!decodedToken) {
          return res.status(401).json({ message: "Token verification failed" });
      }

      // ✅ Fix: Add decoded token to request for use in controllers
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: "Invalid or expired token" }); // ✅ Fix: Return instead of calling next with error
    }
  }
}
