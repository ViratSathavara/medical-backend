import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

// Publicly accessible departments
router.get('/', DepartmentController.getDepartments);
router.get('/:id', DepartmentController.getDepartmentById);

// Admin-only management
router.post('/', authenticate, authorize(UserRole.ADMIN), DepartmentController.createDepartment);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), DepartmentController.updateDepartment);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), DepartmentController.deleteDepartment);

export default router;
