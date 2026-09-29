import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: ApiResponse<T>['meta']
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta })
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors: any[] = []
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
