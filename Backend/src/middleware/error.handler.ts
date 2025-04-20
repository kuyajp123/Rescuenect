import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

const errorHandler = (
  err: unknown, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      message: 'Token has expired. Please login again.',
    });
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token.',
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Something went wrong'
  });
};

export default errorHandler;
