import { Router } from 'express';
import { StaffController } from '../controllers/staffController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/', StaffController.getStaff);
router.post('/', StaffController.createStaff);
router.put('/:id', StaffController.updateStaff);
router.delete('/:id', StaffController.deleteStaff);

export default router;
