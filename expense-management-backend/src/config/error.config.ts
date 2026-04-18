import { HttpStatus } from '@nestjs/common';

interface ErrorConfig {
  statusCode: number;
  message: string;
  error: string;
}

const errors: Record<string, ErrorConfig> = {
  // Validation
  validationFailed: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Validation failed',
    error: 'BAD_REQUEST',
  },

  // Authentication
  unauthorized: {
    statusCode: HttpStatus.UNAUTHORIZED,
    message: 'Unauthorized',
    error: 'UNAUTHORIZED',
  },
  tokenExpired: {
    statusCode: HttpStatus.UNAUTHORIZED,
    message: 'Token has expired',
    error: 'TOKEN_EXPIRED',
  },
  tokenInvalid: {
    statusCode: HttpStatus.UNAUTHORIZED,
    message: 'Invalid token',
    error: 'TOKEN_INVALID',
  },
  invalidCredentials: {
    statusCode: HttpStatus.UNAUTHORIZED,
    message: 'Invalid credentials',
    error: 'INVALID_CREDENTIALS',
  },

  // Authorization
  forbidden: {
    statusCode: HttpStatus.FORBIDDEN,
    message: 'Access forbidden',
    error: 'FORBIDDEN',
  },

  // Not Found
  notFound: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Resource not found',
    error: 'NOT_FOUND',
  },
  userNotFound: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'User not found',
    error: 'USER_NOT_FOUND',
  },
  expenseNotFound: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Expense not found',
    error: 'EXPENSE_NOT_FOUND',
  },

  // Conflict
  emailAlreadyExists: {
    statusCode: HttpStatus.CONFLICT,
    message: 'Email already exists',
    error: 'EMAIL_ALREADY_EXISTS',
  },
  resourceConflict: {
    statusCode: HttpStatus.CONFLICT,
    message: 'Resource already exists',
    error: 'RESOURCE_CONFLICT',
  },

  // Income
  incomeNotFound: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Income not found',
    error: 'INCOME_NOT_FOUND',
  },

  // Category
  categoryNotFound: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Category not found',
    error: 'CATEGORY_NOT_FOUND',
  },
  categoryInUse: {
    statusCode: HttpStatus.CONFLICT,
    message: 'Category is in use by existing expenses',
    error: 'CATEGORY_IN_USE',
  },

  // Password
  invalidPassword: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Current password is incorrect',
    error: 'INVALID_PASSWORD',
  },

  // Server
  internalServerError: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error: 'INTERNAL_SERVER_ERROR',
  },
};

export default errors;
