import mongoose, { Schema, Document, Model } from 'mongoose';
import connectDB from '@/lib/mongodb';

export type ProfileType = 'student' | 'company' | 'university_admin' | 'super_admin';

export interface IUser extends Document<string> {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  profileComplete: boolean;
  profileRef?: string;
  profileType?: ProfileType;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, ref: 'Role', required: true },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },
    profileRef: { type: String },
    profileType: {
      type: String,
      enum: ['student', 'company', 'university_admin', 'super_admin'] as ProfileType[],
    },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
  }
);

void connectDB;

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default User;
