import { Request, Response, NextFunction } from 'express';
import { Prescription } from '../models/Prescription.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { Notification } from '../models/Notification.js';
import { UserRole } from '../constants/roles.js';
import { PdfService } from '../services/pdfService.js';
import { AuditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class PrescriptionController {
  /**
   * Create a new prescription
   */
  static async createPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, appointmentId, diagnosis, medicines, notes } = req.body;
      const doctorId = req.user?.doctorId;

      if (!doctorId && req.user?.role !== UserRole.ADMIN) {
        sendError(res, 'Only doctors can write medical prescriptions.', 403);
        return;
      }

      const [patient, doctor] = await Promise.all([
        Patient.findById(patientId).populate('user', 'email'),
        Doctor.findById(doctorId || req.body.doctorId).populate('department', 'name')
      ]);

      if (!patient || !doctor) {
        sendError(res, 'Patient or Doctor record not found', 404);
        return;
      }

      const count = await Prescription.countDocuments();
      const prescriptionNumber = `RX-${Date.now().toString().slice(-4)}${count + 1}`;

      // Calculate approximate age
      const birthYear = patient.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : 1990;
      const patientAge = new Date().getFullYear() - birthYear;

      // Generate PDF
      const pdfUrl = await PdfService.generatePrescriptionPdf({
        prescriptionNumber,
        issueDate: new Date(),
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        doctorSpecialization: doctor.specialization,
        departmentName: (doctor.department as any)?.name || 'Outpatient Clinic',
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientId: patient.patientId,
        patientAge,
        patientGender: patient.gender,
        diagnosis,
        medicines,
        notes
      });

      const prescription = await Prescription.create({
        prescriptionNumber,
        patient: patientId,
        doctor: doctor._id,
        appointment: appointmentId,
        diagnosis,
        medicines,
        notes: notes || '',
        issueDate: new Date(),
        pdfUrl
      });

      // Link to active medical record if available
      await MedicalRecord.findOneAndUpdate(
        { patient: patientId, doctor: doctor._id },
        { $push: { prescriptions: prescription._id } },
        { sort: { createdAt: -1 } }
      );

      // In-app Notification to patient
      await Notification.create({
        recipient: (patient.user as any)._id,
        title: 'New Prescription Issued',
        message: `Dr. ${doctor.firstName} ${doctor.lastName} has prescribed medications for your visit.`,
        type: 'PRESCRIPTION',
        link: `/dashboard/patient/prescriptions`
      });

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'PRESCRIPTION_CREATED',
        module: 'PRESCRIPTIONS',
        resourceId: prescription._id.toString()
      });

      sendSuccess(res, 'Prescription issued successfully', prescription, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List prescriptions (Patient sees only own prescriptions)
   */
  static async getPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const query: any = {};

      if (req.user?.role === UserRole.PATIENT) {
        query.patient = req.user.patientId;
      } else {
        if (req.query.patientId) query.patient = req.query.patientId;
        if (req.query.doctorId) query.doctor = req.query.doctorId;
      }

      const total = await Prescription.countDocuments(query);
      const prescriptions = await Prescription.find(query)
        .populate('patient', 'firstName lastName patientId phone bloodGroup')
        .populate('doctor', 'firstName lastName specialization')
        .sort({ issueDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Prescriptions retrieved', prescriptions, 200, {
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
   * Get prescription by ID
   */
  static async getPrescriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const prescription = await Prescription.findById(id)
        .populate('patient', 'firstName lastName patientId dateOfBirth gender phone')
        .populate('doctor', 'firstName lastName specialization consultationFee');

      if (!prescription) {
        sendError(res, 'Prescription not found', 404);
        return;
      }

      if (req.user?.role === UserRole.PATIENT && prescription.patient._id.toString() !== req.user.patientId) {
        sendError(res, 'Access denied to this prescription', 403);
        return;
      }

      sendSuccess(res, 'Prescription retrieved', prescription);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark prescription medicines as dispensed
   */
  static async dispensePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const prescription = await Prescription.findByIdAndUpdate(
        id,
        { dispensed: true, dispensedAt: new Date() },
        { new: true }
      );

      if (!prescription) {
        sendError(res, 'Prescription not found', 404);
        return;
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'PRESCRIPTION_DISPENSED',
        module: 'PHARMACY',
        resourceId: id
      });

      sendSuccess(res, 'Prescription marked as dispensed', prescription);
    } catch (error) {
      next(error);
    }
  }
}
