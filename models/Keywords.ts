import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKeywords extends Document {
  companyKeywords: string[];
  studentKeywords: string[];
}

const KeywordsSchema = new Schema<IKeywords>(
  {
    companyKeywords: { type: [String], default: [] },
    studentKeywords: { type: [String], default: [] },
  },
  { timestamps: false }
);


// Delete cached model to prevent stale schema on hot reload
if (mongoose.models.Keywords) delete mongoose.models.Keywords;

const Keywords: Model<IKeywords> = mongoose.model<IKeywords>('Keywords', KeywordsSchema);

export default Keywords;
