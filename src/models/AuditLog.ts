import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId;
  userEmail?: string;
  userRole?: string;
  action: string; // e.g. "USER_LOGIN", "PATIENT_CREATED", "APPOINTMENT_BOOKED", "PRESCRIPTION_ISSUED"
  module: string; // e.g. "AUTH", "PATIENTS", "APPOINTMENTS", "PHARMACY", "BILLING"
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    userEmail: String,
    userRole: String,
    action: {
      type: String,
      required: true,
      index: true
    },
    module: {
      type: String,
      required: true,
      index: true
    },
    resourceId: String,
    ipAddress: String,
    userAgent: String,
    details: Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

AuditLogSchema.index({ module: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
