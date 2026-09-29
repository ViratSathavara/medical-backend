import mongoose, { Schema, Document } from 'mongoose';
import { BedStatus } from '../constants/statuses.js';

export interface IBed extends Document {
  bedNumber: string;
  room: mongoose.Types.ObjectId;
  bedType: 'Standard' | 'ICU' | 'Pediatric' | 'Bariatric';
  status: BedStatus;
  currentPatient?: mongoose.Types.ObjectId;
  currentAdmission?: mongoose.Types.ObjectId;
  dailyRate: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BedSchema = new Schema<IBed>(
  {
    bedNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true
    },
    bedType: {
      type: String,
      enum: ['Standard', 'ICU', 'Pediatric', 'Bariatric'],
      default: 'Standard'
    },
    status: {
      type: String,
      enum: Object.values(BedStatus),
      default: BedStatus.AVAILABLE,
      index: true
    },
    currentPatient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient'
    },
    currentAdmission: {
      type: Schema.Types.ObjectId,
      ref: 'Admission'
    },
    dailyRate: {
      type: Number,
      required: true,
      default: 50
    },
    notes: String
  },
  {
    timestamps: true
  }
);

BedSchema.index({ status: 1, room: 1 });

export const Bed = mongoose.model<IBed>('Bed', BedSchema);
