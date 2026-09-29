import mongoose, { Schema, Document } from 'mongoose';
import { LabRequestStatus } from '../constants/statuses.js';

export interface ILabRequest extends Document {
  requestNumber: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId;
  tests: mongoose.Types.ObjectId[];
  status: LabRequestStatus;
  priority: 'Routine' | 'Urgent' | 'STAT';
  clinicalNotes?: string;
  sampleCollectedAt?: Date;
  sampleCollector?: mongoose.Types.ObjectId;
  totalCost: number;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LabRequestSchema = new Schema<ILabRequest>(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    tests: [
      {
        type: Schema.Types.ObjectId,
        ref: 'LabTest',
        required: true
      }
    ],
    status: {
      type: String,
      enum: Object.values(LabRequestStatus),
      default: LabRequestStatus.REQUESTED,
      index: true
    },
    priority: {
      type: String,
      enum: ['Routine', 'Urgent', 'STAT'],
      default: 'Routine'
    },
    clinicalNotes: String,
    sampleCollectedAt: Date,
    sampleCollector: {
      type: Schema.Types.ObjectId,
      ref: 'Staff'
    },
    totalCost: {
      type: Number,
      default: 0
    },
    isPaid: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const LabRequest = mongoose.model<ILabRequest>('LabRequest', LabRequestSchema);
