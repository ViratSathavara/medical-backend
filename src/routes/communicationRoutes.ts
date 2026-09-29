import { Router } from 'express';
import { CommunicationController } from '../controllers/communicationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendMessageSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Messaging
router.get('/messages', CommunicationController.getMessages);
router.post('/messages', validate(sendMessageSchema), CommunicationController.sendMessage);

// Notifications
router.get('/notifications', CommunicationController.getNotifications);
router.patch('/notifications/:id/read', CommunicationController.markNotificationAsRead);

export default router;
