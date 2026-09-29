import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  user: mongoose.Types.ObjectId;
  adminId: string;
  firstName: string;
  lastName: string;
  permissions: string[];
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    adminId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    permissions: {
      type: [String],
      default: ['ALL']
    },
    phone: String
  },
  {
    timestamps: true
  }
);

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
