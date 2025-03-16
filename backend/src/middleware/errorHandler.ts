import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let error = err;
  let statusCode = 500;
  let message = 'Server Error';

  // If error is known API error
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  } else {
    // For unknown errors
    logger.error(`Unhandled Error: ${error.message}`);
    logger.error(error.stack || '');
  }

  // Check for Supabase specific errors and handle them
  if (error.message.includes('Supabase') || error.message.includes('JWT')) {
    statusCode = 401;
    message = 'Authentication error';
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Create a function to handle async errors
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};