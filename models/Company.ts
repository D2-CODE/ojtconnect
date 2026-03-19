import mongoose, { Schema, Document, Model } from 'mongoose';
import connectDB from '@/lib/mongodb';

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';
export type InternshipSetup = 'onsite' | 'remote' | 'hybrid';

export interface IInternshipDetails {
  allowance?: boolean;
  allowanceAmount?: number;
  setup?: InternshipSetup;
  hoursPerDay?: number;
  daysPerWeek?: number;
}

export interface ICompany extends Document<string> {
  _id: string;
  userId: string;
  companyName: string;
  slug: string;
  industry?: string;
  companySize?: CompanySize;
  location?: string;
  address?: string;
  logo?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  internSlotsOpen: number;
  internshipDetails?: IInternshipDetails;
  preferredSkills: string[];
  acceptsMOA: boolean;
  isVerified: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InternshipDetailsSchema = new Schema<IInternshipDetails>(
  {
    allowance: { type: Boolean },
    allowanceAmount: { type: Number },
    setup: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'] as InternshipSetup[],
    },
    hoursPerDay: { type: Number },
    daysPerWeek: { type: Number },
  },
  { _id: false }
);

const CompanySchema = new Schema<ICompany>(
  {
    _id: { type: String, required: true },
    userId: { type: String, ref: 'User', default: '' },
    companyName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    industry: { type: String },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'] as CompanySize[],
    },
    location: { type: String },
    address: { type: String },
    logo: { type: String },
    description: { type: String },
    website: { type: String },
    email: { type: String },
    phone: { type: String },
    internSlotsOpen: { type: Number, default: 0 },
    internshipDetails: { type: InternshipDetailsSchema },
    preferredSkills: { type: [String], default: [] },
    acceptsMOA: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    _id: false,
  }
);

void connectDB;

const Company: Model<ICompany> =
  (mongoose.models.Company as Model<ICompany>) ||
  mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
