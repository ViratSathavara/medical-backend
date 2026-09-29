import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicineItem {
  name: string;
  dosage: string;      // e.g. "500mg"
  frequency: string;   // e.g. "1-0-1" or "Twice daily"
  duration: string;    // e.g. "5 days"
  route?: string;      // e.g. "Oral", "Intravenous"
  instructions?: string; // e.g. "After food"
}

export interface IPrescription extends Document {
  prescriptionNumber: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId;
  diagnosis: string;
  medicines: IMedicineItem[];
  notes?: string;
  issueDate: Date;
  pdfUrl?: string;
  dispensed: boolean;
  dispensedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineItemSchema = new Schema<IMedicineItem>(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    route: { type: String, default: 'Oral' },
    instructions: { type: String, default: 'Take with water after meal' }
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionNumber: {
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
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    diagnosis: {
      type: String,
      required: true
    },
    medicines: {
      type: [MedicineItemSchema],
      required: true,
      validate: [(val: any[]) => val.length > 0, 'At least one medicine is required']
    },
    notes: {
      type: String,
      default: ''
    },
    issueDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    pdfUrl: String,
    dispensed: {
      type: Boolean,
      default: false
    },
    dispensedAt: Date
  },
  {
    timestamps: true
  }
);

PrescriptionSchema.index({ patient: 1, issueDate: -1 });

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
