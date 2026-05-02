import { Router } from 'express';
import userRoutes from './userRoutes';
import recipeRoutes from './recipeRoutes';
import webVitalsRoutes from './webVitalsRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/users', userRoutes);
router.use('/recipes', recipeRoutes);
router.use('/metrics/web-vitals', webVitalsRoutes);

export default router;
