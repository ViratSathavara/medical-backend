import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { sendError } from '../utils/apiResponse.js';
import { UserRole } from '../constants/roles.js';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      sendError(res, 'Authentication required. No token provided.', 401);
      return;
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    sendError(res, 'Invalid or expired authentication token', 401);
  }
};

export const authorize = (...allowedRoles: (UserRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
        403
      );
      return;
    }

    next();
  };
};

export const requirePatientOwnershipOrStaff = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  // Admins and Doctors have clinical/administrative access
  if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.DOCTOR || req.user.role === UserRole.STAFF) {
    return next();
  }

  const requestedPatientId = req.params.patientId || req.query.patientId || req.body.patientId;
  if (req.user.role === UserRole.PATIENT) {
    if (requestedPatientId && req.user.patientId !== requestedPatientId) {
      sendError(res, 'Access denied. You can only access your own medical records.', 403);
      return;
    }
  }

  next();
};
