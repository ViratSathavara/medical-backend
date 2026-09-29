import mongoose, { Schema, Document } from 'mongoose';
import { EmergencyPriority } from '../constants/statuses.js';

export interface IEmergencyCase extends Document {
  caseNumber: string;
  patient?: mongoose.Types.ObjectId;
  patientName: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  contactPhone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  priority: EmergencyPriority;
  symptoms: string;
  initialDiagnosis?: string;
  triageNotes?: string;
  attendingDoctor?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  status: 'Triaged' | 'Under Treatment' | 'Admitted' | 'Discharged' | 'Transferred' | 'Deceased';
  admittedBed?: mongoose.Types.ObjectId;
  arrivalTime: Date;
  dischargeTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyCaseSchema = new Schema<IEmergencyCase>(
  {
    caseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient'
    },
    patientName: {
      type: String,
      required: true,
      trim: true
    },
    age: Number,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    contactPhone: String,
    emergencyContact: {
      name: String,
      phone: String
    },
    priority: {
      type: String,
      enum: Object.values(EmergencyPriority),
      default: EmergencyPriority.HIGH,
      index: true
    },
    symptoms: {
      type: String,
      required: true
    },
    initialDiagnosis: String,
    triageNotes: String,
    attendingDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department'
    },
    status: {
      type: String,
      enum: ['Triaged', 'Under Treatment', 'Admitted', 'Discharged', 'Transferred', 'Deceased'],
      default: 'Triaged',
      index: true
    },
    admittedBed: {
      type: Schema.Types.ObjectId,
      ref: 'Bed'
    },
    arrivalTime: {
      type: Date,
      default: Date.now,
      index: true
    },
    dischargeTime: Date
  },
  {
    timestamps: true
  }
);

export const EmergencyCase = mongoose.model<IEmergencyCase>('EmergencyCase', EmergencyCaseSchema);
