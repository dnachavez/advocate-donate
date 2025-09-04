import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleError, handleFormError, showSuccess, ErrorType } from './errorHandler';

// Password strength requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128
};

// Rate limiting storage with enhanced tracking
interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
  ipAddress?: string;
  userAgent?: string;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const globalRateLimitStore = new Map<string, RateLimitEntry>();

// Enhanced rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Per-user limits
  user: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  // Global IP-based limits
  global: {
    maxAttempts: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  // Specific action limits
  signup: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
  },
  resend: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  reset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
  },
};

// CSRF token storage
const csrfTokenStore = new Map<string, { token: string; timestamp: number; used: boolean }>();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Validates email format
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  
  return { isValid: true };
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { 
  isValid: boolean; 
  score: number; 
  errors: string[];
  suggestions: string[];
} => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else {
    score += 1;
  }
  
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be no more than ${PASSWORD_REQUIREMENTS.maxLength} characters long`);
  }
  
  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add an uppercase letter (A-Z)');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }
  
  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add a lowercase letter (a-z)');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }
  
  // Numbers check
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add a number (0-9)');
  } else if (/\d/.test(password)) {
    score += 1;
  }
  
  // Special characters check
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
    suggestions.push('Add a special character (!@#$%^&*)');
  } else if (/[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(password)) {
    score += 1;
  }
  
  // Common patterns check
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /(.)\1{2,}/, // Repeated characters
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      suggestions.push('Avoid common patterns and repeated characters');
      score = Math.max(0, score - 1);
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    score: Math.min(5, score),
    errors,
    suggestions
  };
};

/**
 * Validates password confirmation
 */
export const validatePasswordConfirmation = (password: string, confirmPassword: string): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true };
};

/**
 * Enhanced rate limiting check with action-specific limits
 */
export const checkRateLimit = (
  identifier: string, 
  action: 'user' | 'global' | 'signup' | 'resend' | 'reset' = 'user'
): { allowed: boolean; remainingAttempts?: number; blockedUntil?: Date } => {
  const now = Date.now();
  const config = RATE_LIMIT_CONFIG[action];
  const store = action === 'global' ? globalRateLimitStore : rateLimitStore;
  const record = store.get(identifier);
  
  if (!record) {
    store.set(identifier, { 
      attempts: 1, 
      lastAttempt: now,
      ipAddress: getClientIP(),
      userAgent: navigator?.userAgent
    });
    return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
  }
  
  // Check if still blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    return { 
      allowed: false, 
      blockedUntil: new Date(record.blockedUntil)
    };
  }
  
  // Reset if window has passed
  if (now - record.lastAttempt > config.windowMs) {
    store.set(identifier, { 
      attempts: 1, 
      lastAttempt: now,
      ipAddress: getClientIP(),
      userAgent: navigator?.userAgent
    });
    return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
  }
  
  // Increment attempts
  record.attempts += 1;
  record.lastAttempt = now;
  record.ipAddress = getClientIP();
  record.userAgent = navigator?.userAgent;
  
  if (record.attempts > config.maxAttempts) {
    record.blockedUntil = now + config.blockDurationMs;
    store.set(identifier, record);
    return { 
      allowed: false, 
      blockedUntil: new Date(record.blockedUntil)
    };
  }
  
  store.set(identifier, record);
  return { 
    allowed: true, 
    remainingAttempts: config.maxAttempts - record.attempts 
  };
};

/**
 * Get client IP address (simplified for browser environment)
 */
const getClientIP = (): string => {
  // In a real application, this would be handled server-side
  // For client-side, we use a simplified approach
  return 'client-ip';
};

/**
 * Reset rate limit for successful authentication
 */
export const resetRateLimit = (identifier: string): void => {
  rateLimitStore.delete(identifier);
};

/**
 * Secure sign up function
 */
export const signUp = async ({
  email,
  password,
  fullName,
  userType,
  additionalData = {}
}: {
  email: string;
  password: string;
  fullName: string;
  userType: string;
  additionalData?: Record<string, string | number | boolean>;
}) => {
  try {
    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = handleError(new Error(emailValidation.error || 'Invalid email format'), 'signUp validation', {
        customMessage: emailValidation.error || 'Invalid email format'
      });
      return { error: error.userMessage };
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = handleError(new Error(passwordValidation.errors.join(', ')), 'signUp validation', {
        customMessage: passwordValidation.errors.join(', ')
      });
      return { error: error.userMessage };
    }
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit(email, 'signup');
    if (!rateLimitCheck.allowed) {
      const blockedUntil = rateLimitCheck.blockedUntil;
      const waitTime = blockedUntil ? Math.ceil((blockedUntil.getTime() - Date.now()) / 60000) : 30;
      const error = handleError(new Error(`Too many signup attempts. Please try again in ${waitTime} minutes.`), 'signUp rate limit');
      return { error: error.userMessage };
    }
    
    // Generate CSRF token
    const csrfToken = generateCSRFToken();
    
    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
          csrf_token: csrfToken,
          ...additionalData
        },
        emailRedirectTo: `${window.location.origin}/verify-email`
      }
    });
    
    if (error) {
      const handledError = handleError(error, 'signUp authentication');
      return { error: handledError.userMessage };
    }
    
    // Reset rate limit on success
    resetRateLimit(email);
    
    // Create session for authenticated user
    if (data.user) {
      try {
        await createSession(data.user.id);
      } catch (sessionError) {
        console.warn('Failed to create session:', sessionError);
      }
    }
    
    if (data.user && !data.user.email_confirmed_at) {
      showSuccess('Account created! Please check your email to verify your account.');
    }
    
    return { data, error: null };
  } catch (error) {
    const handledError = handleError(error, 'signUp network error');
    return { error: handledError.userMessage };
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (email: string) => {
  try {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return handleError(
        new Error(emailValidation.error || 'Invalid email format'),
        ErrorType.VALIDATION,
        { customMessage: emailValidation.error || 'Invalid email format' }
      );
    }
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit(`resend_${email}`, 'resend');
    if (!rateLimitCheck.allowed) {
      const blockedUntil = rateLimitCheck.blockedUntil;
      const waitMessage = `Too many resend attempts. Please try again ${blockedUntil ? `after ${blockedUntil.toLocaleTimeString()}` : 'later'}`;
      return handleError(
        new Error('Rate limit exceeded'),
        ErrorType.RATE_LIMIT,
        { customMessage: waitMessage }
      );
    }
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: sanitizeInput(email),
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`
      }
    });
    
    if (error) {
      return handleError(
        error,
        ErrorType.NETWORK,
        { customMessage: 'Failed to resend verification email. Please try again.' }
      );
    }
    
    showSuccess('Verification email sent successfully');
    return { error: null };
  } catch (error) {
    console.error('Resend verification error:', error);
    return handleError(
      error instanceof Error ? error : new Error('An unexpected error occurred'),
      ErrorType.UNKNOWN,
      { customMessage: 'An unexpected error occurred. Please try again.' }
    );
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string, type: 'signup' | 'recovery' = 'signup') => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type
    });
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Email verification error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('An unexpected error occurred') 
    };
  }
};

