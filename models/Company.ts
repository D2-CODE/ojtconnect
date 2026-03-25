import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompany extends Document<string> {
  _id: string;
  userId: string;
  companyName: string;
  slug: string;
  industry?: string;
  location?: string;
  logo?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  isVerified: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    _id: { type: String, required: true },
    userId: { type: String, ref: 'User', default: '' },
    companyName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    industry: { type: String },
    location: { type: String },
    logo: { type: String },
    description: { type: String },
    website: { type: String },
    email: { type: String },
    phone: { type: String },
    isVerified: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    _id: false,
  }
);

const Company: Model<ICompany> =
  (mongoose.models.Company as Model<ICompany>) ||
  mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
