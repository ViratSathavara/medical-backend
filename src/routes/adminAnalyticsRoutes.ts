import { Router } from 'express';
import { AdminAnalyticsController } from '../controllers/adminAnalyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/analytics', AdminAnalyticsController.getDashboardAnalytics);
router.get('/audit-logs', AdminAnalyticsController.getAuditLogs);
router.get('/users', AdminAnalyticsController.getUsers);
router.patch('/users/:id/toggle-status', AdminAnalyticsController.toggleUserStatus);

export default router;
