import { toast } from 'sonner';

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  SECURITY = 'security',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Structured error interface
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: number;
  context?: string;
}

// Error mapping for common authentication errors
const ERROR_MAPPINGS: Record<string, Partial<AppError>> = {
  // Supabase Auth Errors
  'Invalid login credentials': {
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Invalid email or password. Please check your credentials and try again.'
  },
  'Email not confirmed': {
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Please verify your email address before signing in. Check your inbox for a verification link.'
  },
  'User already registered': {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'An account with this email already exists. Try signing in instead.'
  },
  'Password should be at least 6 characters': {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Password must be at least 6 characters long.'
  },
  'Unable to validate email address': {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Please enter a valid email address.'
  },
  'Signup requires a valid password': {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Please enter a valid password.'
  },
  'Too many requests': {
    type: ErrorType.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Too many attempts. Please wait a moment before trying again.'
  },
  'Network request failed': {
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Network connection failed. Please check your internet connection and try again.'
  },
  'Failed to fetch': {
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Unable to connect to the server. Please try again later.'
  },
  'Session expired': {
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Your session has expired. Please sign in again.'
  },
  'Access denied': {
    type: ErrorType.AUTHORIZATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'You do not have permission to access this resource.'
  },
  'CSRF token invalid': {
    type: ErrorType.SECURITY,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Security validation failed. Please refresh the page and try again.'
  }
};

// Default error messages by type
const DEFAULT_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: 'Please check your input and try again.',
  [ErrorType.AUTHENTICATION]: 'Authentication failed. Please check your credentials.',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorType.NETWORK]: 'Network error. Please check your connection and try again.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait before trying again.',
  [ErrorType.SECURITY]: 'Security check failed. Please try again.',
  [ErrorType.SERVER]: 'Server error. Please try again later.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * Create a structured error from various input types
 */
export const createAppError = (
  error: unknown,
  context?: string,
  overrides?: Partial<AppError>
): AppError => {
  const timestamp = Date.now();
  
  // Handle string errors
  if (typeof error === 'string') {
    const mapping = ERROR_MAPPINGS[error];
    return {
      type: mapping?.type || ErrorType.UNKNOWN,
      severity: mapping?.severity || ErrorSeverity.MEDIUM,
      message: error,
      userMessage: mapping?.userMessage || DEFAULT_MESSAGES[mapping?.type || ErrorType.UNKNOWN],
      timestamp,
      context,
      ...overrides
    };
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    const mapping = ERROR_MAPPINGS[error.message];
    return {
      type: mapping?.type || ErrorType.UNKNOWN,
      severity: mapping?.severity || ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: mapping?.userMessage || DEFAULT_MESSAGES[mapping?.type || ErrorType.UNKNOWN],
      timestamp,
      context,
      details: { stack: error.stack },
      ...overrides
    };
  }
  
  // Handle Supabase error objects
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as { message: string }).message;
    const mapping = ERROR_MAPPINGS[errorMessage];
    return {
      type: mapping?.type || ErrorType.UNKNOWN,
      severity: mapping?.severity || ErrorSeverity.MEDIUM,
      message: errorMessage,
      userMessage: mapping?.userMessage || DEFAULT_MESSAGES[mapping?.type || ErrorType.UNKNOWN],
      timestamp,
      context,
      details: error as Record<string, unknown>,
      ...overrides
    };
  }
  
  // Fallback for unknown error types
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: 'Unknown error occurred',
    userMessage: DEFAULT_MESSAGES[ErrorType.UNKNOWN],
    timestamp,
    context,
    details: { originalError: error },
    ...overrides
  };
};

/**
 * Handle and display errors to users
 */
export const handleError = (
  error: unknown,
  context?: string,
  options?: {
    showToast?: boolean;
    logError?: boolean;
    customMessage?: string;
  }
): AppError => {
  const { showToast = true, logError = true, customMessage } = options || {};
  
  const appError = createAppError(error, context);
  
  // Log error for debugging
  if (logError) {
    console.error(`[${appError.type.toUpperCase()}] ${context || 'Error'}:`, {
      message: appError.message,
      severity: appError.severity,
      details: appError.details,
      timestamp: new Date(appError.timestamp).toISOString()
    });
  }
  
  // Show user-friendly toast notification
  if (showToast) {
    const message = customMessage || appError.userMessage;
    
    switch (appError.severity) {
      case ErrorSeverity.LOW:
        toast.info(message);
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(message);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        toast.error(message);
        break;
      default:
        toast.error(message);
    }
  }
  
  return appError;
};

/**
 * Validate and handle form errors
 */
export const handleFormError = (
  error: unknown,
  setError: (error: string) => void,
  context?: string
): AppError => {
  const appError = handleError(error, context, { showToast: false });
  setError(appError.userMessage);
  return appError;
};

/**
 * Handle network errors with retry logic
 */
export const handleNetworkError = (
  error: unknown,
  retryFn?: () => void,
  context?: string
): AppError => {
  const appError = createAppError(error, context);
  
  if (appError.type === ErrorType.NETWORK && retryFn) {
    toast.error(appError.userMessage, {
      action: {
        label: 'Retry',
        onClick: retryFn
      }
    });
  } else {
    handleError(error, context);
  }
  
  return appError;
};

/**
 * Handle authentication errors with appropriate redirects
 */
export const handleAuthError = (
  error: unknown,
  navigate?: (path: string) => void,
  context?: string
): AppError => {
  const appError = createAppError(error, context);
  
  // Handle session expiration
  if (appError.message.includes('session') || appError.message.includes('expired')) {
    toast.error('Your session has expired. Please sign in again.', {
      action: navigate ? {
        label: 'Sign In',
        onClick: () => navigate('/auth?mode=signin')
      } : undefined
    });
  } else {
    handleError(error, context);
  }
  
  return appError;
};

/**
 * Success message handler
 */
export const showSuccess = (message: string, options?: {
  action?: { label: string; onClick: () => void };
  duration?: number;
}): void => {
  toast.success(message, {
    duration: options?.duration || 4000,
    action: options?.action
  });
};

/**
 * Info message handler
 */
export const showInfo = (message: string, options?: {
  action?: { label: string; onClick: () => void };
  duration?: number;
}): void => {
  toast.info(message, {
    duration: options?.duration || 4000,
    action: options?.action
  });
};

/**
 * Warning message handler
 */
export const showWarning = (message: string, options?: {
  action?: { label: string; onClick: () => void };
  duration?: number;
}): void => {
  toast.warning(message, {
    duration: options?.duration || 5000,
    action: options?.action
  });
};

/**
 * Loading state handler
 */
export const showLoading = (message: string): string | number => {
  return toast.loading(message);
};

/**
 * Dismiss specific toast
 */
export const dismissToast = (toastId: string): void => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = (): void => {
  toast.dismiss();
};

export default {
  createAppError,
  handleError,
  handleFormError,
  handleNetworkError,
  handleAuthError,
  showSuccess,
  showInfo,
  showWarning,
  showLoading,
  dismissToast,
  dismissAllToasts,
  ErrorType,
  ErrorSeverity
};