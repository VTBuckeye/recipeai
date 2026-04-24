import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  supertokensUserId: string;
  profilePictureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    supertokensUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    profilePictureUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Index for faster lookups
UserSchema.index({ email: 1 });
UserSchema.index({ supertokensUserId: 1 });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
