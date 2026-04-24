import { Request } from 'express';

// Extend Express Request to include user session
export interface AuthenticatedRequest extends Request {
  session?: {
    userId: string;
    handle?: string;
  };
}

export interface Ingredient {
  quantity: number;
  unit: string;
  name: string;
}

export interface RecipeInstruction {
  stepNumber: number;
  instruction: string;
  imageUrl?: string;
}

export interface RecipeDocument {
  _id: string;
  userId: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: RecipeInstruction[];
  tags: string[];
  images: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument {
  _id: string;
  email: string;
  name: string;
  supertokensUserId: string;
  profilePictureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageUploadResponse {
  url: string;
  filename: string;
}

export interface SearchQuery {
  query?: string;
  tags?: string[];
  ingredients?: string[];
  isPublic?: boolean;
  userId?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
