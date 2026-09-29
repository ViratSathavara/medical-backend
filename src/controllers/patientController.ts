import { Request, Response, NextFunction } from 'express';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { Prescription } from '../models/Prescription.js';
import { Invoice } from '../models/Invoice.js';
import { LabReport } from '../models/LabReport.js';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { UserRole } from '../constants/roles.js';
import { AuditService } from '../services/auditService.js';

export class PatientController {
  /**
   * List all patients (Admin, Doctors, Staff) with search and pagination
   */
  static async getPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = (req.query.search as string || '').trim();
      const bloodGroup = req.query.bloodGroup as string;
      const gender = req.query.gender as string;

      const query: any = {};

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      if (bloodGroup) {
        query.bloodGroup = bloodGroup;
      }

      if (gender) {
        query.gender = gender;
      }

      const total = await Patient.countDocuments(query);
      const patients = await Patient.find(query)
        .populate('user', 'email isActive profilePicture')
        .populate('assignedDoctor', 'firstName lastName specialization')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Patients retrieved successfully', patients, 200, {
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
   * Get single patient by ID (Admin, Doctor, or the Patient themselves)
   */
  static async getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Access control check: patients can only access their own profile
      if (req.user?.role === UserRole.PATIENT && req.user.patientId !== id) {
        sendError(res, 'Access denied. You can only view your own patient profile.', 403);
        return;
      }

      const patient = await Patient.findById(id)
        .populate('user', 'email isActive profilePicture phone')
        .populate('assignedDoctor', 'firstName lastName specialization consultationFee');

      if (!patient) {
        sendError(res, 'Patient not found', 404);
        return;
      }

      sendSuccess(res, 'Patient profile retrieved', patient);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get logged-in patient's own profile and summary
   */
  static async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.patientId) {
        sendError(res, 'Patient profile not associated with this account', 404);
        return;
      }

      const patient = await Patient.findById(req.user.patientId)
        .populate('user', 'email profilePicture')
        .populate('assignedDoctor', 'firstName lastName specialization consultationFee roomNumber');

      if (!patient) {
        sendError(res, 'Patient profile not found', 404);
        return;
      }

      sendSuccess(res, 'Patient profile retrieved', patient);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update patient profile
   */
  static async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (req.user?.role === UserRole.PATIENT && req.user.patientId !== id) {
        sendError(res, 'Access denied. You can only update your own patient record.', 403);
        return;
      }

      const updated = await Patient.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });

      if (!updated) {
        sendError(res, 'Patient not found', 404);
        return;
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'PATIENT_UPDATED',
        module: 'PATIENTS',
        resourceId: id
      });

      sendSuccess(res, 'Patient record updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Patient Dashboard Summary (Upcoming appointments, recent prescriptions, invoices, vitals)
   */
  static async getPatientDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.user?.role === UserRole.PATIENT ? req.user.patientId : req.params.patientId;

      if (!patientId) {
        sendError(res, 'Patient ID required', 400);
        return;
      }

      const [
        patient,
        upcomingAppointment,
        recentAppointments,
        recentPrescriptions,
        recentLabReports,
        unpaidInvoices,
        latestMedicalRecord,
        unreadNotificationsCount
      ] = await Promise.all([
        Patient.findById(patientId).populate('assignedDoctor', 'firstName lastName specialization'),
        Appointment.findOne({
          patient: patientId,
          appointmentDate: { $gte: new Date() },
          status: { $in: ['Pending', 'Confirmed'] }
        })
          .populate('doctor', 'firstName lastName specialization')
          .populate('department', 'name')
          .sort({ appointmentDate: 1 }),
        Appointment.find({ patient: patientId })
          .populate('doctor', 'firstName lastName specialization')
          .populate('department', 'name')
          .sort({ appointmentDate: -1 })
          .limit(5),
        Prescription.find({ patient: patientId })
          .populate('doctor', 'firstName lastName')
          .sort({ issueDate: -1 })
          .limit(5),
        LabReport.find({ patient: patientId })
          .populate('doctor', 'firstName lastName')
          .sort({ completedAt: -1 })
          .limit(5),
        Invoice.find({ patient: patientId, paymentStatus: { $in: ['Pending', 'Partially Paid'] } })
          .sort({ createdAt: -1 }),
        MedicalRecord.findOne({ patient: patientId })
          .populate('doctor', 'firstName lastName')
          .sort({ visitDate: -1 }),
        Notification.countDocuments({ recipient: req.user?.userId, read: false })
      ]);

      const pendingAmount = unpaidInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.amountPaid), 0);

      sendSuccess(res, 'Patient summary loaded', {
        patient,
        upcomingAppointment,
        recentAppointments,
        recentPrescriptions,
        recentLabReports,
        unpaidInvoicesCount: unpaidInvoices.length,
        pendingAmount,
        latestVitals: latestMedicalRecord?.vitalSigns,
        unreadNotificationsCount
      });
    } catch (error) {
      next(error);
    }
  }
}
