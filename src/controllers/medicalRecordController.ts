import { Request, Response, NextFunction } from 'express';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { UserRole } from '../constants/roles.js';
import { AppointmentStatus } from '../constants/statuses.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuditService } from '../services/auditService.js';

export class MedicalRecordController {
  /**
   * Create medical record (Doctors only)
   */
  static async createRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        patientId,
        appointmentId,
        visitDate,
        symptoms,
        diagnosis,
        treatment,
        clinicalNotes,
        vitalSigns,
        allergies,
        existingConditions
      } = req.body;

      const doctorId = req.user?.doctorId;
      if (!doctorId && req.user?.role !== UserRole.ADMIN) {
        sendError(res, 'Only doctors can create clinical medical records.', 403);
        return;
      }

      const patient = await Patient.findById(patientId);
      if (!patient) {
        sendError(res, 'Patient not found', 404);
        return;
      }

      // Calculate BMI if height and weight are provided
      const vitals = { ...vitalSigns };
      if (vitals.weight && vitals.height && vitals.height > 0) {
        const heightMeters = vitals.height / 100;
        vitals.bmi = parseFloat((vitals.weight / (heightMeters * heightMeters)).toFixed(1));
      }

      const count = await MedicalRecord.countDocuments();
      const recordNumber = `EMR-${Date.now().toString().slice(-4)}${count + 1}`;

      const record = await MedicalRecord.create({
        recordNumber,
        patient: patientId,
        doctor: doctorId || req.body.doctorId,
        appointment: appointmentId,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        symptoms: symptoms || [],
        diagnosis,
        treatment,
        clinicalNotes: clinicalNotes || '',
        vitalSigns: vitals,
        allergies: allergies || patient.allergies,
        existingConditions: existingConditions || patient.existingConditions
      });

      // Update patient profile allergies/conditions if provided
      if (allergies && allergies.length > 0) {
        patient.allergies = Array.from(new Set([...patient.allergies, ...allergies]));
        await patient.save();
      }

      // If associated with appointment, mark appointment completed
      if (appointmentId) {
        await Appointment.findByIdAndUpdate(appointmentId, {
          status: AppointmentStatus.COMPLETED
        });
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'MEDICAL_RECORD_CREATED',
        module: 'MEDICAL_RECORDS',
        resourceId: record._id.toString()
      });

      sendSuccess(res, 'Medical record created successfully', record, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get medical records (role-filtered: Patient sees only their records)
   */
  static async getRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const total = await MedicalRecord.countDocuments(query);
      const records = await MedicalRecord.find(query)
        .populate('patient', 'firstName lastName patientId bloodGroup dateOfBirth gender')
        .populate('doctor', 'firstName lastName specialization')
        .populate('prescriptions')
        .populate('labReports')
        .sort({ visitDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Medical records retrieved', records, 200, {
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
   * Get medical record by ID
   */
  static async getRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const record = await MedicalRecord.findById(id)
        .populate('patient', 'firstName lastName patientId bloodGroup dateOfBirth gender phone emergencyContact')
        .populate('doctor', 'firstName lastName specialization consultationFee')
        .populate('prescriptions')
        .populate('labReports');

      if (!record) {
        sendError(res, 'Medical record not found', 404);
        return;
      }

      if (req.user?.role === UserRole.PATIENT && record.patient._id.toString() !== req.user.patientId) {
        sendError(res, 'Access denied to this medical record', 403);
        return;
      }

      sendSuccess(res, 'Medical record retrieved', record);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update medical record
   */
  static async updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const record = await MedicalRecord.findById(id);

      if (!record) {
        sendError(res, 'Medical record not found', 404);
        return;
      }

      // Only the authoring doctor or admin can edit
      if (req.user?.role === UserRole.DOCTOR && record.doctor.toString() !== req.user.doctorId) {
        sendError(res, 'You can only edit medical records you authored', 403);
        return;
      }

      const updated = await MedicalRecord.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'MEDICAL_RECORD_UPDATED',
        module: 'MEDICAL_RECORDS',
        resourceId: id
      });

      sendSuccess(res, 'Medical record updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }
}
