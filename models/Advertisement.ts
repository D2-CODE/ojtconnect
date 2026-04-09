import mongoose, { Schema, Document, Model } from 'mongoose';

export type AdSlot = 'home_small' | 'home_medium' | 'home_large' | 'wall_sidebar';

export interface IAdvertisement extends Document<string> {
  _id: string;
  slot: AdSlot;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>(
  {
    _id: { type: String, required: true },
    slot: {
      type: String,
      enum: ['home_small', 'home_medium', 'home_large', 'wall_sidebar'] as AdSlot[],
      required: true,
    },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    _id: false,
  }
);

const Advertisement: Model<IAdvertisement> =
  (mongoose.models.Advertisement as Model<IAdvertisement>) ||
  mongoose.model<IAdvertisement>('Advertisement', AdvertisementSchema);

export default Advertisement;
