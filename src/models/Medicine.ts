import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicine extends Document {
  name: string;
  genericName?: string;
  category: string; // e.g. "Antibiotics", "Analgesics", "Cardiovascular"
  manufacturer: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  minStockAlert: number;
  purchasePrice: number;
  sellingPrice: number;
  unit: string; // e.g. "Tablets", "Syrup", "Vial", "Strip"
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      index: true
    },
    genericName: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    manufacturer: {
      type: String,
      required: true
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      index: true
    },
    minStockAlert: {
      type: Number,
      default: 10
    },
    purchasePrice: {
      type: Number,
      required: true,
      default: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      default: 0
    },
    unit: {
      type: String,
      default: 'Tablets'
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

MedicineSchema.index({ name: 'text', genericName: 'text', category: 'text' });

export const Medicine = mongoose.model<IMedicine>('Medicine', MedicineSchema);
