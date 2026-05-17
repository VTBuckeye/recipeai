import express from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import {
  getMealPlanByWeek,
  addMealPlanItem,
  updateMealPlanItem,
  deleteMealPlanItem,
  bulkUpdateMealPlanItems,
} from '../controllers/mealPlanController';

const router = express.Router();

// All routes require authentication
router.use(verifySession());

// GET /api/meal-plans?weekStartDate=YYYY-MM-DD - Get or create meal plan for a week
router.get('/', getMealPlanByWeek);

// POST /api/meal-plans/items - Add an item to a meal plan
router.post('/items', addMealPlanItem);

// PUT /api/meal-plans/items/:id - Update a meal plan item
router.put('/items/:id', updateMealPlanItem);

// DELETE /api/meal-plans/items/:id - Delete a meal plan item
router.delete('/items/:id', deleteMealPlanItem);

// PUT /api/meal-plans/items/bulk - Bulk update meal plan items (for drag and drop)
router.put('/items/bulk', bulkUpdateMealPlanItems);

export default router;
