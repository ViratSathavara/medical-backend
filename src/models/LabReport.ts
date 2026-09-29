import mongoose, { Schema, Document } from 'mongoose';

export interface ILabResultItem {
  test: mongoose.Types.ObjectId;
  testName: string;
  result: string;
  normalRange: string;
  units: string;
  flag: 'Normal' | 'Abnormal' | 'Critical';
  remarks?: string;
}

export interface ILabReport extends Document {
  reportNumber: string;
  labRequest: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  results: ILabResultItem[];
  technicianNotes?: string;
  conductedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  pdfUrl?: string;
  status: 'Draft' | 'Final' | 'Amended';
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LabResultItemSchema = new Schema<ILabResultItem>(
  {
    test: {
      type: Schema.Types.ObjectId,
      ref: 'LabTest',
      required: true
    },
    testName: { type: String, required: true },
    result: { type: String, required: true },
    normalRange: { type: String, default: '' },
    units: { type: String, default: '' },
    flag: {
      type: String,
      enum: ['Normal', 'Abnormal', 'Critical'],
      default: 'Normal'
    },
    remarks: String
  },
  { _id: false }
);

const LabReportSchema = new Schema<ILabReport>(
  {
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    labRequest: {
      type: Schema.Types.ObjectId,
      ref: 'LabRequest',
      required: true,
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
    results: [LabResultItemSchema],
    technicianNotes: String,
    conductedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    pdfUrl: String,
    status: {
      type: String,
      enum: ['Draft', 'Final', 'Amended'],
      default: 'Final'
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

LabReportSchema.index({ patient: 1, completedAt: -1 });

export const LabReport = mongoose.model<ILabReport>('LabReport', LabReportSchema);
