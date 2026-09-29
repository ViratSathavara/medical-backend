import { Router } from 'express';
import { LaboratoryController } from '../controllers/laboratoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createLabTestSchema, createLabRequestSchema, enterLabResultSchema } from '../validators/index.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

// Test catalog can be viewed by all authenticated users
router.use(authenticate);

router.get('/tests', LaboratoryController.getLabTests);
router.post('/tests', authorize(UserRole.ADMIN), validate(createLabTestSchema), LaboratoryController.createLabTest);

router.post('/requests', authorize(UserRole.DOCTOR, UserRole.ADMIN), validate(createLabRequestSchema), LaboratoryController.requestLabTest);
router.get('/requests', LaboratoryController.getLabRequests);

router.post('/requests/:id/results', authorize(UserRole.STAFF, UserRole.ADMIN), validate(enterLabResultSchema), LaboratoryController.enterResults);
router.get('/reports', LaboratoryController.getLabReports);

export default router;
