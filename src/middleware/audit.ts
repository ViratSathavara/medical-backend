import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService.js';

export const auditAction = (action: string, module: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Intercept finish to capture status
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        AuditService.log({
          userId: req.user?.userId,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          action,
          module,
          resourceId: req.params.id || req.body.id || req.params.patientId,
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          details: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode
          }
        }).catch(() => {});
      }
    });

    next();
  };
};
