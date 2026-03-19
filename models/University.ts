import mongoose, { Schema, Document, Model } from 'mongoose';
import connectDB from '@/lib/mongodb';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface IUniversity extends Document<string> {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  abbreviation?: string;
  location?: string;
  address?: string;
  logo?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  studentCount: number;
  programs: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema = new Schema<IUniversity>(
  {
    _id: { type: String, required: true },
    userId: { type: String, ref: 'User', default: '' },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    abbreviation: { type: String },
    location: { type: String },
    address: { type: String },
    logo: { type: String },
    description: { type: String },
    website: { type: String },
    email: { type: String },
    phone: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'] as VerificationStatus[],
      default: 'pending',
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, ref: 'User' },
    rejectionReason: { type: String },
    studentCount: { type: Number, default: 0 },
    programs: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    _id: false,
  }
);

void connectDB;

const University: Model<IUniversity> =
  (mongoose.models.University as Model<IUniversity>) ||
  mongoose.model<IUniversity>('University', UniversitySchema);

export default University;
