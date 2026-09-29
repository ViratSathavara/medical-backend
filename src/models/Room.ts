import mongoose, { Schema, Document } from 'mongoose';
import { RoomType } from '../constants/statuses.js';

export interface IRoom extends Document {
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  totalBeds: number;
  dailyRate: number;
  department?: mongoose.Types.ObjectId;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    floor: {
      type: Number,
      required: true,
      default: 1
    },
    roomType: {
      type: String,
      enum: Object.values(RoomType),
      default: RoomType.GENERAL_WARD,
      index: true
    },
    totalBeds: {
      type: Number,
      required: true,
      default: 1
    },
    dailyRate: {
      type: Number,
      required: true,
      default: 100
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department'
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
