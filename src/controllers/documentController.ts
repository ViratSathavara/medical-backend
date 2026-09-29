import { Request, Response, NextFunction } from 'express';
import { DocumentRecord } from '../models/Document.js';
import { UserRole } from '../constants/roles.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { StorageService } from '../services/storageService.js';

export class DocumentController {
  static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No file uploaded', 400);
        return;
      }

      const { title, category, patientId, notes } = req.body;
      const fileUrl = `/uploads/${req.file.destination.split(/[\\/]/).pop()}/${req.file.filename}`;

      const doc = await DocumentRecord.create({
        title: title || req.file.originalname,
        category: category || 'MEDICAL_HISTORY',
        patient: patientId || (req.user?.role === UserRole.PATIENT ? req.user.patientId : undefined),
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user?.userId,
        notes
      });

      sendSuccess(res, 'Document uploaded successfully', doc, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: any = {};
      if (req.user?.role === UserRole.PATIENT) {
        query.patient = req.user.patientId;
      } else if (req.query.patientId) {
        query.patient = req.query.patientId;
      }

      const docs = await DocumentRecord.find(query)
        .populate('patient', 'firstName lastName patientId')
        .populate('uploadedBy', 'email role')
        .sort({ createdAt: -1 });

      sendSuccess(res, 'Documents retrieved', docs);
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await DocumentRecord.findById(id);
      if (!doc) {
        sendError(res, 'Document not found', 404);
        return;
      }

      await StorageService.deleteFile(doc.fileUrl);
      await doc.deleteOne();

      sendSuccess(res, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
