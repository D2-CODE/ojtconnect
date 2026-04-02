import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKeywords extends Document {
  companyPriority: string[];
  studentPriority: string[];
  stripLines: string[];
  updatedAt: Date;
}

const KeywordsSchema = new Schema<IKeywords>(
  {
    companyPriority: { type: [String], default: [] },
    studentPriority: { type: [String], default: [] },
    stripLines:      { type: [String], default: [] },
  },
  { timestamps: true }
);

const Keywords: Model<IKeywords> =
  (mongoose.models.Keywords as Model<IKeywords>) ||
  mongoose.model<IKeywords>('Keywords', KeywordsSchema);

export default Keywords;
