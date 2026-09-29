import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bookAppointmentSchema, updateAppointmentStatusSchema } from '../validators/index.js';

const router = Router();

// Public doctor slots check
router.get('/doctor-slots/:doctorId', AppointmentController.getDoctorSlots);

router.use(authenticate);

router.post('/', validate(bookAppointmentSchema), AppointmentController.bookAppointment);
router.get('/', AppointmentController.getAppointments);
router.get('/:id', AppointmentController.getAppointmentById);
router.patch('/:id/status', validate(updateAppointmentStatusSchema), AppointmentController.updateAppointmentStatus);
router.patch('/:id/reschedule', AppointmentController.rescheduleAppointment);

export default router;
