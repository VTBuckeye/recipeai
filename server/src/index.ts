import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { middleware as supertokensMiddleware } from 'supertokens-node/framework/express';
import { errorHandler as supertokensErrorHandler } from 'supertokens-node/framework/express';

import { config } from './config/env';
import { connectDatabase } from './config/database';
import { initSuperTokens } from './config/supertokens';
import routes from './routes';
import metricsRoutes from './routes/metricsRoutes';
import clientLogsRoutes from './routes/clientLogsRoutes';
import {
  requestLogger,
  errorLogger,
  sessionLogger,
  errorHandler,
  notFoundHandler,
  metricsMiddleware,
} from './middleware';
import logger from './utils/logger';

// Initialize Express app
const app: Application = express();

// Initialize SuperTokens
initSuperTokens();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics middleware (before logging to track all requests)
app.use(metricsMiddleware);

// Logging middleware
app.use(requestLogger);
app.use(sessionLogger);

// Metrics endpoint (before rate limiting and auth)
app.use('/metrics', metricsRoutes);

// Client log shipping endpoint (outside /api so it bypasses the global rate limiter;
// has its own dedicated rate limit and is intentionally unauthenticated so errors
// during the auth flow still reach Loki).
app.use('/client-logs', clientLogsRoutes);

// SuperTokens middleware
app.use(supertokensMiddleware());

// API routes
app.use('/api', routes);

// SuperTokens error handler
app.use(supertokensErrorHandler());

// 404 handler
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize content moderation model
    try {
      const { initializeModel } = await import('./services/contentModerationService');
      await initializeModel();
      logger.info('Content moderation model initialized');
    } catch (error) {
      logger.error('Failed to initialize content moderation model', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      logger.warn('Content moderation will be disabled');
    }

    // Start listening
    const server = app.listen(config.PORT, () => {
      logger.info(`Server started successfully`, {
        port: config.PORT,
        environment: config.NODE_ENV,
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          const { disconnectDatabase } = await import('./config/database');
          await disconnectDatabase();
          logger.info('Database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
