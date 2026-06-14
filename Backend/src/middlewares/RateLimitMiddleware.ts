import { isProductionAppEnv } from '@/config/appEnv';
import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

const fifteenMinutes = 15 * 60 * 1000;
const oneHour = 60 * 60 * 1000;

const disabledRateLimiter: RequestHandler = (_req, _res, next) => next();

const createRateLimiter = (options: Parameters<typeof rateLimit>[0]): RequestHandler => {
  if (!isProductionAppEnv()) {
    return disabledRateLimiter;
  }

  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

export const routeRateLimiters = {
  auth: createRateLimiter({
    windowMs: fifteenMinutes,
    max: 10,
    message: { message: 'Too many sign-in attempts, please try again later.' },
  }),
  publicRead: createRateLimiter({
    windowMs: fifteenMinutes,
    max: 500,
    message: { message: 'Too many requests, please try again later.' },
  }),
  publicWrite: createRateLimiter({
    windowMs: oneHour,
    max: 20,
    message: { message: 'Too many submissions, please try again later.' },
  }),
  authenticatedApi: createRateLimiter({
    windowMs: fifteenMinutes,
    max: 300,
    message: { message: 'Too many requests, please try again later.' },
  }),
  expensive: createRateLimiter({
    windowMs: oneHour,
    max: 60,
    message: { message: 'Too many requests to this endpoint, please try again later.' },
  }),
  routeComputation: createRateLimiter({
    windowMs: oneHour,
    max: 40,
    message: { message: 'Too many route requests. Please wait before trying again.' },
  }),
  dangerZoneReport: createRateLimiter({
    windowMs: oneHour,
    max: 12,
    message: { message: 'Too many danger-zone reports. Please wait before submitting another report.' },
  }),
  sensitive: createRateLimiter({
    windowMs: oneHour,
    max: 30,
    message: { message: 'Too many sensitive operations, please try again later.' },
  }),
};
