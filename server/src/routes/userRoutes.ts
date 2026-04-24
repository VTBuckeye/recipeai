import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', userController.getCurrentUser);

// Update user profile
router.patch('/me', userController.updateUserProfile);

// Upload profile picture
router.post('/me/profile-picture', uploadSingle('profilePicture'), userController.uploadProfilePicture);

// Delete user account
router.delete('/me', userController.deleteUserAccount);

export default router;
