import { Router, Request, Response } from 'express';
import * as promClient from 'prom-client';
import { register } from '../utils/metrics';
import logger from '../utils/logger';

const router = Router();

// Web vitals metrics
const webVitalsMetric = new promClient.Histogram({
  name: 'web_vitals',
  help: 'Web Vitals metrics from the client',
  labelNames: ['metric_name', 'rating'],
  buckets: [100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [register],
});

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

/**
 * POST /api/metrics/web-vitals
 * Receive web vitals metrics from the client
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const metric: WebVitalMetric = req.body;

    if (!metric.name || typeof metric.value !== 'number') {
      res.status(400).json({ error: 'Invalid metric data' });
      return;
    }

    // Record the metric in Prometheus
    webVitalsMetric.labels(metric.name, metric.rating || 'unknown').observe(metric.value);

    logger.debug('Received web vital metric', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing web vitals metric', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
