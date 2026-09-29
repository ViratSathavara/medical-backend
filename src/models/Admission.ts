import mongoose, { Schema, Document } from 'mongoose';
import { AdmissionStatus } from '../constants/statuses.js';

export interface IAdmission extends Document {
  admissionNumber: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
  bed: mongoose.Types.ObjectId;
  admissionDate: Date;
  admissionReason: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  initialDiagnosis: string;
  notes?: string;
  status: AdmissionStatus;
  dischargeDate?: Date;
  dischargeSummary?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionSchema = new Schema<IAdmission>(
  {
    admissionNumber: {
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
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    bed: {
      type: Schema.Types.ObjectId,
      ref: 'Bed',
      required: true
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    admissionReason: {
      type: String,
      required: true
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    initialDiagnosis: {
      type: String,
      required: true
    },
    notes: String,
    status: {
      type: String,
      enum: Object.values(AdmissionStatus),
      default: AdmissionStatus.ADMITTED,
      index: true
    },
    dischargeDate: Date,
    dischargeSummary: {
      type: Schema.Types.ObjectId,
      ref: 'Discharge'
    }
  },
  {
    timestamps: true
  }
);

AdmissionSchema.index({ patient: 1, status: 1 });

export const Admission = mongoose.model<IAdmission>('Admission', AdmissionSchema);