/**
 * Check email verification status
 */
export const checkEmailVerificationStatus = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return {
      user,
      isVerified: user?.email_confirmed_at !== null,
      email: user?.email,
      error: null
    };
  } catch (error) {
    console.error('Check verification status error:', error);
    return { 
      user: null,
      isVerified: false,
      email: null,
      error: error instanceof Error ? error : new Error('An unexpected error occurred') 
    };
  }
};

/**
 * Secure sign in function
 */
export const signIn = async (email: string, password: string) => {
  try {
    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = handleError(new Error(emailValidation.error || 'Invalid email format'), 'signIn validation');
      return { data: null, error: error.userMessage };
    }
    
    if (!password) {
      const error = handleError(new Error('Password is required'), 'signIn validation');
      return { data: null, error: error.userMessage };
    }
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit(email, 'user');
    if (!rateLimitCheck.allowed) {
      const blockedUntil = rateLimitCheck.blockedUntil;
      const waitTime = blockedUntil ? Math.ceil((blockedUntil.getTime() - Date.now()) / 60000) : 30;
      const error = handleError(
        new Error(`Too many failed attempts. Please try again in ${waitTime} minutes.`), 
        'signIn rate limit'
      );
      return { data: null, error: error.userMessage };
    }
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      const handledError = handleError(error, 'signIn authentication');
      return { data: null, error: handledError.userMessage };
    }
    
    // Reset rate limit on success
    resetRateLimit(email);
    
    // Create session for authenticated user
    if (data.user) {
      try {
        await createSession(data.user.id);
        showSuccess('Successfully signed in!');
      } catch (sessionError) {
        console.warn('Failed to create session:', sessionError);
      }
    }
    
    return { data, error: null };
  } catch (error) {
    const handledError = handleError(error, 'signIn network error');
    return { data: null, error: handledError.userMessage };
  }
};

