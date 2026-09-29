import mongoose, { Schema, Document } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../constants/statuses.js';

export interface IPayment extends Document {
  paymentNumber: string;
  invoice: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  status: PaymentStatus;
  paymentDate: Date;
  notes?: string;
  gatewayResponse?: any;
  receivedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CASH,
      required: true
    },
    transactionId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PAID,
      index: true
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: String,
    gatewayResponse: Schema.Types.Mixed,
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

PaymentSchema.index({ invoice: 1, paymentDate: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
