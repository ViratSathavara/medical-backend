import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicineStock extends Document {
  medicine: mongoose.Types.ObjectId;
  transactionType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceNumber?: string; // prescription or invoice or purchase order id
  performedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MedicineStockSchema = new Schema<IMedicineStock>(
  {
    medicine: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true
    },
    transactionType: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    previousQuantity: {
      type: Number,
      required: true
    },
    newQuantity: {
      type: Number,
      required: true
    },
    reason: String,
    referenceNumber: String,
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const MedicineStock = mongoose.model<IMedicineStock>('MedicineStock', MedicineStockSchema);
