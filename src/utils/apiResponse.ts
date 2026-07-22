import { Response } from "express";

/**
 * Standardized success response.
 * Shape: { success, message, data, timestamp }
 */
export const sendSuccess = (
  res: Response,
  {
    statusCode = 200,
    message = "Success",
    data = null,
  }: { statusCode?: number; message?: string; data?: any },
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Standardized error response.
 * Shape: { success, message, errors, timestamp }
 */
export const sendError = (
  res: Response,
  {
    statusCode = 500,
    message = "Something went wrong",
    errors = null,
  }: { statusCode?: number; message?: string; errors?: any },
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Throwable error carrying an HTTP status code, matching the convention
 * used across the existing services (err.statusCode picked up by the
 * global error handler in app.ts).
 */
export class AppError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode = 500, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
