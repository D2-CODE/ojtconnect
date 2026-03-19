import mongoose, { Schema, Document, Model } from 'mongoose';
import connectDB from '@/lib/mongodb';

export type ConnectionPartyType = 'student' | 'company';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface IConnection extends Document<string> {
  _id: string;
  fromUserId: string;
  fromType: ConnectionPartyType;
  fromProfileId: string;
  toUserId: string;
  toType: ConnectionPartyType;
  toProfileId: string;
  status: ConnectionStatus;
  message?: string;
  contactEmail?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    _id: { type: String, required: true },
    fromUserId: { type: String, ref: 'User', required: true },
    fromType: {
      type: String,
      enum: ['student', 'company'] as ConnectionPartyType[],
      required: true,
    },
    fromProfileId: { type: String, required: true },
    toUserId: { type: String, ref: 'User', required: true },
    toType: {
      type: String,
      enum: ['student', 'company'] as ConnectionPartyType[],
      required: true,
    },
    toProfileId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'] as ConnectionStatus[],
      default: 'pending',
    },
    message: { type: String },
    contactEmail: { type: String },
    respondedAt: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
  }
);

void connectDB;

const Connection: Model<IConnection> =
  (mongoose.models.Connection as Model<IConnection>) ||
  mongoose.model<IConnection>('Connection', ConnectionSchema);

export default Connection;