// Password reset token tracking
interface ResetTokenEntry {
  email: string;
  tokenHash: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  ipAddress: string;
  userAgent: string;
}

const resetTokenStore = new Map<string, ResetTokenEntry>();
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
const MAX_RESET_ATTEMPTS_PER_TOKEN = 3;

/**
 * Generate secure reset token
 */
const generateResetToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hash reset token for secure storage
 */
const hashResetToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Clean up expired reset tokens
 */
const cleanupExpiredResetTokens = (): void => {
  const now = Date.now();
  const expiredTokens: string[] = [];
  
  for (const [tokenId, tokenData] of resetTokenStore.entries()) {
    if (tokenData.expiresAt < now) {
      expiredTokens.push(tokenId);
    }
  }
  
  expiredTokens.forEach(tokenId => {
    resetTokenStore.delete(tokenId);
  });
};

/**
 * Secure password reset function
 */
export const resetPassword = async (email: string) => {
  try {
    // Clean up expired tokens first
    cleanupExpiredResetTokens();
    
    // Validate and sanitize email
    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
    const emailValidation = validateEmail(sanitizedEmail);
    if (!emailValidation.isValid) {
      const error = handleError(
        new Error(emailValidation.error || 'Invalid email format'),
        'resetPassword validation',
        { customMessage: emailValidation.error || 'Invalid email format' }
      );
      return { error: error.userMessage };
    }
    
    // Check rate limit with specific reset action
    const rateLimitCheck = checkRateLimit(`reset_${sanitizedEmail}`, 'reset');
    if (!rateLimitCheck.allowed) {
      const blockedUntil = rateLimitCheck.blockedUntil;
      const message = blockedUntil 
        ? `Too many reset attempts. Please try again after ${blockedUntil.toLocaleTimeString()}`
        : 'Too many reset attempts. Please try again later';
      const error = handleError(
        new Error('Rate limit exceeded'),
        'resetPassword rate limit'
      );
      return { error: message };
    }
    
    // Check for suspicious activity
    if (detectSuspiciousActivity(`reset_${sanitizedEmail}`)) {
      logSecurityEvent('suspicious_password_reset', {
        email: sanitizedEmail,
        ipAddress: getClientIP(),
        userAgent: navigator?.userAgent
      });
      const error = handleError(
        new Error('Suspicious activity detected'),
        'resetPassword security'
      );
      return { error: 'Security check failed. Please try again later or contact support.' };
    }
    
    // Generate secure reset token for tracking
    const resetToken = generateResetToken();
    const tokenHash = await hashResetToken(resetToken);
    const now = Date.now();
    
    // Store reset token data
    resetTokenStore.set(resetToken, {
      email: sanitizedEmail,
      tokenHash,
      createdAt: now,
      expiresAt: now + RESET_TOKEN_EXPIRY,
      attempts: 0,
      ipAddress: getClientIP(),
      userAgent: navigator?.userAgent || 'unknown'
    });
    
    // Generate CSRF token for additional security
    const csrfToken = generateCSRFToken();
    
    // Send reset email via Supabase
     const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
       redirectTo: `${window.location.origin}/reset-password?token=${resetToken}&csrf=${csrfToken}`
     });
    
    if (error) {
      // Clean up token on failure
      resetTokenStore.delete(resetToken);
      
      // Log the error for monitoring
      logSecurityEvent('password_reset_failed', {
        email: sanitizedEmail,
        error: error.message,
        ipAddress: getClientIP()
      });
      
      // Return user-friendly error
      if (error.message.includes('rate limit')) {
        const handledError = handleError(error, 'resetPassword rate limit');
        return { error: 'Too many requests. Please wait before trying again.' };
      } else if (error.message.includes('not found')) {
        // Don't reveal if email exists for security
        showSuccess('If an account with that email exists, you will receive a password reset link.');
        return { error: null };
      } else {
        const handledError = handleError(error, 'resetPassword email send');
        return { error: 'Unable to send reset email. Please try again later.' };
      }
    }
    
    // Log successful reset request
    logSecurityEvent('password_reset_requested', {
      email: sanitizedEmail,
      tokenId: resetToken,
      ipAddress: getClientIP()
    });
    
    // Reset rate limit on success
    resetRateLimit(`reset_${sanitizedEmail}`);
    
    showSuccess('If an account with that email exists, you will receive a password reset link.');
    return { error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    
    // Log unexpected errors
    logSecurityEvent('password_reset_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: getClientIP()
    });
    
    const handledError = handleError(
      error instanceof Error ? error : new Error('Unknown error'),
      'resetPassword network error'
    );
    return { error: handledError.userMessage };
  }
};

