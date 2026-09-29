import { Router } from 'express';
import { PharmacyController } from '../controllers/pharmacyController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMedicineSchema } from '../validators/index.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.get('/medicines', PharmacyController.getMedicines);
router.post('/medicines', authorize(UserRole.ADMIN, UserRole.STAFF), validate(createMedicineSchema), PharmacyController.addMedicine);
router.put('/medicines/:id', authorize(UserRole.ADMIN, UserRole.STAFF), PharmacyController.updateMedicine);
router.post('/medicines/:id/adjust-stock', authorize(UserRole.ADMIN, UserRole.STAFF), PharmacyController.adjustStock);
router.get('/alerts', authorize(UserRole.ADMIN, UserRole.STAFF), PharmacyController.getAlerts);

export default router;
