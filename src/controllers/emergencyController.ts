import { Request, Response, NextFunction } from 'express';
import { EmergencyCase } from '../models/EmergencyCase.js';
import { Bed } from '../models/Bed.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuditService } from '../services/auditService.js';

export class EmergencyController {
  static async getCases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string;
      const query: any = {};
      if (status && status !== 'All') query.status = status;

      const cases = await EmergencyCase.find(query)
        .populate('attendingDoctor', 'firstName lastName specialization')
        .populate('department', 'name')
        .populate('patient', 'firstName lastName patientId')
        .populate('admittedBed', 'bedNumber')
        .sort({
          // Sort by priority (Critical first) and arrival time
          priority: 1,
          arrivalTime: -1
        });

      sendSuccess(res, 'Emergency cases retrieved', cases);
    } catch (error) {
      next(error);
    }
  }

  static async createCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await EmergencyCase.countDocuments();
      const caseNumber = `EMG-${Date.now().toString().slice(-4)}${count + 1}`;

      const emergencyCase = await EmergencyCase.create({
        ...req.body,
        caseNumber,
        arrivalTime: new Date()
      });

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'EMERGENCY_CASE_LOGGED',
        module: 'EMERGENCY',
        resourceId: emergencyCase._id.toString()
      });

      sendSuccess(res, 'Emergency case logged', emergencyCase, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, initialDiagnosis, triageNotes, attendingDoctorId, admittedBedId } = req.body;

      const emergencyCase = await EmergencyCase.findById(id);
      if (!emergencyCase) {
        sendError(res, 'Emergency case not found', 404);
        return;
      }

      if (status) emergencyCase.status = status;
      if (initialDiagnosis) emergencyCase.initialDiagnosis = initialDiagnosis;
      if (triageNotes) emergencyCase.triageNotes = triageNotes;
      if (attendingDoctorId) emergencyCase.attendingDoctor = attendingDoctorId;
      if (admittedBedId) emergencyCase.admittedBed = admittedBedId;
      if (status === 'Discharged') emergencyCase.dischargeTime = new Date();

      await emergencyCase.save();

      sendSuccess(res, 'Emergency case updated', emergencyCase);
    } catch (error) {
      next(error);
    }
  }
}
