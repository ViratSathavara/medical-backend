import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IDocumentRecord extends MongoDocument {
  title: string;
  category: 'ID_PROOF' | 'MEDICAL_HISTORY' | 'CERTIFICATE' | 'INSURANCE' | 'LAB_REPORT' | 'PRESCRIPTION' | 'OTHER';
  patient?: mongoose.Types.ObjectId;
  doctor?: mongoose.Types.ObjectId;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentRecordSchema = new Schema<IDocumentRecord>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['ID_PROOF', 'MEDICAL_HISTORY', 'CERTIFICATE', 'INSURANCE', 'LAB_REPORT', 'PRESCRIPTION', 'OTHER'],
      default: 'MEDICAL_HISTORY',
      index: true
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      index: true
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      index: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: String
  },
  {
    timestamps: true
  }
);

DocumentRecordSchema.index({ patient: 1, category: 1 });

export const DocumentRecord = mongoose.model<IDocumentRecord>('Document', DocumentRecordSchema);
