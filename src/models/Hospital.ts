import mongoose, { Schema, Document } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  tagline: string;
  logo: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  email: string;
  emergencyNumber: string;
  website: string;
  about: string;
  facilities: string[];
  workingHours: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new Schema<IHospital>(
  {
    name: {
      type: String,
      required: true,
      default: 'MedPulse General & Super Speciality Hospital'
    },
    tagline: {
      type: String,
      default: 'Excellence in Healthcare, Compassion in Healing'
    },
    logo: {
      type: String,
      default: '/logo.png'
    },
    address: {
      street: { type: String, default: '742 Evergreen Medical Park' },
      city: { type: String, default: 'New York' },
      state: { type: String, default: 'NY' },
      postalCode: { type: String, default: '10001' },
      country: { type: String, default: 'USA' }
    },
    phone: {
      type: String,
      default: '+1 (555) 234-5678'
    },
    email: {
      type: String,
      default: 'contact@medpulsehospital.com'
    },
    emergencyNumber: {
      type: String,
      default: '+1 (555) 911-0000'
    },
    website: {
      type: String,
      default: 'https://medpulsehospital.com'
    },
    about: {
      type: String,
      default: 'MedPulse is a leading multi-speciality tertiary care hospital delivering world-class medical treatment with cutting-edge medical technology and patient-centric clinical teams.'
    },
    facilities: {
      type: [String],
      default: [
        '24/7 Level 1 Trauma & Emergency Unit',
        'State-of-the-Art Robotic Surgical Suites',
        'Full Diagnostics & 3T MRI, 128-Slice CT',
        'Digital Pharmacy & Drive-Through Dispensing',
        'Advanced Intensive Care Unit (ICU & NICU)',
        'Cardiovascular Cath Lab',
        'Comprehensive Cancer Treatment Center'
      ]
    },
    workingHours: {
      type: String,
      default: '24 Hours Emergency | OPD: Mon - Sat 08:00 AM - 08:00 PM'
    },
    socialLinks: {
      facebook: String,
      twitter: String,
      linkedin: String,
      instagram: String
    }
  },
  {
    timestamps: true
  }
);

export const Hospital = mongoose.model<IHospital>('Hospital', HospitalSchema);
