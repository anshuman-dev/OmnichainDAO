import { TransactionErrorType } from './transaction';

/**
 * Error type enum for common error types
 */
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  EXECUTION_ERROR = 'execution_error',
  USER_REJECTED = 'user_rejected',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * Common error type used throughout the application
 * Contains information about an error that occurred
 */
export interface ErrorInfo {
  code?: string | number;
  message: string;
  type?: TransactionErrorType;
  details?: string;
}