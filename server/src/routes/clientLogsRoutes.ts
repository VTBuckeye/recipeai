import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';
import clientLogger from '../utils/clientLogger';

const router = Router();

type ClientLogLevel = 'debug' | 'info' | 'warn' | 'error';

interface ClientLogEntry {
  level: ClientLogLevel;
  message: string;
  timestamp?: string;
  sessionId: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  data?: Record<string, unknown>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

interface ClientLogBatch {
  sessionId: string;
  userId?: string;
  entries: ClientLogEntry[];
}

const ALLOWED_LEVELS: ReadonlySet<ClientLogLevel> = new Set([
  'debug',
  'info',
  'warn',
  'error',
]);

const MAX_ENTRIES_PER_BATCH = 100;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_STACK_LENGTH = 8000;

const truncate = (value: string | undefined, max: number): string | undefined => {
  if (!value) return value;
  return value.length > max ? `${value.slice(0, max)}…[truncated]` : value;
};

const clientLogsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many log submissions, slow down.' },
});

router.post('/', clientLogsLimiter, (req: Request, res: Response): void => {
  try {
    const body = req.body as ClientLogBatch | undefined;

    if (!body || typeof body !== 'object' || !Array.isArray(body.entries)) {
      res.status(400).json({ error: 'Invalid log batch' });
      return;
    }

    const batchSessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined;
    if (!batchSessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const entries = body.entries.slice(0, MAX_ENTRIES_PER_BATCH);

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;

      const level: ClientLogLevel = ALLOWED_LEVELS.has(entry.level) ? entry.level : 'info';
      const message = truncate(
        typeof entry.message === 'string' ? entry.message : 'client log',
        MAX_MESSAGE_LENGTH
      );

      const meta: Record<string, unknown> = {
        source: 'client',
        sessionId: entry.sessionId || batchSessionId,
        userId: entry.userId || body.userId,
        clientTimestamp: entry.timestamp,
        url: truncate(entry.url, 2000),
        userAgent: truncate(entry.userAgent, 500),
        ip: req.ip,
      };

      if (entry.data && typeof entry.data === 'object') {
        meta.data = entry.data;
      }

      if (entry.error && typeof entry.error === 'object') {
        meta.error = {
          name: truncate(entry.error.name, 200),
          message: truncate(entry.error.message, MAX_MESSAGE_LENGTH),
          stack: truncate(entry.error.stack, MAX_STACK_LENGTH),
        };
      }

      clientLogger.log(level, message ?? 'client log', meta);
    }

    res.status(204).end();
  } catch (error) {
    logger.error('Failed to process client log batch', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
