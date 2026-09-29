import { Request, Response, NextFunction } from 'express';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { Department } from '../models/Department.js';
import { Invoice } from '../models/Invoice.js';
import { Notification } from '../models/Notification.js';
import { UserRole } from '../constants/roles.js';
import { AppointmentStatus, PaymentStatus } from '../constants/statuses.js';
import { SlotService } from '../services/slotService.js';
import { emailService } from '../services/emailService.js';
import { AuditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class AppointmentController {
  /**
   * Book an appointment
   */
  static async bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        doctorId,
        departmentId,
        appointmentDate,
        appointmentTime,
        type,
        reason,
        symptoms,
        notes,
        patientId: bodyPatientId
      } = req.body;

      // Determine patient ID
      let targetPatientId = req.user?.role === UserRole.PATIENT ? req.user.patientId : bodyPatientId;

      if (!targetPatientId) {
        sendError(res, 'Patient profile is required to book an appointment.', 400);
        return;
      }

      const patient = await Patient.findById(targetPatientId).populate('user', 'email');
      if (!patient) {
        sendError(res, 'Patient record not found', 404);
        return;
      }

      const doctor = await Doctor.findById(doctorId).populate('user', 'email');
      if (!doctor) {
        sendError(res, 'Doctor not found', 404);
        return;
      }

      const parsedDate = new Date(appointmentDate);
      if (isNaN(parsedDate.getTime())) {
        sendError(res, 'Invalid appointment date format', 400);
        return;
      }

      // Check slot availability and prevent double booking
      const isAvailable = await SlotService.isSlotAvailable(doctorId, parsedDate, appointmentTime);
      if (!isAvailable) {
        sendError(res, 'Selected time slot is already fully booked. Please choose another time slot.', 409);
        return;
      }

      // Generate unique appointment number
      const count = await Appointment.countDocuments();
      const appointmentNumber = `APT-${Date.now().toString().slice(-4)}${count + 1}`;

      const appointment = await Appointment.create({
        appointmentNumber,
        patient: targetPatientId,
        doctor: doctorId,
        department: departmentId,
        appointmentDate: parsedDate,
        appointmentTime,
        type,
        reason,
        symptoms: symptoms || [],
        notes: notes || '',
        status: AppointmentStatus.CONFIRMED, // Auto-confirm standard bookings
        paymentStatus: PaymentStatus.PENDING,
        consultationFee: doctor.consultationFee
      });

      // Automatically generate a Consultation Invoice
      const invoiceNumber = `INV-${Date.now().toString().slice(-5)}`;
      await Invoice.create({
        invoiceNumber,
        patient: targetPatientId,
        appointment: appointment._id,
        items: [
          {
            description: `Consultation Fee - Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization})`,
            category: 'Consultation',
            quantity: 1,
            unitPrice: doctor.consultationFee,
            amount: doctor.consultationFee
          }
        ],
        subtotal: doctor.consultationFee,
        discount: 0,
        tax: doctor.consultationFee * 0.05,
        totalAmount: doctor.consultationFee * 1.05,
        amountPaid: 0,
        paymentStatus: PaymentStatus.PENDING,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      });

      // Send In-app Notifications
      await Notification.create([
        {
          recipient: (patient.user as any)._id,
          title: 'Appointment Scheduled',
          message: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} is scheduled on ${parsedDate.toDateString()} at ${appointmentTime}.`,
          type: 'APPOINTMENT',
          link: `/dashboard/patient/appointments`
        },
        {
          recipient: (doctor.user as any)._id,
          title: 'New Patient Appointment',
          message: `New appointment booked by ${patient.firstName} ${patient.lastName} on ${parsedDate.toDateString()} at ${appointmentTime}.`,
          type: 'APPOINTMENT',
          link: `/dashboard/doctor/appointments`
        }
      ]);

      // Department info for email
      const dept = await Department.findById(departmentId);

      // Async email confirmation
      emailService.sendAppointmentConfirmation((patient.user as any).email, {
        appointmentNumber,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        departmentName: dept?.name || 'General Clinic',
        appointmentDate: parsedDate,
        appointmentTime
      }).catch(() => {});

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'APPOINTMENT_BOOKED',
        module: 'APPOINTMENTS',
        resourceId: appointment._id.toString(),
        details: { appointmentNumber, doctorId, appointmentDate, appointmentTime }
      });

      sendSuccess(res, 'Appointment booked successfully', appointment, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List appointments with role-based filtering, status filtering, and pagination
   */
  static async getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const status = req.query.status as string;
      const date = req.query.date as string;
      const search = (req.query.search as string || '').trim();

      const query: any = {};

      // Role isolation
      if (req.user?.role === UserRole.PATIENT) {
        query.patient = req.user.patientId;
      } else if (req.user?.role === UserRole.DOCTOR) {
        query.doctor = req.user.doctorId;
      } else {
        // Admin / Staff can filter by specific doctor or patient
        if (req.query.doctorId) query.doctor = req.query.doctorId;
        if (req.query.patientId) query.patient = req.query.patientId;
      }

      if (status && status !== 'All') {
        query.status = status;
      }

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
      }

      const total = await Appointment.countDocuments(query);
      const appointments = await Appointment.find(query)
        .populate('patient', 'firstName lastName patientId phone bloodGroup emergencyContact')
        .populate('doctor', 'firstName lastName specialization consultationFee roomNumber')
        .populate('department', 'name code')
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Appointments retrieved', appointments, 200, {
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
   * Get appointment by ID
   */
  static async getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id)
        .populate('patient', 'firstName lastName patientId phone bloodGroup dateOfBirth address')
        .populate('doctor', 'firstName lastName specialization consultationFee roomNumber')
        .populate('department', 'name code');

      if (!appointment) {
        sendError(res, 'Appointment not found', 404);
        return;
      }

      // Authorization verification
      if (req.user?.role === UserRole.PATIENT && appointment.patient._id.toString() !== req.user.patientId) {
        sendError(res, 'Access denied to this appointment', 403);
        return;
      }

      sendSuccess(res, 'Appointment details retrieved', appointment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update appointment status (Doctor / Admin)
   */
  static async updateAppointmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, cancellationReason } = req.body;

      const appointment = await Appointment.findById(id).populate('patient').populate('doctor');
      if (!appointment) {
        sendError(res, 'Appointment not found', 404);
        return;
      }

      appointment.status = status;
      if (cancellationReason) {
        appointment.cancellationReason = cancellationReason;
      }
      await appointment.save();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: `APPOINTMENT_STATUS_${status.toUpperCase()}`,
        module: 'APPOINTMENTS',
        resourceId: id,
        details: { status, cancellationReason }
      });

      sendSuccess(res, `Appointment marked as ${status}`, appointment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reschedule appointment
   */
  static async rescheduleAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { appointmentDate, appointmentTime } = req.body;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        sendError(res, 'Appointment not found', 404);
        return;
      }

      const parsedDate = new Date(appointmentDate);
      const isAvailable = await SlotService.isSlotAvailable(appointment.doctor.toString(), parsedDate, appointmentTime);
      if (!isAvailable) {
        sendError(res, 'Selected reschedule slot is unavailable. Please select another slot.', 409);
        return;
      }

      appointment.appointmentDate = parsedDate;
      appointment.appointmentTime = appointmentTime;
      appointment.status = AppointmentStatus.RESCHEDULED;
      await appointment.save();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'APPOINTMENT_RESCHEDULED',
        module: 'APPOINTMENTS',
        resourceId: id
      });

      sendSuccess(res, 'Appointment rescheduled successfully', appointment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctor available time slots for booking
   */
  static async getDoctorSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const dateStr = req.query.date as string || new Date().toISOString();
      const targetDate = new Date(dateStr);

      const result = await SlotService.getAvailableSlots(doctorId, targetDate);
      sendSuccess(res, 'Slots retrieved', result);
    } catch (error: any) {
      sendError(res, error.message || 'Error generating slots', 400);
    }
  }
}
