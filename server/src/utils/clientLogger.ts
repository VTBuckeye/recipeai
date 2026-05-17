import winston from 'winston';
import LokiTransport from 'winston-loki';
import { config } from '../config/env';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [client/${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const clientLogger = winston.createLogger({
  level: 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: {
    service: 'recipeai-client',
    environment: config.NODE_ENV,
  },
  transports: [],
});

if (config.NODE_ENV === 'development') {
  clientLogger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    })
  );
}

if (config.LOKI_HOST && config.LOKI_PORT) {
  try {
    const lokiTransport = new LokiTransport({
      host: `http://${config.LOKI_HOST}:${config.LOKI_PORT}`,
      labels: {
        app: 'recipeai-client',
        environment: config.NODE_ENV,
      },
      json: true,
      batching: true,
      interval: 5,
      replaceTimestamp: true,
      gracefulShutdown: false,
      timeout: 30000,
      onConnectionError: (err) => {
        console.error('Loki connection error (client logs):', err);
      },
    });
    clientLogger.add(lokiTransport);
  } catch (error) {
    console.error('Failed to initialize Loki transport for client logs:', error);
  }
}

if (config.NODE_ENV === 'production') {
  clientLogger.add(
    new winston.transports.Console({
      format: json(),
    })
  );
}

export default clientLogger;
