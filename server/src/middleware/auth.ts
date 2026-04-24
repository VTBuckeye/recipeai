import { Response, NextFunction } from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { SessionRequest } from 'supertokens-node/framework/express';
import logger from '../utils/logger';

/**
 * Middleware to verify user session
 */
export const authenticate = verifySession();

/**
 * Middleware to get session information and attach to request
 */
export const attachSession = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.session) {
      const userId = req.session.getUserId();
      logger.debug('Session attached', { userId });
    }
    next();
  } catch (error) {
    logger.error('Error attaching session:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Optional authentication - doesn't fail if no session
 */
export const optionalAuthentication = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await verifySession({ sessionRequired: false })(req, res, next);
  } catch (error) {
    next();
  }
};
