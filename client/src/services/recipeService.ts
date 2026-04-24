// Recipe API service
import api from '../config/api';
import { Recipe, RecipeFormData, PaginatedResponse, SearchFilters } from '../types';

export const recipeService = {
  // Get user's recipes (paginated)
  getMyRecipes: async (page: number = 1, limit: number = 12): Promise<PaginatedResponse<Recipe>> => {
    const response = await api.get('/recipes', { params: { page, limit } });
    // Backend returns { status: 'success', data: { recipes, pagination } }
    return {
      data: response.data.data.recipes,
      pagination: {
        ...response.data.data.pagination,
        totalPages: response.data.data.pagination.pages
      }
    };
  },

  // Search public recipes
  searchRecipes: async (filters: SearchFilters, page: number = 1, limit: number = 12): Promise<PaginatedResponse<Recipe>> => {
    const response = await api.get('/recipes/search', {
      params: { ...filters, page, limit }
    });
    // Backend returns { status: 'success', data: { recipes, pagination } }
    return {
      data: response.data.data.recipes,
      pagination: {
        ...response.data.data.pagination,
        totalPages: response.data.data.pagination.pages
      }
    };
  },

  // Get single recipe by ID
  getRecipeById: async (id: string): Promise<Recipe> => {
    const response = await api.get(`/recipes/${id}`);
    // Backend returns { status: 'success', data: { recipe } }
    return response.data.data.recipe;
  },

  // Create new recipe
  createRecipe: async (formData: FormData): Promise<Recipe> => {
    const response = await api.post('/recipes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // Backend returns { status: 'success', data: { recipe } }
    return response.data.data.recipe;
  },

  // Update existing recipe
  updateRecipe: async (id: string, formData: FormData): Promise<Recipe> => {
    const response = await api.patch(`/recipes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // Backend returns { status: 'success', data: { recipe } }
    return response.data.data.recipe;
  },

  // Delete recipe
  deleteRecipe: async (id: string): Promise<void> => {
    await api.delete(`/recipes/${id}`);
  },

  // Delete recipe image
  deleteRecipeImage: async (id: string, imageUrl: string): Promise<void> => {
    await api.delete(`/recipes/${id}/images`, { data: { imageUrl } });
  },

  // Get all unique tags
  getAllTags: async (): Promise<string[]> => {
    const response = await api.get('/recipes/tags/all');
    // Backend returns { status: 'success', data: tags }
    return response.data.data;
  }
};
