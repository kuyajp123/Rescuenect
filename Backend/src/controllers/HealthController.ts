import { admin, verifyFirebaseConnection } from '@/db/firestoreConfig';
import { Request, Response } from 'express';

/**
 * Health check controller to verify system status
 */
export class HealthController {
  /**
   * Basic health check
   */
  static async healthCheck(req: Request, res: Response) {
    try {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };

      res.status(200).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Firebase connection health check
   */
  static async firebaseHealthCheck(req: Request, res: Response) {
    try {
      const startTime = Date.now();
      const isConnected = await verifyFirebaseConnection();
      const responseTime = Date.now() - startTime;

      if (isConnected) {
        res.status(200).json({
          status: 'ok',
          firebase: 'connected',
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: 'error',
          firebase: 'disconnected',
          message: 'Firebase authentication failed',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'error',
        firebase: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Comprehensive system health check
   */
  static async fullHealthCheck(req: Request, res: Response) {
    try {
      const startTime = Date.now();

      // Check Firebase connection
      const firebaseConnected = await verifyFirebaseConnection();

      // Get service account info
      const app = admin.app();
      const credential = app.options.credential as any;

      const health = {
        status: firebaseConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
        firebase: {
          connected: firebaseConnected,
          projectId: app.options.projectId,
          credentialType: credential?.constructor?.name || 'unknown',
        },
        responseTime: `${Date.now() - startTime}ms`,
      };

      res.status(firebaseConnected ? 200 : 503).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
