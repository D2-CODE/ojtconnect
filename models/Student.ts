import mongoose, { Schema, Document, Model } from 'mongoose';

export type PreferredSetup = 'onsite' | 'remote' | 'hybrid';
export type UniversityVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface IStudent extends Document<string> {
  _id: string;
  userId: string;
  universityId?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  studentNumber?: string;
  course?: string;
  major?: string;
  yearLevel?: number;
  profilePic?: string;
  bio?: string;
  skills: string[];
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  availableFrom?: Date;
  ojtHoursRequired: number;
  preferredSetup?: PreferredSetup;
  preferredLocation?: string;
  contactEmail?: string;
  universityVerificationStatus: UniversityVerificationStatus;
  universityVerifiedAt?: Date;
  universityVerifiedBy?: string;
  universityRejectionReason?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    _id: { type: String, required: true },
    userId: { type: String, ref: 'User', default: '' },
    universityId: { type: String, ref: 'University' },
    firstName: { type: String },
    lastName: { type: String },
    displayName: { type: String },
    studentNumber: { type: String },
    course: { type: String },
    major: { type: String },
    yearLevel: { type: Number },
    profilePic: { type: String },
    bio: { type: String },
    skills: { type: [String], default: [] },
    resumeUrl: { type: String },
    portfolioUrl: { type: String },
    linkedinUrl: { type: String },
    availableFrom: { type: Date },
    ojtHoursRequired: { type: Number, default: 300 },
    preferredSetup: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'] as PreferredSetup[],
    },
    preferredLocation: { type: String },
    contactEmail: { type: String },
    universityVerificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'] as UniversityVerificationStatus[],
      default: 'unverified',
    },
    universityVerifiedAt: { type: Date },
    universityVerifiedBy: { type: String, ref: 'User' },
    universityRejectionReason: { type: String },
    isVisible: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    _id: false,
  }
);

const Student: Model<IStudent> =
  (mongoose.models.Student as Model<IStudent>) ||
  mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
