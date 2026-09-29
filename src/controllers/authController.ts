import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { Admin } from '../models/Admin.js';
import { Staff } from '../models/Staff.js';
import { Department } from '../models/Department.js';
import { UserRole } from '../constants/roles.js';
import { DoctorStatus } from '../constants/statuses.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { emailService } from '../services/emailService.js';
import { AuditService } from '../services/auditService.js';

export class AuthController {
  /**
   * Register a new user (Patient or Doctor application)
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        email,
        password,
        role = UserRole.PATIENT,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender = 'Other',
        specialization,
        departmentId,
        consultationFee = 50
      } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        sendError(res, 'An account with this email address already exists.', 409);
        return;
      }

      // Create base user
      const user = new User({
        email: email.toLowerCase(),
        password,
        role,
        phone,
        isActive: true,
        isVerified: true
      });

      await user.save();

      // Profile creation based on role
      let profileId: any = null;

      if (role === UserRole.PATIENT) {
        const count = await Patient.countDocuments();
        const patientId = `PAT-${1000 + count + 1}`;

        const patient = await Patient.create({
          user: user._id,
          patientId,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01'),
          gender,
          phone,
          allergies: [],
          existingConditions: [],
          previousSurgeries: [],
          familyHistory: [],
          emergencyContact: { name: '', relation: '', phone: '' }
        });

        user.patientProfile = patient._id;
        await user.save();
        profileId = patient._id;
      } else if (role === UserRole.DOCTOR) {
        const count = await Doctor.countDocuments();
        const doctorId = `DOC-${2000 + count + 1}`;

        // Ensure default department if none provided
        let deptId = departmentId;
        if (!deptId) {
          const defaultDept = await Department.findOne({ isActive: true });
          deptId = defaultDept ? defaultDept._id : undefined;
        }

        const doctor = await Doctor.create({
          user: user._id,
          doctorId,
          firstName,
          lastName,
          specialization: specialization || 'General Medicine',
          department: deptId,
          qualifications: ['MBBS', 'MD'],
          experienceYears: 5,
          consultationFee: consultationFee || 60,
          phone,
          status: DoctorStatus.APPROVED // auto-approved for simplicity in dev/demo
        });

        user.doctorProfile = doctor._id;
        await user.save();
        profileId = doctor._id;
      } else if (role === UserRole.ADMIN) {
        const adminId = `ADM-${Date.now().toString().slice(-4)}`;
        const admin = await Admin.create({
          user: user._id,
          adminId,
          firstName,
          lastName,
          phone
        });
        user.adminProfile = admin._id;
        await user.save();
        profileId = admin._id;
      }

      // Generate JWT tokens
      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        patientId: user.patientProfile?.toString(),
        doctorId: user.doctorProfile?.toString(),
        adminId: user.adminProfile?.toString(),
        staffId: user.staffProfile?.toString()
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Audit log
      AuditService.log({
        userId: user._id.toString(),
        userEmail: user.email,
        userRole: user.role,
        action: 'USER_REGISTERED',
        module: 'AUTH',
        resourceId: user._id.toString()
      });

      // Send welcome email async
      emailService.sendWelcomeEmail(user.email, `${firstName} ${lastName}`, role).catch(() => {});

      sendSuccess(res, 'Registration successful', {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName,
          lastName,
          patientId: user.patientProfile,
          doctorId: user.doctorProfile,
          profilePicture: user.profilePicture
        },
        accessToken,
        refreshToken
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * User login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+password')
        .populate('patientProfile')
        .populate('doctorProfile')
        .populate('adminProfile')
        .populate('staffProfile');

      if (!user) {
        sendError(res, 'Invalid email or password credentials', 401);
        return;
      }

      if (!user.isActive) {
        sendError(res, 'Your account has been deactivated. Please contact hospital administrator.', 403);
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        sendError(res, 'Invalid email or password credentials', 401);
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Retrieve full names based on role
      let firstName = 'User';
      let lastName = '';
      if (user.patientProfile) {
        firstName = (user.patientProfile as any).firstName;
        lastName = (user.patientProfile as any).lastName;
      } else if (user.doctorProfile) {
        firstName = (user.doctorProfile as any).firstName;
        lastName = (user.doctorProfile as any).lastName;
      } else if (user.adminProfile) {
        firstName = (user.adminProfile as any).firstName;
        lastName = (user.adminProfile as any).lastName;
      } else if (user.staffProfile) {
        firstName = (user.staffProfile as any).firstName;
        lastName = (user.staffProfile as any).lastName;
      }

      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        patientId: user.patientProfile ? (user.patientProfile as any)._id?.toString() : undefined,
        doctorId: user.doctorProfile ? (user.doctorProfile as any)._id?.toString() : undefined,
        adminId: user.adminProfile ? (user.adminProfile as any)._id?.toString() : undefined,
        staffId: user.staffProfile ? (user.staffProfile as any)._id?.toString() : undefined
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Audit Log
      AuditService.log({
        userId: user._id.toString(),
        userEmail: user.email,
        userRole: user.role,
        action: 'USER_LOGIN',
        module: 'AUTH',
        resourceId: user._id.toString()
      });

      sendSuccess(res, 'Login successful', {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName,
          lastName,
          patientId: user.patientProfile ? (user.patientProfile as any)._id : undefined,
          doctorId: user.doctorProfile ? (user.doctorProfile as any)._id : undefined,
          profilePicture: user.profilePicture
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user profile
   */
  static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const user = await User.findById(req.user.userId)
        .populate({
          path: 'patientProfile',
          populate: { path: 'assignedDoctor', select: 'firstName lastName specialization' }
        })
        .populate({
          path: 'doctorProfile',
          populate: { path: 'department', select: 'name code' }
        })
        .populate('adminProfile')
        .populate({
          path: 'staffProfile',
          populate: { path: 'department', select: 'name code' }
        });

      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, 'User profile retrieved', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset token
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Send success to prevent email enumeration
        sendSuccess(res, 'If your email is registered, a password reset link has been dispatched.');
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Send email simulation
      emailService.sendEmail({
        to: user.email,
        subject: 'MedPulse Hospital - Password Reset Request',
        html: `<p>You requested a password reset. Use this token: <strong>${resetToken}</strong></p>`
      }).catch(() => {});

      sendSuccess(res, 'If your email is registered, a password reset link has been dispatched.', {
        demoResetToken: resetToken // provided for testing convenience
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with valid token
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: new Date() }
      });

      if (!user) {
        sendError(res, 'Invalid or expired password reset token', 400);
        return;
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      AuditService.log({
        userId: user._id.toString(),
        userEmail: user.email,
        userRole: user.role,
        action: 'PASSWORD_RESET',
        module: 'AUTH'
      });

      sendSuccess(res, 'Password has been reset successfully. You can now login.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        AuditService.log({
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role,
          action: 'USER_LOGOUT',
          module: 'AUTH'
        });
      }
      sendSuccess(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}