/**
 * Validate reset token
 */
export const validateResetToken = async (token: string): Promise<{ valid: boolean; email?: string; error?: string }> => {
  try {
    cleanupExpiredResetTokens();
    
    const tokenData = resetTokenStore.get(token);
    if (!tokenData) {
      return { valid: false, error: 'Invalid or expired reset token' };
    }
    
    // Check if token is expired
    if (tokenData.expiresAt < Date.now()) {
      resetTokenStore.delete(token);
      return { valid: false, error: 'Reset token has expired' };
    }
    
    // Check attempt limit
    if (tokenData.attempts >= MAX_RESET_ATTEMPTS_PER_TOKEN) {
      resetTokenStore.delete(token);
      logSecurityEvent('reset_token_abuse', {
        email: tokenData.email,
        tokenId: token,
        attempts: tokenData.attempts
      });
      return { valid: false, error: 'Too many attempts with this token' };
    }
    
    // Increment attempt counter
    tokenData.attempts += 1;
    resetTokenStore.set(token, tokenData);
    
    return { valid: true, email: tokenData.email };
  } catch (error) {
    console.error('Reset token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
};

/**
 * Invalidate reset token after successful password change
 */
export const invalidateResetToken = (token: string): void => {
  resetTokenStore.delete(token);
};

// Auto cleanup expired reset tokens every 10 minutes
setInterval(cleanupExpiredResetTokens, 10 * 60 * 1000);

/**
 * Sign out function
 */
export const signOut = async () => {
  try {
    // Get current session before signing out
    const currentSession = getCurrentSession();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    
    // Destroy local session
    if (currentSession) {
      await destroySession(currentSession.sessionId);
    }
    
    showSuccess('Successfully signed out');
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return handleError(
      error instanceof Error ? error : new Error('An unexpected error occurred'),
      ErrorType.AUTHENTICATION,
      { customMessage: 'Failed to sign out. Please try again.' }
    );
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw error;
    }
    return { user, error: null };
  } catch (error) {
    console.error('Get user error:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error : new Error('An unexpected error occurred') 
    };
  }
};

/**
 * Generate and store CSRF token with expiration
 */
export const generateCSRFToken = (sessionId?: string): string => {
  const token = crypto.randomUUID();
  const timestamp = Date.now();
  const tokenKey = sessionId || 'default';
  
  // Clean up expired tokens
  cleanupExpiredCSRFTokens();
  
  csrfTokenStore.set(tokenKey, {
    token,
    timestamp,
    used: false
  });
  
  return token;
};

/**
 * Validate CSRF token with expiration and single-use check
 */
export const validateCSRFToken = (token: string, sessionId?: string): boolean => {
  const tokenKey = sessionId || 'default';
  const storedData = csrfTokenStore.get(tokenKey);
  
  if (!storedData) {
    return false;
  }
  
  const now = Date.now();
  
  // Check if token has expired
  if (now - storedData.timestamp > CSRF_TOKEN_EXPIRY) {
    csrfTokenStore.delete(tokenKey);
    return false;
  }
  
  // Check if token has already been used
  if (storedData.used) {
    return false;
  }
  
  // Check if token matches
  if (storedData.token !== token) {
    return false;
  }
  
  // Mark token as used
  storedData.used = true;
  csrfTokenStore.set(tokenKey, storedData);
  
  return true;
};

/**
 * Clean up expired CSRF tokens
 */
const cleanupExpiredCSRFTokens = (): void => {
  const now = Date.now();
  
  for (const [key, data] of csrfTokenStore.entries()) {
    if (now - data.timestamp > CSRF_TOKEN_EXPIRY) {
      csrfTokenStore.delete(key);
    }
  }
};

/**
 * Invalidate CSRF token
 */
export const invalidateCSRFToken = (sessionId?: string): void => {
  const tokenKey = sessionId || 'default';
  csrfTokenStore.delete(tokenKey);
};

/**
 * Security headers for enhanced protection
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  };
};

/**
 * Session security utilities
 */
// Session Management
interface SessionData {
  sessionId: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  refreshToken?: string;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
  };
}

