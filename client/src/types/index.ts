export interface User {
  _id: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  quantity: number;
  unit: string;
  name: string;
}

export interface InstructionStep {
  stepNumber: number;
  instruction: string;
  imageUrl?: string;
}

// Alias for backwards compatibility
export type RecipeInstruction = InstructionStep;

export interface Recipe {
  _id: string;
  userId: string | User;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  tags: string[];
  images: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationData;
}

export interface RecipeFormData {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  tags: string[];
  isPublic: boolean;
  images?: File[];
}

export interface SearchFilters {
  query?: string;
  tags?: string[];
  ingredient?: string;
}
