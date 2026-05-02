import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { validateImageContent } from '../middleware/contentModeration';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', userController.getCurrentUser);

// Update user profile
router.patch('/me', userController.updateUserProfile);

// Upload profile picture (with content moderation)
router.post(
  '/me/profile-picture',
  uploadSingle('profilePicture'),
  validateImageContent,
  userController.uploadProfilePicture
);

// Delete user account
router.delete('/me', userController.deleteUserAccount);

export default router;
