import mongoose, { Schema, Document } from 'mongoose';
import { StaffDesignation } from '../constants/roles.js';

export interface IStaff extends Document {
  user: mongoose.Types.ObjectId;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation: StaffDesignation;
  department: mongoose.Types.ObjectId;
  phone: string;
  joiningDate: Date;
  status: 'Active' | 'Inactive' | 'On Leave';
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
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
    designation: {
      type: String,
      enum: Object.values(StaffDesignation),
      required: true,
      index: true
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active'
    },
    profilePicture: String
  },
  {
    timestamps: true
  }
);

StaffSchema.index({ firstName: 'text', lastName: 'text', employeeId: 'text' });

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);
