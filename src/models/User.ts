import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../constants/roles.js';

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  profilePicture?: string;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  patientProfile?: mongoose.Types.ObjectId;
  doctorProfile?: mongoose.Types.ObjectId;
  adminProfile?: mongoose.Types.ObjectId;
  staffProfile?: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PATIENT,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    profilePicture: {
      type: String,
      default: ''
    },
    lastLogin: {
      type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    patientProfile: {
      type: Schema.Types.ObjectId,
      ref: 'Patient'
    },
    doctorProfile: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    adminProfile: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    },
    staffProfile: {
      type: Schema.Types.ObjectId,
      ref: 'Staff'
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
