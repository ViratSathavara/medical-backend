import { Request, Response, NextFunction } from 'express';
import { Admission } from '../models/Admission.js';
import { Discharge } from '../models/Discharge.js';
import { Bed } from '../models/Bed.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { AdmissionStatus, BedStatus } from '../constants/statuses.js';
import { PdfService } from '../services/pdfService.js';
import { AuditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class AdmissionDischargeController {
  /**
   * Admit patient into hospital bed
   */
  static async admitPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        patientId,
        doctorId,
        departmentId,
        roomId,
        bedId,
        admissionReason,
        initialDiagnosis,
        emergencyContact,
        notes
      } = req.body;

      // Verify bed availability
      const bed = await Bed.findById(bedId);
      if (!bed) {
        sendError(res, 'Bed not found', 404);
        return;
      }

      if (bed.status !== BedStatus.AVAILABLE) {
        sendError(res, 'Selected bed is not available for admission', 409);
        return;
      }

      const count = await Admission.countDocuments();
      const admissionNumber = `ADM-${Date.now().toString().slice(-4)}${count + 1}`;

      const admission = await Admission.create({
        admissionNumber,
        patient: patientId,
        doctor: doctorId,
        department: departmentId,
        room: roomId,
        bed: bedId,
        admissionDate: new Date(),
        admissionReason,
        initialDiagnosis,
        emergencyContact: emergencyContact || { name: '', relation: '', phone: '' },
        notes: notes || '',
        status: AdmissionStatus.ADMITTED
      });

      // Update bed status to Occupied
      bed.status = BedStatus.OCCUPIED;
      bed.currentPatient = patientId;
      bed.currentAdmission = admission._id;
      await bed.save();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'PATIENT_ADMITTED',
        module: 'INPATIENT',
        resourceId: admission._id.toString()
      });

      sendSuccess(res, 'Patient admitted successfully', admission, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List inpatient admissions
   */
  static async getAdmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string;
      const query: any = {};
      if (status && status !== 'All') query.status = status;

      const admissions = await Admission.find(query)
        .populate('patient', 'firstName lastName patientId phone bloodGroup')
        .populate('doctor', 'firstName lastName specialization')
        .populate('department', 'name code')
        .populate('room', 'roomNumber roomType floor')
        .populate('bed', 'bedNumber bedType')
        .populate('dischargeSummary')
        .sort({ admissionDate: -1 });

      sendSuccess(res, 'Admissions retrieved', admissions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Discharge patient and generate discharge summary PDF
   */
  static async dischargePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // Admission ID
      const {
        finalDiagnosis,
        treatmentSummary,
        dischargeInstructions,
        prescribedMedicines,
        followUpDate,
        doctorNotes
      } = req.body;

      const admission = await Admission.findById(id)
        .populate('patient')
        .populate('doctor');

      if (!admission) {
        sendError(res, 'Admission not found', 404);
        return;
      }

      const patient = admission.patient as any;
      const doctor = admission.doctor as any;

      const count = await Discharge.countDocuments();
      const dischargeNumber = `DIS-${Date.now().toString().slice(-4)}${count + 1}`;

      // Generate Discharge PDF
      const pdfUrl = await PdfService.generateDischargePdf({
        dischargeNumber,
        dischargeDate: new Date(),
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientId: patient.patientId,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        finalDiagnosis,
        treatmentSummary,
        dischargeInstructions,
        prescribedMedicines: prescribedMedicines || []
      });

      const discharge = await Discharge.create({
        dischargeNumber,
        admission: admission._id,
        patient: patient._id,
        doctor: doctor._id,
        dischargeDate: new Date(),
        finalDiagnosis,
        treatmentSummary,
        dischargeInstructions,
        prescribedMedicines: prescribedMedicines || [],
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        doctorNotes,
        pdfUrl
      });

      // Free bed
      await Bed.findByIdAndUpdate(admission.bed, {
        status: BedStatus.AVAILABLE,
        currentPatient: undefined,
        currentAdmission: undefined
      });

      // Update admission status
      admission.status = AdmissionStatus.DISCHARGED;
      admission.dischargeDate = new Date();
      admission.dischargeSummary = discharge._id;
      await admission.save();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'PATIENT_DISCHARGED',
        module: 'INPATIENT',
        resourceId: discharge._id.toString()
      });

      sendSuccess(res, 'Patient discharged and discharge summary created', discharge);
    } catch (error) {
      next(error);
    }
  }
}
