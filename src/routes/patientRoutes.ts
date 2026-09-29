import { Router } from 'express';
import { PatientController } from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.get('/me', PatientController.getMyProfile);
router.get('/summary', PatientController.getPatientDashboardSummary);
router.get('/summary/:patientId', authorize(UserRole.ADMIN, UserRole.DOCTOR, UserRole.STAFF), PatientController.getPatientDashboardSummary);

router.get('/', authorize(UserRole.ADMIN, UserRole.DOCTOR, UserRole.STAFF), PatientController.getPatients);
router.get('/:id', PatientController.getPatientById);
router.put('/:id', PatientController.updatePatient);

export default router;
