import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/helpers";

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  path?: string;
  value?: unknown;
  errors?: Record<string, { message: string }>;
}

const handleCastErrorDB = (err: MongoError): AppError =>
  new AppError(`Invalid ${err.path}: ${err.value}.`, 400);

const handleDuplicateFieldsDB = (err: MongoError): AppError => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue?.[field];
  return new AppError(
    `Duplicate field: "${field}" with value "${value}". Please use another value.`,
    400,
  );
};

const handleValidationErrorDB = (err: MongoError): AppError => {
  const errors = Object.values(err.errors || {}).map((e) => e.message);
  return new AppError(`Validation error: ${errors.join(". ")}`, 400);
};

const handleJWTError = (): AppError =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = (): AppError =>
  new AppError("Token expired. Please log in again.", 401);

export const errorHandler = (
  err: MongoError & AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === "CastError") error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError") error = handleValidationErrorDB(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const message = error.isOperational
    ? error.message
    : "Something went wrong. Please try again.";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
