import { Router } from 'express';
import { BillingController } from '../controllers/billingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createInvoiceSchema, recordPaymentSchema } from '../validators/index.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.get('/invoices', BillingController.getInvoices);
router.post('/invoices', authorize(UserRole.ADMIN, UserRole.STAFF), validate(createInvoiceSchema), BillingController.createInvoice);
router.get('/invoices/:id', BillingController.getInvoiceById);

router.post('/payments', validate(recordPaymentSchema), BillingController.recordPayment);
router.get('/payments', BillingController.getPayments);

export default router;
