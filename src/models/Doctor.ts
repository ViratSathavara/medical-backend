import mongoose, { Schema, Document } from 'mongoose';
import { DoctorStatus } from '../constants/statuses.js';

export interface ITimeSlot {
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "09:30"
  maxPatients: number;
}

export interface IDoctor extends Document {
  user: mongoose.Types.ObjectId;
  doctorId: string; // e.g. DOC-2001
  firstName: string;
  lastName: string;
  specialization: string;
  department: mongoose.Types.ObjectId;
  qualifications: string[];
  experienceYears: number;
  consultationFee: number;
  availableDays: string[]; // e.g. ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  availableTimeSlots: ITimeSlot[];
  status: DoctorStatus;
  bio?: string;
  roomNumber?: string;
  phone: string;
  profilePicture?: string;
  rating?: number;
  totalReviews?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<ITimeSlot>(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    maxPatients: { type: Number, default: 1 }
  },
  { _id: false }
);

const DoctorSchema = new Schema<IDoctor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    doctorId: {
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
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      index: true
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true
    },
    qualifications: {
      type: [String],
      default: []
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    consultationFee: {
      type: Number,
      required: true,
      default: 50
    },
    availableDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    availableTimeSlots: {
      type: [TimeSlotSchema],
      default: [
        { startTime: '09:00', endTime: '09:30', maxPatients: 1 },
        { startTime: '09:30', endTime: '10:00', maxPatients: 1 },
        { startTime: '10:00', endTime: '10:30', maxPatients: 1 },
        { startTime: '10:30', endTime: '11:00', maxPatients: 1 },
        { startTime: '11:00', endTime: '11:30', maxPatients: 1 },
        { startTime: '11:30', endTime: '12:00', maxPatients: 1 },
        { startTime: '14:00', endTime: '14:30', maxPatients: 1 },
        { startTime: '14:30', endTime: '15:00', maxPatients: 1 },
        { startTime: '15:00', endTime: '15:30', maxPatients: 1 },
        { startTime: '15:30', endTime: '16:00', maxPatients: 1 },
        { startTime: '16:00', endTime: '16:30', maxPatients: 1 },
        { startTime: '16:30', endTime: '17:00', maxPatients: 1 }
      ]
    },
    status: {
      type: String,
      enum: Object.values(DoctorStatus),
      default: DoctorStatus.APPROVED,
      index: true
    },
    bio: {
      type: String,
      default: ''
    },
    roomNumber: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    profilePicture: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 4.8
    },
    totalReviews: {
      type: Number,
      default: 24
    }
  },
  {
    timestamps: true
  }
);

DoctorSchema.index({ firstName: 'text', lastName: 'text', specialization: 'text' });

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
