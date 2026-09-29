import mongoose, { Schema, Document } from 'mongoose';
import { AppointmentStatus, AppointmentType, PaymentStatus } from '../constants/statuses.js';

export interface IAppointment extends Document {
  appointmentNumber: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  appointmentDate: Date;
  appointmentTime: string; // e.g. "09:00 - 09:30"
  type: AppointmentType;
  reason: string;
  symptoms: string[];
  notes?: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  consultationFee: number;
  cancellationReason?: string;
  isEmergency: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointmentNumber: {
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
      required: true,
      index: true
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true
    },
    appointmentTime: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(AppointmentType),
      default: AppointmentType.IN_PERSON
    },
    reason: {
      type: String,
      required: true
    },
    symptoms: {
      type: [String],
      default: []
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true
    },
    consultationFee: {
      type: Number,
      default: 50
    },
    cancellationReason: String,
    isEmergency: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent double booking for the same doctor at the same date and time slot
// We exclude cancelled and rejected appointments from this uniqueness check via application logic
AppointmentSchema.index({ doctor: 1, appointmentDate: 1, appointmentTime: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
