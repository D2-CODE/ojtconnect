import mongoose, { Schema, Model } from 'mongoose';

export interface IContactUnlock {
  _id: string;
  companyProfileId: string;
  postId: string;
  unlockedAt: Date;
}

const ContactUnlockSchema = new Schema<IContactUnlock>(
  {
    _id: { type: String, required: true },
    companyProfileId: { type: String, required: true },
    postId: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ContactUnlock: Model<IContactUnlock> =
  (mongoose.models.ContactUnlock as Model<IContactUnlock>) ||
  mongoose.model<IContactUnlock>('ContactUnlock', ContactUnlockSchema);

export default ContactUnlock;
