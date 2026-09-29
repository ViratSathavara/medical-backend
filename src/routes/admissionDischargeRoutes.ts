import { Router } from 'express';
import { AdmissionDischargeController } from '../controllers/admissionDischargeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { admitPatientSchema, dischargePatientSchema } from '../validators/index.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.get('/admissions', AdmissionDischargeController.getAdmissions);
router.post('/admit', authorize(UserRole.ADMIN, UserRole.DOCTOR, UserRole.STAFF), validate(admitPatientSchema), AdmissionDischargeController.admitPatient);
router.post('/admissions/:id/discharge', authorize(UserRole.ADMIN, UserRole.DOCTOR), validate(dischargePatientSchema), AdmissionDischargeController.dischargePatient);

export default router;
