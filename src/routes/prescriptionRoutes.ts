import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescriptionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPrescriptionSchema } from '../validators/index.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize(UserRole.DOCTOR, UserRole.ADMIN), validate(createPrescriptionSchema), PrescriptionController.createPrescription);
router.get('/', PrescriptionController.getPrescriptions);
router.get('/:id', PrescriptionController.getPrescriptionById);
router.patch('/:id/dispense', authorize(UserRole.STAFF, UserRole.ADMIN), PrescriptionController.dispensePrescription);

export default router;
