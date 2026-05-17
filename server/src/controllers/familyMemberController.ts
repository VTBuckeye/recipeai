import { Response, NextFunction } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import { FamilyMember, User } from '../models';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all family members for the authenticated user
 */
export const getFamilyMembers = async (
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

    const familyMembers = await FamilyMember.find({ userId: user._id }).sort({ name: 1 });

    logger.info('Family members retrieved', {
      userId: user._id,
      count: familyMembers.length,
    });

    res.status(200).json(familyMembers);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new family member
 */
export const createFamilyMember = async (
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

    const { name } = req.body;

    if (!name || !name.trim()) {
      throw new AppError('Name is required', 400);
    }

    const familyMember = await FamilyMember.create({
      userId: user._id,
      name: name.trim(),
    });

    logger.info('Family member created', {
      userId: user._id,
      familyMemberId: familyMember._id,
      name: familyMember.name,
    });

    res.status(201).json(familyMember);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a family member
 */
export const updateFamilyMember = async (
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

    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      throw new AppError('Name is required', 400);
    }

    const familyMember = await FamilyMember.findOneAndUpdate(
      { _id: id, userId: user._id },
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    logger.info('Family member updated', {
      userId: user._id,
      familyMemberId: familyMember._id,
      name: familyMember.name,
    });

    res.status(200).json(familyMember);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a family member
 */
export const deleteFamilyMember = async (
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

    const { id } = req.params;

    const familyMember = await FamilyMember.findOneAndDelete({
      _id: id,
      userId: user._id,
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    logger.info('Family member deleted', {
      userId: user._id,
      familyMemberId: familyMember._id,
      name: familyMember.name,
    });

    res.status(200).json({ message: 'Family member deleted successfully' });
  } catch (error) {
    next(error);
  }
};
