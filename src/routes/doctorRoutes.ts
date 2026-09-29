import { Router } from 'express';
import { DoctorController } from '../controllers/doctorController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

// Publicly viewable doctors list and profile
router.get('/', DoctorController.getDoctors);

router.get('/me', authenticate, DoctorController.getMyProfile);
router.get('/dashboard-summary', authenticate, DoctorController.getDoctorDashboardSummary);
router.get('/patients', authenticate, authorize(UserRole.DOCTOR, UserRole.ADMIN), DoctorController.getDoctorPatients);

router.get('/:id', DoctorController.getDoctorById);
router.put('/:id', authenticate, DoctorController.updateDoctor);
router.patch('/:id/approve', authenticate, authorize(UserRole.ADMIN), DoctorController.approveDoctor);

export default router;
