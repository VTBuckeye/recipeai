import winston from 'winston';
import LokiTransport from 'winston-loki';
import { config } from '../config/env';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: {
    service: 'recipeai-server',
    environment: config.NODE_ENV,
  },
  transports: [],
});

// Console transport for development
if (config.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    })
  );
}

// Loki transport for log aggregation
try {
  logger.add(
    new LokiTransport({
      host: `http://${config.LOKI_HOST}:${config.LOKI_PORT}`,
      labels: {
        app: 'recipeai-server',
        environment: config.NODE_ENV,
      },
      json: true,
      format: json(),
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('Loki connection error:', err);
      },
    })
  );
} catch (error) {
  console.error('Failed to initialize Loki transport:', error);
}

// Production console transport
if (config.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.Console({
      format: json(),
    })
  );
}

export default logger;
