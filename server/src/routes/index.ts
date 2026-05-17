import { Router } from 'express';
import userRoutes from './userRoutes';
import recipeRoutes from './recipeRoutes';
import webVitalsRoutes from './webVitalsRoutes';
import familyMemberRoutes from './familyMemberRoutes';
import mealPlanRoutes from './mealPlanRoutes';

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
router.use('/family-members', familyMemberRoutes);
router.use('/meal-plans', mealPlanRoutes);

export default router;
