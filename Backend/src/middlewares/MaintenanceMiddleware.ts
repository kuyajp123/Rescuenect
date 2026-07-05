import { admin } from '@/db/firestoreConfig';
import { NextFunction, Request, Response } from 'express';

const serverTemplate = admin.remoteConfig().initServerTemplate({
  defaultConfig: {
    is_maintenance_mode: false,
  },
});

export class MaintenanceMiddleware {
  static async maintenanceModeMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await serverTemplate.load();

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
      next();
    }
  }
}
