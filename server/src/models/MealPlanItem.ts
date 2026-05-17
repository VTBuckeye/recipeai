import mongoose, { Schema, Document } from 'mongoose';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export enum DayOfWeek {
  SUNDAY = 'sunday',
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
}

export interface IMealPlanItem extends Document {
  mealPlanId: mongoose.Types.ObjectId;
  recipeId?: mongoose.Types.ObjectId;
  familyMemberId?: mongoose.Types.ObjectId;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  manualEntry?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const MealPlanItemSchema = new Schema<IMealPlanItem>(
  {
    mealPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'MealPlan',
      required: true,
      index: true,
    },
    recipeId: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      default: null,
    },
    familyMemberId: {
      type: Schema.Types.ObjectId,
      ref: 'FamilyMember',
      default: null,
    },
    dayOfWeek: {
      type: String,
      enum: Object.values(DayOfWeek),
      required: true,
    },
    mealType: {
      type: String,
      enum: Object.values(MealType),
      required: true,
    },
    manualEntry: {
      type: String,
      default: null,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'meal_plan_items',
  }
);

// Compound indexes for efficient queries
MealPlanItemSchema.index({ mealPlanId: 1, dayOfWeek: 1, mealType: 1, order: 1 });
MealPlanItemSchema.index({ mealPlanId: 1, familyMemberId: 1 });

// Validation: Must have either recipeId or manualEntry
MealPlanItemSchema.pre('save', function (next) {
  if (!this.recipeId && !this.manualEntry) {
    next(new Error('Meal plan item must have either a recipe or manual entry'));
  } else {
    next();
  }
});

const MealPlanItem = mongoose.model<IMealPlanItem>('MealPlanItem', MealPlanItemSchema);

export default MealPlanItem;
