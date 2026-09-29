import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'LAB_REPORT' | 'BILLING' | 'EMERGENCY' | 'ANNOUNCEMENT' | 'SYSTEM';
  read: boolean;
  link?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['APPOINTMENT', 'PRESCRIPTION', 'LAB_REPORT', 'BILLING', 'EMERGENCY', 'ANNOUNCEMENT', 'SYSTEM'],
      default: 'SYSTEM',
      index: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    link: String,
    metadata: Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
