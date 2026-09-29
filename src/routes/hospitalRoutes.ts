import { Router } from 'express';
import { HospitalController } from '../controllers/hospitalController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

// Publicly accessible profile
router.get('/', HospitalController.getHospitalProfile);

// Admin-only updates
router.put('/', authenticate, authorize(UserRole.ADMIN), HospitalController.updateHospitalProfile);

export default router;
