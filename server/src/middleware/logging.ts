import { Request, Response, NextFunction } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import logger from '../utils/logger';

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

/**
 * Error logging middleware
 */
export const errorLogger = (
  error: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl || req.url,
    body: req.body,
  });

  next(error);
};

/**
 * User session logging middleware
 */
export const sessionLogger = async (
  req: SessionRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.session) {
      const userId = req.session.getUserId();
      logger.debug('Session active', {
        userId,
        path: req.path,
        method: req.method,
      });
    }
    next();
  } catch (error) {
    next();
  }
};
