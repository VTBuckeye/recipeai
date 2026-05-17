import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

export interface MealPlan {
  _id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanItem {
  _id: string;
  mealPlanId: string;
  recipeId?: {
    _id: string;
    title: string;
    description: string;
    images: string[];
  };
  familyMemberId?: {
    _id: string;
    name: string;
  };
  dayOfWeek: string;
  mealType: string;
  manualEntry?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanResponse {
  mealPlan: MealPlan;
  items: MealPlanItem[];
}

export interface CreateMealPlanItemRequest {
  mealPlanId: string;
  recipeId?: string;
  familyMemberId?: string;
  dayOfWeek: string;
  mealType: string;
  manualEntry?: string;
  order?: number;
}

export interface UpdateMealPlanItemRequest {
  recipeId?: string;
  familyMemberId?: string;
  dayOfWeek?: string;
  mealType?: string;
  manualEntry?: string;
  order?: number;
}

export interface BulkUpdateRequest {
  id: string;
  dayOfWeek?: string;
  mealType?: string;
  order?: number;
  familyMemberId?: string;
}

const mealPlanService = {
  /**
   * Get or create a meal plan for a specific week
   */
  getMealPlanByWeek: async (weekStartDate: string): Promise<MealPlanResponse> => {
    const response = await axios.get(`${API_URL}/meal-plans`, {
      params: { weekStartDate },
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Add an item to a meal plan
   */
  addMealPlanItem: async (data: CreateMealPlanItemRequest): Promise<MealPlanItem> => {
    const response = await axios.post(`${API_URL}/meal-plans/items`, data, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Update a meal plan item
   */
  updateMealPlanItem: async (
    id: string,
    data: UpdateMealPlanItemRequest
  ): Promise<MealPlanItem> => {
    const response = await axios.put(`${API_URL}/meal-plans/items/${id}`, data, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Delete a meal plan item
   */
  deleteMealPlanItem: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/meal-plans/items/${id}`, {
      withCredentials: true,
    });
  },

  /**
   * Bulk update meal plan items (for drag and drop)
   */
  bulkUpdateMealPlanItems: async (updates: BulkUpdateRequest[]): Promise<void> => {
    await axios.put(
      `${API_URL}/meal-plans/items/bulk`,
      { updates },
      {
        withCredentials: true,
      }
    );
  },
};

export default mealPlanService;
