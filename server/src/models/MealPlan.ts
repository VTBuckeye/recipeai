import mongoose, { Schema, Document } from 'mongoose';

export interface IMealPlan extends Document {
  userId: mongoose.Types.ObjectId;
  weekStartDate: Date;
  weekEndDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MealPlanSchema = new Schema<IMealPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    weekEndDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'meal_plans',
  }
);

// Compound index for user's meal plans by date
MealPlanSchema.index({ userId: 1, weekStartDate: 1 });
MealPlanSchema.index({ userId: 1, weekStartDate: 1, weekEndDate: 1 });

// Ensure weekEndDate is after weekStartDate
MealPlanSchema.pre('save', function (next) {
  if (this.weekEndDate <= this.weekStartDate) {
    next(new Error('Week end date must be after week start date'));
  } else {
    next();
  }
});

const MealPlan = mongoose.model<IMealPlan>('MealPlan', MealPlanSchema);

export default MealPlan;
