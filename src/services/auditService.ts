import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export interface AuditLogParams {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  module: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

export class AuditService {
  static async log(params: AuditLogParams): Promise<void> {
    try {
      await AuditLog.create({
        user: params.userId,
        userEmail: params.userEmail,
        userRole: params.userRole,
        action: params.action,
        module: params.module,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: params.details,
        timestamp: new Date()
      });
    } catch (err) {
      logger.error('[AuditService] Failed to record audit log:', err);
    }
  }
}
