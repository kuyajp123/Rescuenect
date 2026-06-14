import { DangerZoneModelError } from '@/models/DangerZoneModel';
import { DangerZonePayloadError } from '@/services/DangerZoneGeometryService';
import { Response } from 'express';

export const sendDangerZoneError = (res: Response, error: unknown, fallbackMessage: string): void => {
  if (error instanceof DangerZonePayloadError) {
    res.status(400).json({
      message: error.message,
      fieldErrors: error.fieldErrors,
    });
    return;
  }

  if (error instanceof DangerZoneModelError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  console.error(fallbackMessage, error);
  res.status(500).json({
    message: fallbackMessage,
    error: error instanceof Error ? error.message : String(error),
  });
};
