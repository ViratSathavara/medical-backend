import mongoose, { Schema, Document } from 'mongoose';

export interface ILabTest extends Document {
  name: string;
  code: string;
  category: string; // e.g. "Hematology", "Biochemistry", "Microbiology", "Radiology"
  price: number;
  normalRange: string;
  units: string;
  sampleType: string; // e.g. "Blood", "Urine", "Serum", "Swab"
  description?: string;
  turnaroundHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LabTestSchema = new Schema<ILabTest>(
  {
    name: {
      type: String,
      required: [true, 'Lab test name is required'],
      trim: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      default: 0
    },
    normalRange: {
      type: String,
      default: ''
    },
    units: {
      type: String,
      default: ''
    },
    sampleType: {
      type: String,
      default: 'Blood'
    },
    description: String,
    turnaroundHours: {
      type: Number,
      default: 24
    },
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

LabTestSchema.index({ name: 'text', code: 'text', category: 'text' });

export const LabTest = mongoose.model<ILabTest>('LabTest', LabTestSchema);
