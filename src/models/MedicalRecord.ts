import mongoose, { Schema, Document } from 'mongoose';

export interface IVitalSigns {
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface IMedicalRecord extends Document {
  recordNumber: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId;
  visitDate: Date;
  symptoms: string[];
  diagnosis: string;
  treatment: string;
  clinicalNotes?: string;
  vitalSigns: IVitalSigns;
  allergies: string[];
  existingConditions: string[];
  previousSurgeries: string[];
  familyHistory: string[];
  labReports: mongoose.Types.ObjectId[];
  prescriptions: mongoose.Types.ObjectId[];
  documents: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const VitalSignsSchema = new Schema<IVitalSigns>(
  {
    bpSystolic: Number,
    bpDiastolic: Number,
    heartRate: Number,
    temperature: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number,
    bmi: Number
  },
  { _id: false }
);

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    recordNumber: {
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
    visitDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    symptoms: {
      type: [String],
      default: []
    },
    diagnosis: {
      type: String,
      required: true
    },
    treatment: {
      type: String,
      required: true
    },
    clinicalNotes: {
      type: String,
      default: ''
    },
    vitalSigns: {
      type: VitalSignsSchema,
      default: {}
    },
    allergies: {
      type: [String],
      default: []
    },
    existingConditions: {
      type: [String],
      default: []
    },
    previousSurgeries: {
      type: [String],
      default: []
    },
    familyHistory: {
      type: [String],
      default: []
    },
    labReports: [
      {
        type: Schema.Types.ObjectId,
        ref: 'LabReport'
      }
    ],
    prescriptions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Prescription'
      }
    ],
    documents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Document'
      }
    ]
  },
  {
    timestamps: true
  }
);

MedicalRecordSchema.index({ patient: 1, visitDate: -1 });

export const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
