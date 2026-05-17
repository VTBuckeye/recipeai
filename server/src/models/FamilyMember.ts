import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyMember extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyMemberSchema = new Schema<IFamilyMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'family_members',
  }
);

// Compound index for user's family members
FamilyMemberSchema.index({ userId: 1, name: 1 });

const FamilyMember = mongoose.model<IFamilyMember>('FamilyMember', FamilyMemberSchema);

export default FamilyMember;
