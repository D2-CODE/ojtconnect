import mongoose, { Schema, Document, Model } from 'mongoose';

export type LeadType = 'intern' | 'internship';
export type OjtWallStatus = 'unclaimed' | 'claimed' | 'expired' | 'hidden';
export type OjtWallSource = 'scraped' | 'company' | 'student';

export interface IFbLead {
  name?: string;
  fb_id?: string;
  profile_url?: string;
  profile_pic?: string;
  post_text?: string;
  post_link?: string;
  post_date?: Date;
  emails?: string;
  phones?: string;
  skills?: string;
  experience?: string;
  lead_type?: LeadType;
  resume_url?: string;
  scraped_at?: Date;
}

export interface ISectionData {
  fbleads?: IFbLead;
}

export interface IOjtWall extends Document<string> {
  _id: string;
  source?: OjtWallSource;
  postedBy?: string;
  postedByName?: string;
  title?: string;
  description?: string;
  skills?: string[];
  setup?: string;
  location?: string;
  allowance?: string;
  slots?: number;
  hoursRequired?: number;
  deadline?: Date;
  SectionData?: ISectionData;
  claimedBy?: string;
  claimedAt?: Date;
  claimToken?: string;
  claimTokenExpiry?: Date;
  claimEmailSent: boolean;
  claimEmailSentAt?: Date;
  status: OjtWallStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FbLeadSchema = new Schema<IFbLead>(
  {
    name: { type: String },
    fb_id: { type: String },
    profile_url: { type: String },
    profile_pic: { type: String },
    post_text: { type: String },
    post_link: { type: String },
    post_date: { type: Date },
    emails: { type: String },
    phones: { type: String },
    skills: { type: String },
    experience: { type: String },
    lead_type: {
      type: String,
      enum: ['intern', 'internship'] as LeadType[],
    },
    resume_url: { type: String },
    scraped_at: { type: Date },
  },
  { _id: false }
);

const SectionDataSchema = new Schema<ISectionData>(
  {
    fbleads: { type: FbLeadSchema },
  },
  { _id: false }
);

const OjtWallSchema = new Schema<IOjtWall>(
  {
    _id: { type: String, required: true },
    source: { type: String, enum: ['scraped', 'company', 'student'] as OjtWallSource[], default: 'scraped' },
    postedBy: { type: String },
    postedByName: { type: String },
    title: { type: String },
    description: { type: String },
    skills: { type: [String], default: [] },
    setup: { type: String },
    location: { type: String },
    allowance: { type: String },
    slots: { type: Number },
    hoursRequired: { type: Number },
    deadline: { type: Date },
    SectionData: { type: SectionDataSchema },
    claimedBy: { type: String, ref: 'User' },
    claimedAt: { type: Date },
    claimToken: { type: String },
    claimTokenExpiry: { type: Date },
    claimEmailSent: { type: Boolean, default: false },
    claimEmailSentAt: { type: Date },
    status: {
      type: String,
      enum: ['unclaimed', 'claimed', 'expired', 'hidden'] as OjtWallStatus[],
      default: 'unclaimed',
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date },
  },
  {
    // No automatic timestamps — createdAt is set manually from FB scraper $date format
    // updatedAt is managed automatically via the option below
    timestamps: { createdAt: false, updatedAt: true },
    _id: false,
    minimize: false,
  }
);

const OjtWall: Model<IOjtWall> =
  (mongoose.models.OjtWall as Model<IOjtWall>) ||
  mongoose.model<IOjtWall>('OjtWall', OjtWallSchema);

export default OjtWall;
