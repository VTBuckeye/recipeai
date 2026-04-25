import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  // Server
  NODE_ENV: string;
  PORT: number;
  HOST: string;

  // MongoDB
  MONGODB_URI: string;

  // SuperTokens
  SUPERTOKENS_CONNECTION_URI: string;
  SUPERTOKENS_API_KEY: string;

  // MinIO
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_PUBLIC_ENDPOINT: string;  // Browser-accessible endpoint
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_USE_SSL: boolean;
  MINIO_BUCKET_NAME: string;
  MAX_FILE_SIZE: number;

  // Loki
  LOKI_HOST: string;
  LOKI_PORT: number;
  LOG_LEVEL: string;

  // CORS
  CORS_ORIGIN: string;

  // Session
  SESSION_SECRET: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) {
    return defaultValue;
  }
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const config: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', 5000),
  HOST: getEnvVar('HOST', 'localhost'),

  MONGODB_URI: getEnvVar('MONGODB_URI'),

  SUPERTOKENS_CONNECTION_URI: getEnvVar('SUPERTOKENS_CONNECTION_URI'),
  SUPERTOKENS_API_KEY: getEnvVar('SUPERTOKENS_API_KEY', ''),

  MINIO_ENDPOINT: getEnvVar('MINIO_ENDPOINT'),
  MINIO_PORT: getEnvNumber('MINIO_PORT', 9000),
  MINIO_PUBLIC_ENDPOINT: getEnvVar('MINIO_PUBLIC_ENDPOINT', getEnvVar('MINIO_ENDPOINT')),
  MINIO_ACCESS_KEY: getEnvVar('MINIO_ACCESS_KEY'),
  MINIO_SECRET_KEY: getEnvVar('MINIO_SECRET_KEY'),
  MINIO_USE_SSL: getEnvBoolean('MINIO_USE_SSL', false),
  MINIO_BUCKET_NAME: getEnvVar('MINIO_BUCKET_NAME', 'recipeai-images'),
  MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', 1048576),

  LOKI_HOST: getEnvVar('LOKI_HOST'),
  LOKI_PORT: getEnvNumber('LOKI_PORT', 3100),
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),

  CORS_ORIGIN: getEnvVar('CORS_ORIGIN'),

  SESSION_SECRET: getEnvVar('SESSION_SECRET', 'default-secret-change-in-production'),
};

export default config;
