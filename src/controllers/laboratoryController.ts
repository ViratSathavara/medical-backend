import { Request, Response, NextFunction } from 'express';
import { LabTest } from '../models/LabTest.js';
import { LabRequest } from '../models/LabRequest.js';
import { LabReport } from '../models/LabReport.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { Invoice } from '../models/Invoice.js';
import { Notification } from '../models/Notification.js';
import { UserRole } from '../constants/roles.js';
import { LabRequestStatus, PaymentStatus } from '../constants/statuses.js';
import { PdfService } from '../services/pdfService.js';
import { AuditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class LaboratoryController {
  /**
   * Get catalog of lab tests
   */
  static async getLabTests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string;
      const search = (req.query.search as string || '').trim();

      const query: any = { isActive: true };
      if (category && category !== 'All') query.category = category;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }

      const tests = await LabTest.find(query).sort({ category: 1, name: 1 });
      sendSuccess(res, 'Lab tests catalog retrieved', tests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create lab test in catalog (Admin only)
   */
  static async createLabTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const test = await LabTest.create(req.body);
      sendSuccess(res, 'Lab test added to catalog', test, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Doctor requests lab tests for patient
   */
  static async requestLabTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, testIds, appointmentId, priority, clinicalNotes } = req.body;
      const doctorId = req.user?.doctorId;

      const [patient, doctor, tests] = await Promise.all([
        Patient.findById(patientId),
        Doctor.findById(doctorId || req.body.doctorId),
        LabTest.find({ _id: { $in: testIds } })
      ]);

      if (!patient || !doctor) {
        sendError(res, 'Patient or Doctor not found', 404);
        return;
      }

      const count = await LabRequest.countDocuments();
      const requestNumber = `LR-${Date.now().toString().slice(-4)}${count + 1}`;
      const totalCost = tests.reduce((sum, t) => sum + t.price, 0);

      const labRequest = await LabRequest.create({
        requestNumber,
        patient: patientId,
        doctor: doctor._id,
        appointment: appointmentId,
        tests: testIds,
        priority: priority || 'Routine',
        clinicalNotes: clinicalNotes || '',
        totalCost,
        status: LabRequestStatus.REQUESTED
      });

      // Automatically generate invoice line items for Lab Tests
      if (totalCost > 0) {
        const invCount = await Invoice.countDocuments();
        await Invoice.create({
          invoiceNumber: `INV-${Date.now().toString().slice(-5)}${invCount + 1}`,
          patient: patientId,
          appointment: appointmentId,
          items: tests.map((t) => ({
            description: `Lab Test: ${t.name} (${t.code})`,
            category: 'Laboratory',
            quantity: 1,
            unitPrice: t.price,
            amount: t.price
          })),
          subtotal: totalCost,
          discount: 0,
          tax: totalCost * 0.05,
          totalAmount: totalCost * 1.05,
          amountPaid: 0,
          paymentStatus: PaymentStatus.PENDING
        });
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'LAB_TEST_REQUESTED',
        module: 'LABORATORY',
        resourceId: labRequest._id.toString()
      });

      sendSuccess(res, 'Lab test request created successfully', labRequest, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of lab test requests
   */
  static async getLabRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const status = req.query.status as string;

      const query: any = {};
      if (req.user?.role === UserRole.PATIENT) {
        query.patient = req.user.patientId;
      } else {
        if (req.query.patientId) query.patient = req.query.patientId;
        if (req.query.doctorId) query.doctor = req.query.doctorId;
      }

      if (status && status !== 'All') {
        query.status = status;
      }

      const total = await LabRequest.countDocuments(query);
      const requests = await LabRequest.find(query)
        .populate('patient', 'firstName lastName patientId phone bloodGroup')
        .populate('doctor', 'firstName lastName specialization')
        .populate('tests', 'name code category price sampleType')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Lab requests retrieved', requests, 200, {
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
   * Enter test results and generate diagnostic report
   */
  static async enterResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // LabRequest ID
      const { results, technicianNotes } = req.body;

      const labRequest = await LabRequest.findById(id)
        .populate('patient')
        .populate('doctor')
        .populate('tests');

      if (!labRequest) {
        sendError(res, 'Lab request not found', 404);
        return;
      }

      const patient = labRequest.patient as any;
      const doctor = labRequest.doctor as any;

      const count = await LabReport.countDocuments();
      const reportNumber = `REP-${Date.now().toString().slice(-4)}${count + 1}`;

      // Generate PDF
      const pdfUrl = await PdfService.generateLabReportPdf({
        reportNumber,
        completedAt: new Date(),
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientId: patient.patientId,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        sampleType: (labRequest.tests as any[])[0]?.sampleType || 'Blood',
        results,
        technicianNotes
      });

      const report = await LabReport.create({
        reportNumber,
        labRequest: labRequest._id,
        patient: patient._id,
        doctor: doctor._id,
        results,
        technicianNotes,
        conductedBy: req.user?.userId,
        approvedBy: req.user?.userId,
        pdfUrl,
        status: 'Final',
        completedAt: new Date()
      });

      // Update request status
      labRequest.status = LabRequestStatus.COMPLETED;
      await labRequest.save();

      // Notify patient
      await Notification.create({
        recipient: patient.user,
        title: 'Diagnostic Test Results Ready',
        message: `Your lab report ${reportNumber} is now ready to view and download.`,
        type: 'LAB_REPORT',
        link: `/dashboard/patient/lab-reports`
      });

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'LAB_RESULTS_ENTERED',
        module: 'LABORATORY',
        resourceId: report._id.toString()
      });

      sendSuccess(res, 'Lab results recorded and report generated', report, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get finalized lab reports
   */
  static async getLabReports(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const total = await LabReport.countDocuments(query);
      const reports = await LabReport.find(query)
        .populate('patient', 'firstName lastName patientId phone bloodGroup')
        .populate('doctor', 'firstName lastName specialization')
        .sort({ completedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Lab reports retrieved', reports, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  }
}
