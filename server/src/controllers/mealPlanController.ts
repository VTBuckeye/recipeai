import { Response, NextFunction } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import { MealPlan, MealPlanItem, User, Recipe, FamilyMember } from '../models';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Get or create a meal plan for a specific week
 */
export const getMealPlanByWeek = async (
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

    const { weekStartDate } = req.query;

    if (!weekStartDate || typeof weekStartDate !== 'string') {
      throw new AppError('Week start date is required', 400);
    }

    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // Sunday to Saturday

    // Find or create meal plan
    let mealPlan = await MealPlan.findOne({
      userId: user._id,
      weekStartDate: startDate,
      weekEndDate: endDate,
    });

    if (!mealPlan) {
      mealPlan = await MealPlan.create({
        userId: user._id,
        weekStartDate: startDate,
        weekEndDate: endDate,
      });
    }

    // Get all meal plan items with populated recipe and family member data
    const mealPlanItems = await MealPlanItem.find({ mealPlanId: mealPlan._id })
      .populate('recipeId', 'title description images')
      .populate('familyMemberId', 'name')
      .sort({ dayOfWeek: 1, mealType: 1, order: 1 });

    logger.info('Meal plan retrieved', {
      userId: user._id,
      mealPlanId: mealPlan._id,
      weekStartDate: startDate,
      itemCount: mealPlanItems.length,
    });

    res.status(200).json({
      mealPlan,
      items: mealPlanItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add an item to a meal plan
 */
export const addMealPlanItem = async (
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

    const { mealPlanId, recipeId, familyMemberId, dayOfWeek, mealType, manualEntry, order } =
      req.body;

    if (!mealPlanId || !dayOfWeek || !mealType) {
      throw new AppError('Meal plan ID, day of week, and meal type are required', 400);
    }

    if (!recipeId && !manualEntry) {
      throw new AppError('Either recipe ID or manual entry is required', 400);
    }

    // Verify meal plan belongs to user
    const mealPlan = await MealPlan.findOne({ _id: mealPlanId, userId: user._id });

    if (!mealPlan) {
      throw new AppError('Meal plan not found', 404);
    }

    // Verify recipe exists if provided
    if (recipeId) {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        throw new AppError('Recipe not found', 404);
      }
    }

    // Verify family member exists if provided
    if (familyMemberId) {
      const familyMember = await FamilyMember.findOne({
        _id: familyMemberId,
        userId: user._id,
      });
      if (!familyMember) {
        throw new AppError('Family member not found', 404);
      }
    }

    const mealPlanItem = await MealPlanItem.create({
      mealPlanId,
      recipeId: recipeId || null,
      familyMemberId: familyMemberId || null,
      dayOfWeek,
      mealType,
      manualEntry: manualEntry || null,
      order: order || 0,
    });

    // Populate before returning
    await mealPlanItem.populate('recipeId', 'title description images');
    await mealPlanItem.populate('familyMemberId', 'name');

    logger.info('Meal plan item created', {
      userId: user._id,
      mealPlanId,
      itemId: mealPlanItem._id,
      dayOfWeek,
      mealType,
    });

    res.status(201).json(mealPlanItem);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a meal plan item
 */
export const updateMealPlanItem = async (
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
    const { recipeId, familyMemberId, dayOfWeek, mealType, manualEntry, order } = req.body;

    // Find the item and verify ownership through meal plan
    const existingItem = await MealPlanItem.findById(id).populate('mealPlanId');

    if (!existingItem) {
      throw new AppError('Meal plan item not found', 404);
    }

    const mealPlan = await MealPlan.findOne({ _id: existingItem.mealPlanId, userId: user._id });

    if (!mealPlan) {
      throw new AppError('Unauthorized', 403);
    }

    // Update fields
    const updateData: any = {};
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (mealType !== undefined) updateData.mealType = mealType;
    if (order !== undefined) updateData.order = order;
    if (recipeId !== undefined) updateData.recipeId = recipeId || null;
    if (familyMemberId !== undefined) updateData.familyMemberId = familyMemberId || null;
    if (manualEntry !== undefined) updateData.manualEntry = manualEntry || null;

    const mealPlanItem = await MealPlanItem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('recipeId', 'title description images')
      .populate('familyMemberId', 'name');

    logger.info('Meal plan item updated', {
      userId: user._id,
      itemId: id,
      updates: Object.keys(updateData),
    });

    res.status(200).json(mealPlanItem);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a meal plan item
 */
export const deleteMealPlanItem = async (
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

    // Find the item and verify ownership through meal plan
    const existingItem = await MealPlanItem.findById(id).populate('mealPlanId');

    if (!existingItem) {
      throw new AppError('Meal plan item not found', 404);
    }

    const mealPlan = await MealPlan.findOne({ _id: existingItem.mealPlanId, userId: user._id });

    if (!mealPlan) {
      throw new AppError('Unauthorized', 403);
    }

    await MealPlanItem.findByIdAndDelete(id);

    logger.info('Meal plan item deleted', {
      userId: user._id,
      itemId: id,
    });

    res.status(200).json({ message: 'Meal plan item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update meal plan items (for drag and drop reordering)
 */
export const bulkUpdateMealPlanItems = async (
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

    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError('Updates array is required', 400);
    }

    // Verify all items belong to user's meal plans
    const itemIds = updates.map((u: any) => u.id);
    const items = await MealPlanItem.find({ _id: { $in: itemIds } }).populate('mealPlanId');

    const mealPlanIds = [...new Set(items.map((item: any) => item.mealPlanId._id.toString()))];
    const userMealPlans = await MealPlan.find({ _id: { $in: mealPlanIds }, userId: user._id });

    if (userMealPlans.length !== mealPlanIds.length) {
      throw new AppError('Unauthorized', 403);
    }

    // Perform bulk updates
    const updatePromises = updates.map((update: any) => {
      const updateData: any = {};
      if (update.dayOfWeek !== undefined) updateData.dayOfWeek = update.dayOfWeek;
      if (update.mealType !== undefined) updateData.mealType = update.mealType;
      if (update.order !== undefined) updateData.order = update.order;
      if (update.familyMemberId !== undefined)
        updateData.familyMemberId = update.familyMemberId || null;

      return MealPlanItem.findByIdAndUpdate(update.id, updateData, {
        new: true,
        runValidators: true,
      });
    });

    await Promise.all(updatePromises);

    logger.info('Bulk meal plan items updated', {
      userId: user._id,
      itemCount: updates.length,
    });

    res.status(200).json({ message: 'Meal plan items updated successfully' });
  } catch (error) {
    next(error);
  }
};
