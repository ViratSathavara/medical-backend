import { Router } from 'express';
import { EmergencyController } from '../controllers/emergencyController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEmergencyCaseSchema } from '../validators/index.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.get('/', EmergencyController.getCases);
router.post('/', authorize(UserRole.ADMIN, UserRole.DOCTOR, UserRole.STAFF), validate(createEmergencyCaseSchema), EmergencyController.createCase);
router.patch('/:id/status', authorize(UserRole.ADMIN, UserRole.DOCTOR, UserRole.STAFF), EmergencyController.updateStatus);

export default router;
