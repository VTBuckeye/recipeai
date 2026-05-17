import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal, httpRequestInProgress } from '../utils/metrics';

/**
 * Middleware to collect HTTP request metrics for Prometheus
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const route = req.route?.path || req.path || 'unknown';
  const method = req.method;

  // Increment in-progress requests
  httpRequestInProgress.labels(method, route).inc();

  // Capture the original end function
  const originalEnd = res.end;

  // Override the end function to capture metrics
  res.end = function (this: Response, chunk?: any, encoding?: any, cb?: any): Response {
    // Calculate duration
    const duration = (Date.now() - start) / 1000;

    // Get status code
    const statusCode = res.statusCode.toString();

    // Record metrics
    httpRequestDuration.labels(method, route, statusCode).observe(duration);
    httpRequestTotal.labels(method, route, statusCode).inc();
    httpRequestInProgress.labels(method, route).dec();

    // Call the original end function
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};