const sessionStore = new Map<string, SessionData>();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours before expiry
const MAX_SESSIONS_PER_USER = 5;

export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

/**
 * Create a new session for authenticated user
 */
export const createSession = async (userId: string): Promise<SessionData> => {
  const sessionId = generateSessionId();
  const now = Date.now();
  
  const sessionData: SessionData = {
    sessionId,
    userId,
    createdAt: now,
    lastActivity: now,
    expiresAt: now + SESSION_DURATION,
    refreshToken: generateSessionId(),
    deviceInfo: {
      userAgent: navigator?.userAgent || 'unknown',
      ipAddress: getClientIP()
    }
  };
  
  // Clean up old sessions for this user
  await cleanupUserSessions(userId);
  
  // Store session
  sessionStore.set(sessionId, sessionData);
  
  // Store in localStorage for persistence
  try {
    localStorage.setItem('bridge_session_id', sessionId);
    localStorage.setItem('bridge_session_data', JSON.stringify({
      sessionId,
      userId,
      expiresAt: sessionData.expiresAt
    }));
  } catch (error) {
    console.warn('Failed to store session in localStorage:', error);
  }
  
  return sessionData;
};

/**
 * Get current session data
 */
export const getCurrentSession = (): SessionData | null => {
  try {
    const sessionId = localStorage.getItem('bridge_session_id');
    if (!sessionId) return null;
    
    const sessionData = sessionStore.get(sessionId);
    if (!sessionData) {
      // Try to restore from localStorage
      const storedData = localStorage.getItem('bridge_session_data');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.expiresAt > Date.now()) {
          return {
            ...parsed,
            lastActivity: Date.now(),
            deviceInfo: {
              userAgent: navigator?.userAgent || 'unknown',
              ipAddress: getClientIP()
            }
          };
        }
      }
      return null;
    }
    
    // Check if session is expired
     if (sessionData.expiresAt < Date.now()) {
       destroySession(sessionId);
       return null;
     }
    
    return sessionData;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

/**
 * Update session activity
 */
export const updateSessionActivity = async (sessionId: string): Promise<boolean> => {
  const sessionData = sessionStore.get(sessionId);
  if (!sessionData) return false;
  
  const now = Date.now();
  sessionData.lastActivity = now;
  
  // Check if session needs refresh
  if (sessionData.expiresAt - now < SESSION_REFRESH_THRESHOLD) {
    sessionData.expiresAt = now + SESSION_DURATION;
    sessionData.refreshToken = generateSessionId();
    
    // Update localStorage
    try {
      localStorage.setItem('bridge_session_data', JSON.stringify({
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        expiresAt: sessionData.expiresAt
      }));
    } catch (error) {
      console.warn('Failed to update session in localStorage:', error);
    }
  }
  
  sessionStore.set(sessionId, sessionData);
  return true;
};

/**
 * Destroy a specific session
 */
