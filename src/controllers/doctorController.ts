import { Request, Response, NextFunction } from 'express';
import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { Prescription } from '../models/Prescription.js';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { UserRole } from '../constants/roles.js';
import { AppointmentStatus, DoctorStatus } from '../constants/statuses.js';
import { AuditService } from '../services/auditService.js';

export class DoctorController {
  /**
   * List doctors with filtering, search, and department
   */
  static async getDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 12;
      const search = (req.query.search as string || '').trim();
      const department = req.query.department as string;
      const status = req.query.status as string;

      const query: any = {};

      // Public / patient users only see approved doctors
      if (req.user?.role !== UserRole.ADMIN) {
        query.status = DoctorStatus.APPROVED;
      } else if (status) {
        query.status = status;
      }

      if (department) {
        query.department = department;
      }

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { specialization: { $regex: search, $options: 'i' } },
          { doctorId: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await Doctor.countDocuments(query);
      const doctors = await Doctor.find(query)
        .populate('department', 'name code icon')
        .populate('user', 'email isActive profilePicture')
        .sort({ rating: -1, experienceYears: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Doctors retrieved successfully', doctors, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single doctor by ID
   */
  static async getDoctorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const doctor = await Doctor.findById(id)
        .populate('department', 'name code description icon')
        .populate('user', 'email isActive profilePicture');

      if (!doctor) {
        sendError(res, 'Doctor not found', 404);
        return;
      }

      sendSuccess(res, 'Doctor details retrieved', doctor);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current doctor's profile
   */
  static async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.doctorId) {
        sendError(res, 'Doctor profile not associated with this account', 404);
        return;
      }

      const doctor = await Doctor.findById(req.user.doctorId)
        .populate('department', 'name code icon')
        .populate('user', 'email profilePicture');

      if (!doctor) {
        sendError(res, 'Doctor profile not found', 404);
        return;
      }

      sendSuccess(res, 'Doctor profile retrieved', doctor);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update doctor profile or schedule
   */
  static async updateDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (req.user?.role === UserRole.DOCTOR && req.user.doctorId !== id) {
        sendError(res, 'Access denied. You can only update your own doctor profile.', 403);
        return;
      }

      // Only admin can change doctor status
      if (req.body.status && req.user?.role !== UserRole.ADMIN) {
        delete req.body.status;
      }

      const updated = await Doctor.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      }).populate('department', 'name code');

      if (!updated) {
        sendError(res, 'Doctor not found', 404);
        return;
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'DOCTOR_UPDATED',
        module: 'DOCTORS',
        resourceId: id
      });

      sendSuccess(res, 'Doctor profile updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Doctor Dashboard Summary: today's schedule, counts, metrics
   */
  static async getDoctorDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.role === UserRole.DOCTOR ? req.user.doctorId : req.params.doctorId;

      if (!doctorId) {
        sendError(res, 'Doctor ID required', 400);
        return;
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const [
        doctor,
        todayAppointments,
        upcomingAppointments,
        pendingCount,
        completedCount,
        totalAppointmentsCount,
        recentMedicalRecords,
        recentPrescriptions,
        unreadNotificationsCount
      ] = await Promise.all([
        Doctor.findById(doctorId).populate('department', 'name'),
        Appointment.find({
          doctor: doctorId,
          appointmentDate: { $gte: startOfToday, $lte: endOfToday }
        })
          .populate('patient', 'firstName lastName patientId phone bloodGroup')
          .sort({ appointmentTime: 1 }),
        Appointment.find({
          doctor: doctorId,
          appointmentDate: { $gt: endOfToday },
          status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] }
        })
          .populate('patient', 'firstName lastName patientId')
          .sort({ appointmentDate: 1 })
          .limit(5),
        Appointment.countDocuments({
          doctor: doctorId,
          status: AppointmentStatus.PENDING
        }),
        Appointment.countDocuments({
          doctor: doctorId,
          status: AppointmentStatus.COMPLETED
        }),
        Appointment.countDocuments({
          doctor: doctorId
        }),
        MedicalRecord.find({ doctor: doctorId })
          .populate('patient', 'firstName lastName patientId')
          .sort({ visitDate: -1 })
          .limit(5),
        Prescription.find({ doctor: doctorId })
          .populate('patient', 'firstName lastName patientId')
          .sort({ issueDate: -1 })
          .limit(5),
        Notification.countDocuments({ recipient: req.user?.userId, read: false })
      ]);

      // Unique patients treated
      const distinctPatients = await Appointment.distinct('patient', { doctor: doctorId });

      sendSuccess(res, 'Doctor summary loaded', {
        doctor,
        todayAppointments,
        upcomingAppointments,
        metrics: {
          todayCount: todayAppointments.length,
          pendingCount,
          completedCount,
          totalAppointmentsCount,
          totalPatientsCount: distinctPatients.length
        },
        recentMedicalRecords,
        recentPrescriptions,
        unreadNotificationsCount
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unique patients treated or scheduled by this doctor
   */
  static async getDoctorPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.user?.role === UserRole.DOCTOR ? req.user.doctorId : req.params.doctorId;
      if (!doctorId) {
        sendError(res, 'Doctor ID required', 400);
        return;
      }

      const patientIds = await Appointment.distinct('patient', { doctor: doctorId });
      const { Patient } = await import('../models/Patient.js');
      const patients = await Patient.find({ _id: { $in: patientIds } })
        .populate('user', 'email profilePicture');

      sendSuccess(res, 'Doctor patients retrieved', patients);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin approves or rejects a doctor account
   */
  static async approveDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body; // e.g. "Approved" or "Rejected"

      const doctor = await Doctor.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!doctor) {
        sendError(res, 'Doctor not found', 404);
        return;
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: `DOCTOR_STATUS_${status.toUpperCase()}`,
        module: 'DOCTORS',
        resourceId: id
      });

      sendSuccess(res, `Doctor status updated to ${status}`, doctor);
    } catch (error) {
      next(error);
    }
  }
}
