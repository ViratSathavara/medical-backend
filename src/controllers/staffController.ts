import { Request, Response, NextFunction } from 'express';
import { Staff } from '../models/Staff.js';
import { User } from '../models/User.js';
import { UserRole } from '../constants/roles.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuditService } from '../services/auditService.js';

export class StaffController {
  static async getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const designation = req.query.designation as string;
      const search = (req.query.search as string || '').trim();

      const query: any = {};
      if (designation && designation !== 'All') query.designation = designation;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ];
      }

      const staffMembers = await Staff.find(query)
        .populate('department', 'name code')
        .populate('user', 'email isActive profilePicture')
        .sort({ designation: 1, firstName: 1 });

      sendSuccess(res, 'Staff members retrieved', staffMembers);
    } catch (error) {
      next(error);
    }
  }

  static async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password = 'Password123!', firstName, lastName, designation, departmentId, phone } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        sendError(res, 'User email already exists', 409);
        return;
      }

      const user = await User.create({
        email: email.toLowerCase(),
        password,
        role: UserRole.STAFF,
        phone,
        isActive: true,
        isVerified: true
      });

      const count = await Staff.countDocuments();
      const employeeId = `STF-${1000 + count + 1}`;

      const staff = await Staff.create({
        user: user._id,
        employeeId,
        firstName,
        lastName,
        designation,
        department: departmentId,
        phone,
        joiningDate: new Date(),
        status: 'Active'
      });

      user.staffProfile = staff._id;
      await user.save();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'STAFF_MEMBER_CREATED',
        module: 'STAFF',
        resourceId: staff._id.toString()
      });

      sendSuccess(res, 'Staff member registered successfully', staff, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await Staff.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
        .populate('department', 'name code');

      if (!updated) {
        sendError(res, 'Staff member not found', 404);
        return;
      }

      sendSuccess(res, 'Staff details updated', updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const staff = await Staff.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true });
      if (!staff) {
        sendError(res, 'Staff member not found', 404);
        return;
      }

      sendSuccess(res, 'Staff deactivated successfully', staff);
    } catch (error) {
      next(error);
    }
  }
}
