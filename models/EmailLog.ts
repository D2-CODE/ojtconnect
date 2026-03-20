import mongoose, { Schema, Document, Model } from 'mongoose';

export type EmailTemplate =
  | 'claim_invite'
  | 'university_verification'
  | 'student_verified'
  | 'connection_request'
  | 'welcome';

export type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced';

export type EmailRelatedType =
  | 'ojt_wall'
  | 'university'
  | 'student'
  | 'connection'
  | 'user';

export interface IEmailLog extends Document<string> {
  _id: string;
  to: string;
  from: string;
  subject: string;
  template?: EmailTemplate;
  status: EmailStatus;
  statusMessage?: string;
  relatedId?: string;
  relatedType?: EmailRelatedType;
  attempts: number;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    _id: { type: String, required: true },
    to: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, required: true },
    template: {
      type: String,
      enum: [
        'claim_invite',
        'university_verification',
        'student_verified',
        'connection_request',
        'welcome',
      ] as EmailTemplate[],
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'bounced'] as EmailStatus[],
      default: 'pending',
    },
    statusMessage: { type: String },
    relatedId: { type: String },
    relatedType: {
      type: String,
      enum: ['ojt_wall', 'university', 'student', 'connection', 'user'] as EmailRelatedType[],
    },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
  }
);

const EmailLog: Model<IEmailLog> =
  (mongoose.models.EmailLog as Model<IEmailLog>) ||
  mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);

export default EmailLog;
