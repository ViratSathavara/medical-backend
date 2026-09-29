import { Request, Response, NextFunction } from 'express';
import { Department } from '../models/Department.js';
import { Doctor } from '../models/Doctor.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuditService } from '../services/auditService.js';

export class DepartmentController {
  static async getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.all !== 'true';
      const query = activeOnly ? { isActive: true } : {};

      const departments = await Department.find(query)
        .populate('headDoctor', 'firstName lastName specialization profilePicture')
        .sort({ name: 1 });

      // Count doctors per department
      const counts = await Doctor.aggregate([
        { $match: { status: 'Approved' } },
        { $group: { _id: '$department', doctorCount: { $sum: 1 } } }
      ]);

      const countMap: Record<string, number> = {};
      counts.forEach((c) => {
        countMap[c._id.toString()] = c.doctorCount;
      });

      const enriched = departments.map((d) => ({
        ...d.toObject(),
        doctorCount: countMap[d._id.toString()] || 0
      }));

      sendSuccess(res, 'Departments retrieved successfully', enriched);
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const department = await Department.findById(id)
        .populate('headDoctor', 'firstName lastName specialization');

      if (!department) {
        sendError(res, 'Department not found', 404);
        return;
      }

      // Fetch doctors in this department
      const doctors = await Doctor.find({ department: id, status: 'Approved' })
        .populate('user', 'email profilePicture');

      sendSuccess(res, 'Department retrieved', {
        department,
        doctors
      });
    } catch (error) {
      next(error);
    }
  }

  static async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await Department.create(req.body);

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'DEPARTMENT_CREATED',
        module: 'DEPARTMENTS',
        resourceId: department._id.toString()
      });

      sendSuccess(res, 'Department created successfully', department, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await Department.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

      if (!updated) {
        sendError(res, 'Department not found', 404);
        return;
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'DEPARTMENT_UPDATED',
        module: 'DEPARTMENTS',
        resourceId: id
      });

      sendSuccess(res, 'Department updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      // Soft-delete or toggle isActive
      const dept = await Department.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!dept) {
        sendError(res, 'Department not found', 404);
        return;
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'DEPARTMENT_DEACTIVATED',
        module: 'DEPARTMENTS',
        resourceId: id
      });

      sendSuccess(res, 'Department deactivated successfully', dept);
    } catch (error) {
      next(error);
    }
  }
}
