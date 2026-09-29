import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode = 400, errors: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(`[Error Handler] ${err.name || 'Error'}: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    sendError(res, 'Validation failed', 422, formattedErrors);
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, `Invalid format for field '${err.path}': ${err.value}`, 400);
    return;
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    sendError(res, `Duplicate value '${val}' for unique field '${field}'`, 409);
    return;
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token. Please authenticate again.', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired. Please login again.', 401);
    return;
  }

  // Handle AppError
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors || []);
    return;
  }

  // Fallback 500 error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  sendError(
    res,
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : message,
    statusCode
  );
};
