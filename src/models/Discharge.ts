import mongoose, { Schema, Document } from 'mongoose';

export interface IDischargeMedicine {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface IDischarge extends Document {
  dischargeNumber: string;
  admission: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  dischargeDate: Date;
  finalDiagnosis: string;
  treatmentSummary: string;
  dischargeInstructions: string;
  prescribedMedicines: IDischargeMedicine[];
  followUpDate?: Date;
  doctorNotes?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DischargeMedicineSchema = new Schema<IDischargeMedicine>(
  {
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, default: '' }
  },
  { _id: false }
);

const DischargeSchema = new Schema<IDischarge>(
  {
    dischargeNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    admission: {
      type: Schema.Types.ObjectId,
      ref: 'Admission',
      required: true,
      unique: true
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
      required: true
    },
    dischargeDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    finalDiagnosis: {
      type: String,
      required: true
    },
    treatmentSummary: {
      type: String,
      required: true
    },
    dischargeInstructions: {
      type: String,
      required: true
    },
    prescribedMedicines: [DischargeMedicineSchema],
    followUpDate: Date,
    doctorNotes: String,
    pdfUrl: String
  },
  {
    timestamps: true
  }
);

export const Discharge = mongoose.model<IDischarge>('Discharge', DischargeSchema);
