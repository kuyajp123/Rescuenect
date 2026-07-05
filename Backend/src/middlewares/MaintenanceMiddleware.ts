import { admin } from '@/db/firestoreConfig';
import { NextFunction, Request, Response } from 'express';

// Initialize Firebase Remote Config Server Template
// This fetches and caches the config in the background automatically
const serverTemplate = admin.remoteConfig().initServerTemplate({
  defaultConfig: {
    is_maintenance_mode: false,
  },
});

/**
 * Middleware to instantly block all requests when maintenance mode is active in Remote Config.
 */

export class MaintenanceMiddleware {
  static async maintenanceModeMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = serverTemplate.evaluate();

      if (config.getBoolean('is_maintenance_mode')) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'The server is currently undergoing maintenance. Please try again later.',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error evaluating maintenance mode config:', error);
      // If evaluation fails, fail open (allow request) to prevent accidental total lockout
      next();
    }
  }
}
