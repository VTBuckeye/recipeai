import mongoose, { Schema, Document } from 'mongoose';

interface IIngredient {
  quantity: number;
  unit: string;
  name: string;
}

interface IRecipeInstruction {
  stepNumber: number;
  instruction: string;
  imageUrl?: string;
}

export interface IRecipe extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  ingredients: IIngredient[];
  instructions: IRecipeInstruction[];
  tags: string[];
  images: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const RecipeInstructionSchema = new Schema<IRecipeInstruction>(
  {
    stepNumber: {
      type: Number,
      required: true,
    },
    instruction: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const RecipeSchema = new Schema<IRecipe>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ingredients: {
      type: [IngredientSchema],
      required: true,
      validate: {
        validator: (v: IIngredient[]) => v.length > 0,
        message: 'Recipe must have at least one ingredient',
      },
    },
    instructions: {
      type: [RecipeInstructionSchema],
      required: true,
      validate: {
        validator: (v: IRecipeInstruction[]) => v.length > 0,
        message: 'Recipe must have at least one instruction',
      },
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'recipes',
  }
);

// Text index for search functionality
RecipeSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

// Compound indexes for common queries
RecipeSchema.index({ userId: 1, createdAt: -1 });
RecipeSchema.index({ isPublic: 1, createdAt: -1 });
RecipeSchema.index({ 'ingredients.name': 1 });

const Recipe = mongoose.model<IRecipe>('Recipe', RecipeSchema);

export default Recipe;
