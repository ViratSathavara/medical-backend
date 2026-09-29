import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  user: mongoose.Types.ObjectId;
  patientId: string; // e.g. PAT-1001
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  allergies: string[];
  existingConditions: string[];
  previousSurgeries: string[];
  familyHistory: string[];
  insurance?: {
    provider?: string;
    policyNumber?: string;
    expiryDate?: Date;
  };
  assignedDoctor?: mongoose.Types.ObjectId;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'USA' }
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    allergies: {
      type: [String],
      default: []
    },
    existingConditions: {
      type: [String],
      default: []
    },
    previousSurgeries: {
      type: [String],
      default: []
    },
    familyHistory: {
      type: [String],
      default: []
    },
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date
    },
    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    profilePicture: String
  },
  {
    timestamps: true
  }
);

PatientSchema.index({ firstName: 'text', lastName: 'text', patientId: 'text', phone: 'text' });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
