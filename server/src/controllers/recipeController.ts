import { Response, NextFunction } from 'express';
import { SessionRequest } from 'supertokens-node/framework/express';
import Recipe from '../models/Recipe';
import User from '../models/User';
import minioService from '../services/minioService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Create a new recipe
 */
export const createRecipe = async (
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

    const { title, description, ingredients, instructions, tags, isPublic } = req.body;

    // Validate required fields
    if (!title || !description || !ingredients || !instructions) {
      throw new AppError('Missing required fields', 400);
    }

    // Parse JSON fields
    let parsedIngredients, parsedInstructions, parsedTags;
    try {
      parsedIngredients = JSON.parse(ingredients);
      parsedInstructions = JSON.parse(instructions);
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch (error) {
      throw new AppError('Invalid JSON in ingredients, instructions, or tags', 400);
    }

    // Create recipe
    const recipe = await Recipe.create({
      userId: user._id,
      title,
      description,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      tags: parsedTags,
      isPublic: isPublic === 'true' || isPublic === true,
      images: [],
    });

    // Handle image uploads if present
    if (req.files && Array.isArray(req.files)) {
      const recipeImageUrls: string[] = [];
      const stepImageMap: { [key: number]: string } = {};

      for (const file of req.files) {
        // Check if it's a recipe image or step image
        if (file.fieldname === 'recipeImages') {
          const { url } = await minioService.uploadFile(file, `recipes/${recipe._id}/images`);
          recipeImageUrls.push(url);
        } else if (file.fieldname.startsWith('stepImage_')) {
          const stepIndex = parseInt(file.fieldname.split('_')[1]);
          const { url } = await minioService.uploadFile(file, `recipes/${recipe._id}/steps`);
          stepImageMap[stepIndex] = url;
        }
      }

      // Update recipe images
      recipe.images = recipeImageUrls;

      // Update step images in instructions
      recipe.instructions = recipe.instructions.map((step, index) => {
        if (stepImageMap[index]) {
          return { ...step, imageUrl: stepImageMap[index] };
        }
        return step;
      });

      await recipe.save();
    }

    logger.info('Recipe created', {
      recipeId: recipe._id,
      userId: user._id,
      title: recipe.title,
    });

    res.status(201).json({
      status: 'success',
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recipe by ID
 */
export const getRecipeById = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findById(id).populate('userId', 'name email profilePictureUrl');

    if (!recipe) {
      throw new AppError('Recipe not found', 404);
    }

    // Check if user has permission to view this recipe
    let userId: string | undefined;
    if (req.session) {
      const supertokensUserId = req.session.getUserId();
      const user = await User.findOne({ supertokensUserId });
      userId = user?._id.toString();
    }

    if (!recipe.isPublic && recipe.userId.toString() !== userId) {
      throw new AppError('You do not have permission to view this recipe', 403);
    }

    logger.info('Recipe retrieved', {
      recipeId: recipe._id,
      viewerId: userId,
    });

    res.json({
      status: 'success',
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's recipes
 */
export const getUserRecipes = async (
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

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    const recipes = await Recipe.find({ userId: user._id })
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await Recipe.countDocuments({ userId: user._id });

    logger.info('User recipes retrieved', {
      userId: user._id,
      count: recipes.length,
    });

    res.json({
      status: 'success',
      data: {
        recipes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update recipe
 */
export const updateRecipe = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const supertokensUserId = req.session.getUserId();
    const user = await User.findOne({ supertokensUserId });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      throw new AppError('Recipe not found', 404);
    }

    // Check ownership
    if (recipe.userId.toString() !== user._id.toString()) {
      throw new AppError('You do not have permission to update this recipe', 403);
    }

    const { title, description, ingredients, instructions, tags, isPublic, removedImages } = req.body;

    // Update fields
    if (title) recipe.title = title;
    if (description) recipe.description = description;
    if (ingredients) {
      try {
        recipe.ingredients = JSON.parse(ingredients);
      } catch (error) {
        throw new AppError('Invalid JSON in ingredients', 400);
      }
    }
    if (instructions) {
      try {
        recipe.instructions = JSON.parse(instructions);
      } catch (error) {
        throw new AppError('Invalid JSON in instructions', 400);
      }
    }
    if (tags) {
      try {
        recipe.tags = JSON.parse(tags);
      } catch (error) {
        throw new AppError('Invalid JSON in tags', 400);
      }
    }
    if (isPublic !== undefined) recipe.isPublic = isPublic === 'true' || isPublic === true;

    // Handle removed images
    if (removedImages) {
      try {
        const removed = JSON.parse(removedImages);
        recipe.images = recipe.images.filter(img => !removed.includes(img));
        // Delete removed images from MinIO
        for (const imageUrl of removed) {
          try {
            const parts = imageUrl.split('/');
            const filename = `recipes/${recipe._id}/images/${parts[parts.length - 1]}`;
            await minioService.deleteFile(filename);
          } catch (error) {
            logger.warn('Failed to delete removed image from MinIO', { imageUrl });
          }
        }
      } catch (error) {
        throw new AppError('Invalid JSON in removedImages', 400);
      }
    }

    // Handle new image uploads if present
    if (req.files && Array.isArray(req.files)) {
      const recipeImageUrls: string[] = [];
      const stepImageMap: { [key: number]: string } = {};

      for (const file of req.files) {
        // Check if it's a recipe image or step image
        if (file.fieldname === 'recipeImages') {
          const { url } = await minioService.uploadFile(file, `recipes/${recipe._id}/images`);
          recipeImageUrls.push(url);
        } else if (file.fieldname.startsWith('stepImage_')) {
          const stepIndex = parseInt(file.fieldname.split('_')[1]);
          const { url } = await minioService.uploadFile(file, `recipes/${recipe._id}/steps`);
          stepImageMap[stepIndex] = url;
        }
      }

      // Add new recipe images
      recipe.images.push(...recipeImageUrls);

      // Update step images in instructions
      recipe.instructions = recipe.instructions.map((step, index) => {
        if (stepImageMap[index]) {
          return { ...step, imageUrl: stepImageMap[index] };
        }
        return step;
      });
    }

    await recipe.save();

    logger.info('Recipe updated', {
      recipeId: recipe._id,
      userId: user._id,
    });

    res.json({
      status: 'success',
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete recipe
 */
export const deleteRecipe = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const supertokensUserId = req.session.getUserId();
    const user = await User.findOne({ supertokensUserId });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      throw new AppError('Recipe not found', 404);
    }

    // Check ownership
    if (recipe.userId.toString() !== user._id.toString()) {
      throw new AppError('You do not have permission to delete this recipe', 403);
    }

    // Delete all associated images
    if (recipe.images.length > 0) {
      try {
        const filenames = recipe.images.map((url) => {
          const parts = url.split('/');
          return `recipes/${recipe._id}/${parts[parts.length - 1]}`;
        });
        await minioService.deleteFiles(filenames);
      } catch (error) {
        logger.warn('Failed to delete recipe images', {
          recipeId: recipe._id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await recipe.deleteOne();

    logger.info('Recipe deleted', {
      recipeId: recipe._id,
      userId: user._id,
    });

    res.json({
      status: 'success',
      message: 'Recipe deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search recipes
 */
export const searchRecipes = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      query,
      tags,
      ingredients,
      isPublic,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const searchQuery: any = {};

    // Text search
    if (query) {
      searchQuery.$text = { $search: query as string };
    }

    // Tags filter
    if (tags) {
      const tagArray = (tags as string).split(',').map((t) => t.trim());
      searchQuery.tags = { $in: tagArray };
    }

    // Ingredients filter
    if (ingredients) {
      const ingredientArray = (ingredients as string).split(',').map((i) => i.trim());
      searchQuery['ingredients.name'] = { $in: ingredientArray };
    }

    // Public filter
    if (isPublic !== undefined) {
      searchQuery.isPublic = isPublic === 'true';
    } else {
      // By default, only show public recipes for search
      searchQuery.isPublic = true;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 };

    const recipes = await Recipe.find(searchQuery)
      .populate('userId', 'name profilePictureUrl')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await Recipe.countDocuments(searchQuery);

    logger.info('Recipe search performed', {
      query: searchQuery,
      resultsCount: recipes.length,
    });

    res.json({
      status: 'success',
      data: {
        recipes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete recipe image
 */
export const deleteRecipeImage = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const { imageUrl } = req.body;

    const supertokensUserId = req.session.getUserId();
    const user = await User.findOne({ supertokensUserId });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      throw new AppError('Recipe not found', 404);
    }

    // Check ownership
    if (recipe.userId.toString() !== user._id.toString()) {
      throw new AppError('You do not have permission to update this recipe', 403);
    }

    // Remove image from recipe
    recipe.images = recipe.images.filter((img) => img !== imageUrl);
    await recipe.save();

    // Delete from MinIO
    try {
      const parts = imageUrl.split('/');
      const filename = `recipes/${recipe._id}/${parts[parts.length - 1]}`;
      await minioService.deleteFile(filename);
    } catch (error) {
      logger.warn('Failed to delete image from MinIO', {
        recipeId: recipe._id,
        imageUrl,
      });
    }

    logger.info('Recipe image deleted', {
      recipeId: recipe._id,
      imageUrl,
    });

    res.json({
      status: 'success',
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all unique tags from recipes
 */
export const getAllTags = async (
  _req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tags = await Recipe.distinct('tags', { tags: { $ne: [] } });

    res.json({
      status: 'success',
      data: tags.sort(),
    });
  } catch (error) {
    next(error);
  }
};
