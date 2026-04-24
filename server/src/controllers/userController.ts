import { Response, NextFunction } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import User from '../models/User';
import minioService from '../services/minioService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Get current user profile
 */
export const getCurrentUser = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session) {
      throw new AppError('Not authenticated', 401);
    }

    const supertokensUserId = req.session.getUserId();
    const user = await User.findOne({ supertokensUserId }).select('-__v');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    logger.info('User profile retrieved', { userId: user._id });

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session) {
      throw new AppError('Not authenticated', 401);
    }

    const supertokensUserId = req.session.getUserId();
    const { name, email } = req.body;

    const user = await User.findOne({ supertokensUserId });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    logger.info('User profile updated', {
      userId: user._id,
      updatedFields: Object.keys(req.body),
    });

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user profile picture
 */
export const uploadProfilePicture = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session) {
      throw new AppError('Not authenticated', 401);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const supertokensUserId = req.session.getUserId();
    const user = await User.findOne({ supertokensUserId });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete old profile picture if exists
    if (user.profilePictureUrl) {
      try {
        const oldFilename = user.profilePictureUrl.split('/').pop();
        if (oldFilename) {
          await minioService.deleteFile(`profile-pictures/${oldFilename}`);
        }
      } catch (error) {
        logger.warn('Failed to delete old profile picture', {
          userId: user._id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Upload new profile picture
    const { url } = await minioService.uploadFile(req.file, 'profile-pictures');
    user.profilePictureUrl = url;
    await user.save();

    logger.info('Profile picture uploaded', {
      userId: user._id,
      url,
    });

    res.json({
      status: 'success',
      data: {
        profilePictureUrl: url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session) {
      throw new AppError('Not authenticated', 401);
    }

    const supertokensUserId = req.session.getUserId();
    const user = await User.findOne({ supertokensUserId });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete profile picture if exists
    if (user.profilePictureUrl) {
      try {
        const filename = user.profilePictureUrl.split('/').pop();
        if (filename) {
          await minioService.deleteFile(`profile-pictures/${filename}`);
        }
      } catch (error) {
        logger.warn('Failed to delete profile picture during account deletion', {
          userId: user._id,
        });
      }
    }

    await user.deleteOne();

    logger.info('User account deleted', { userId: user._id });

    res.json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
