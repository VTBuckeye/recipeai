import { Router } from 'express';
import * as recipeController from '../controllers/recipeController';
import { authenticate, optionalAuthentication } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { validateImageContent } from '../middleware/contentModeration';

const router = Router();

// Public routes (optional authentication)
router.get('/search', optionalAuthentication, recipeController.searchRecipes);
router.get('/:id', optionalAuthentication, recipeController.getRecipeById);

// Protected routes (require authentication)
router.use(authenticate);

router.get('/tags/all', recipeController.getAllTags);
router.post('/', upload.any(), validateImageContent, recipeController.createRecipe);
router.get('/', recipeController.getUserRecipes);
router.patch('/:id', upload.any(), validateImageContent, recipeController.updateRecipe);
router.delete('/:id', recipeController.deleteRecipe);
router.delete('/:id/images', recipeController.deleteRecipeImage);

export default router;
