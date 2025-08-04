import admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

export class AuthMiddleware{
    static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            res.status(401).send('token not provided');
            return;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            if (!decodedToken) {
                res.status(401).send('Unauthorized access');
                return;
            }
    
            req.token = idToken;
            next();
        } catch (error) {
            next(error);
        }
    }
}