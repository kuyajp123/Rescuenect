import type { AdminUser } from './admin';
import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
      adminUser?: AdminUser;
      rawBody?: Buffer;
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      token?: string;
    }
  }
}

export { };
