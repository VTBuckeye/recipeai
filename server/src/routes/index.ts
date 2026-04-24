import { Router } from 'express';
import userRoutes from './userRoutes';
import recipeRoutes from './recipeRoutes';

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

export default router;