export const destroySession = async (sessionId: string): Promise<void> => {
  sessionStore.delete(sessionId);
  
  // Clean up localStorage if this is the current session
  try {
    const currentSessionId = localStorage.getItem('bridge_session_id');
    if (currentSessionId === sessionId) {
      localStorage.removeItem('bridge_session_id');
      localStorage.removeItem('bridge_session_data');
    }
  } catch (error) {
    console.warn('Failed to clean up localStorage:', error);
  }
};

/**
 * Clean up old sessions for a user (keep only the most recent ones)
 */
const cleanupUserSessions = async (userId: string): Promise<void> => {
  const userSessions = Array.from(sessionStore.entries())
    .filter(([_, session]) => session.userId === userId)
    .sort(([_, a], [__, b]) => b.lastActivity - a.lastActivity);
  
  // Remove excess sessions
  if (userSessions.length >= MAX_SESSIONS_PER_USER) {
    const sessionsToRemove = userSessions.slice(MAX_SESSIONS_PER_USER - 1);
    for (const [sessionId] of sessionsToRemove) {
      await destroySession(sessionId);
    }
  }
};

/**
 * Clean up all expired sessions
 */
export const cleanupExpiredSessions = (): void => {
  const now = Date.now();
  const expiredSessions: string[] = [];
  
  for (const [sessionId, sessionData] of sessionStore.entries()) {
    if (sessionData.expiresAt < now) {
      expiredSessions.push(sessionId);
    }
  }
  
  expiredSessions.forEach(sessionId => {
    destroySession(sessionId);
  });
};

/**
 * Destroy all sessions for a user (useful for logout from all devices)
 */
export const destroyAllUserSessions = async (userId: string): Promise<void> => {
  const userSessions = Array.from(sessionStore.entries())
    .filter(([_, session]) => session.userId === userId)
    .map(([sessionId]) => sessionId);
  
  for (const sessionId of userSessions) {
    await destroySession(sessionId);
  }
};

/**
 * Validate session and refresh if needed
 */
export const validateAndRefreshSession = async (): Promise<SessionData | null> => {
  const session = getCurrentSession();
  if (!session) return null;
  
  // Update activity
  const updated = await updateSessionActivity(session.sessionId);
  if (!updated) return null;
  
  return sessionStore.get(session.sessionId) || null;
};

/**
 * Get session info for security dashboard
 */
export const getSessionInfo = (sessionId: string): Partial<SessionData> | null => {
  const session = sessionStore.get(sessionId);
  if (!session) return null;
  
  return {
    sessionId: session.sessionId,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    expiresAt: session.expiresAt,
    deviceInfo: session.deviceInfo
  };
};

// Auto cleanup expired sessions every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

export const validateSessionIntegrity = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }
    
    // Check if session is still valid
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

/**
 * Detect suspicious activity patterns
 */
export const detectSuspiciousActivity = (identifier: string): boolean => {
  const userEntry = rateLimitStore.get(identifier);
  const globalEntry = globalRateLimitStore.get('global');
  
  // Check for rapid successive attempts
  if (userEntry && userEntry.attempts > 3) {
    return true;
  }
  
  // Check for global suspicious activity
  if (globalEntry && globalEntry.attempts > 15) {
    return true;
  }
  
  return false;
};

/**
 * Log security events (in production, this would integrate with a logging service)
 */
export const logSecurityEvent = (event: string, details: Record<string, unknown>): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator?.userAgent,
    url: window.location.href
  };
  
  // In production, send to logging service
  console.warn('Security Event:', logEntry);
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return entities[match] || match;
  });
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // Check local session first
    const localSession = getCurrentSession();
    if (!localSession) {
      return false;
    }
    
    // Validate with Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Clean up invalid local session
      await destroySession(localSession.sessionId);
      return false;
    }
    
    // Update session activity
    await updateSessionActivity(localSession.sessionId);
    
    return true;
  } catch (error) {
    console.error('Authentication check error:', error);
    return false;
  }
};

/**
 * Get password strength color
 */
export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-500';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-blue-500';
    case 5:
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

/**
 * Get password strength text
 */
export const getPasswordStrengthText = (score: number): string => {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    case 5:
      return 'Very Strong';
    default:
      return 'Unknown';
  }
};