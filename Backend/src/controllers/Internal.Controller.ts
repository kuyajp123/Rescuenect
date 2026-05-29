import { ClientDeletionModel } from '@/models/admin/ClientDeletionModel';
import { OperationLogService } from '@/services/OperationLogService';
import { Request, Response } from 'express';

const getCronSecret = (): string | null => {
  const secret = process.env.CLIENT_DELETION_CRON_SECRET || process.env.INTERNAL_CRON_SECRET || process.env.CRON_SECRET;
  return typeof secret === 'string' && secret.trim() ? secret.trim() : null;
};

const extractBearerToken = (headerValue: string | undefined): string | null => {
  if (!headerValue) return null;
  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

export class InternalController {
  static async processClientDeletions(req: Request, res: Response): Promise<void> {
    const expectedSecret = getCronSecret();
    if (!expectedSecret) {
      res.status(503).json({ message: 'Client deletion cron secret is not configured' });
      return;
    }

    const providedSecret = extractBearerToken(req.headers.authorization);
    if (!providedSecret || providedSecret !== expectedSecret) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const result = await ClientDeletionModel.processDueDeletionJobs();
      await OperationLogService.create({
        action: 'client_deletion.process_due_jobs',
        actionLabel: 'Processed due client deletions',
        targetType: 'client_deletion_job',
        actorUid: 'scheduled_client_deletion',
        actorRole: 'system',
        message: `Processed ${result.processed} due client deletion job(s).`,
        after: result,
      });
      res.status(200).json(result);
    } catch (error) {
      await OperationLogService.create({
        action: 'client_deletion.process_due_jobs',
        actionLabel: 'Processed due client deletions',
        targetType: 'client_deletion_job',
        actorUid: 'scheduled_client_deletion',
        actorRole: 'system',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to process due client deletion jobs',
        after: null,
      });
      res.status(500).json({
        message: 'Failed to process due client deletion jobs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
