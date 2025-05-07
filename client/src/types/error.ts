import { TransactionErrorType } from './transaction';

/**
 * Common error type used throughout the application
 * Contains information about an error that occurred
 */
export interface ErrorType {
  code?: string | number;
  message: string;
  type?: TransactionErrorType;
  details?: string;
}