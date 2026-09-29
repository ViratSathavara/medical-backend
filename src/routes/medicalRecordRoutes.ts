import { Router } from 'express';
import { MedicalRecordController } from '../controllers/medicalRecordController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMedicalRecordSchema } from '../validators/index.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize(UserRole.DOCTOR, UserRole.ADMIN), validate(createMedicalRecordSchema), MedicalRecordController.createRecord);
router.get('/', MedicalRecordController.getRecords);
router.get('/:id', MedicalRecordController.getRecordById);
router.put('/:id', authorize(UserRole.DOCTOR, UserRole.ADMIN), MedicalRecordController.updateRecord);

export default router;
