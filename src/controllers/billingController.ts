import { Request, Response, NextFunction } from 'express';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Patient } from '../models/Patient.js';
import { UserRole } from '../constants/roles.js';
import { PaymentStatus } from '../constants/statuses.js';
import { PdfService } from '../services/pdfService.js';
import { AuditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class BillingController {
  /**
   * List invoices
   */
  static async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const status = req.query.status as string;

      const query: any = {};
      if (req.user?.role === UserRole.PATIENT) {
        query.patient = req.user.patientId;
      } else if (req.query.patientId) {
        query.patient = req.query.patientId;
      }

      if (status && status !== 'All') {
        query.paymentStatus = status;
      }

      const total = await Invoice.countDocuments(query);
      const invoices = await Invoice.find(query)
        .populate('patient', 'firstName lastName patientId phone bloodGroup')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Invoices retrieved', invoices, 200, {
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
   * Create invoice
   */
  static async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, appointmentId, items, discount = 0, tax = 0, notes, dueDate } = req.body;

      const patient = await Patient.findById(patientId);
      if (!patient) {
        sendError(res, 'Patient not found', 404);
        return;
      }

      const count = await Invoice.countDocuments();
      const invoiceNumber = `INV-${Date.now().toString().slice(-5)}${count + 1}`;

      const subtotal = items.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);
      const calculatedTax = tax || subtotal * 0.05;
      const totalAmount = Math.max(0, subtotal - discount + calculatedTax);

      // Generate invoice PDF
      const pdfUrl = await PdfService.generateInvoicePdf({
        invoiceNumber,
        createdAt: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientId: patient.patientId,
        patientPhone: patient.phone,
        paymentStatus: PaymentStatus.PENDING,
        items,
        subtotal,
        discount,
        tax: calculatedTax,
        totalAmount
      });

      const invoice = await Invoice.create({
        invoiceNumber,
        patient: patientId,
        appointment: appointmentId,
        items,
        subtotal,
        discount,
        tax: calculatedTax,
        totalAmount,
        amountPaid: 0,
        paymentStatus: PaymentStatus.PENDING,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes || '',
        pdfUrl,
        createdBy: req.user?.userId
      });

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'INVOICE_CREATED',
        module: 'BILLING',
        resourceId: invoice._id.toString()
      });

      sendSuccess(res, 'Invoice generated successfully', invoice, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await Invoice.findById(id)
        .populate('patient', 'firstName lastName patientId phone address email')
        .populate('appointment');

      if (!invoice) {
        sendError(res, 'Invoice not found', 404);
        return;
      }

      if (req.user?.role === UserRole.PATIENT && invoice.patient._id.toString() !== req.user.patientId) {
        sendError(res, 'Access denied to this invoice', 403);
        return;
      }

      sendSuccess(res, 'Invoice retrieved', invoice);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record a payment against an invoice (Cash / Card / UPI / Online Mock Gateway)
   */
  static async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId, amount, paymentMethod, transactionId, notes } = req.body;

      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        sendError(res, 'Invoice not found', 404);
        return;
      }

      const count = await Payment.countDocuments();
      const paymentNumber = `PAY-${Date.now().toString().slice(-4)}${count + 1}`;

      const payment = await Payment.create({
        paymentNumber,
        invoice: invoice._id,
        patient: invoice.patient,
        amount,
        paymentMethod,
        transactionId: transactionId || `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        status: PaymentStatus.PAID,
        paymentDate: new Date(),
        notes: notes || '',
        receivedBy: req.user?.userId
      });

      // Update invoice paid amounts and status
      const newAmountPaid = invoice.amountPaid + amount;
      invoice.amountPaid = newAmountPaid;

      if (newAmountPaid >= invoice.totalAmount) {
        invoice.paymentStatus = PaymentStatus.PAID;
      } else if (newAmountPaid > 0) {
        invoice.paymentStatus = PaymentStatus.PARTIALLY_PAID;
      }
      await invoice.save();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'PAYMENT_RECORDED',
        module: 'BILLING',
        resourceId: payment._id.toString(),
        details: { amount, invoiceId, paymentMethod }
      });

      sendSuccess(res, 'Payment processed successfully', {
        payment,
        invoice
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all payments
   */
  static async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const query: any = {};

      if (req.user?.role === UserRole.PATIENT) {
        query.patient = req.user.patientId;
      } else if (req.query.patientId) {
        query.patient = req.query.patientId;
      }

      const total = await Payment.countDocuments(query);
      const payments = await Payment.find(query)
        .populate('patient', 'firstName lastName patientId')
        .populate('invoice', 'invoiceNumber totalAmount')
        .sort({ paymentDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      sendSuccess(res, 'Payments retrieved', payments, 200, {
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
