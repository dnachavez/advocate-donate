/**
 * Security utilities and middleware for enhanced application protection
 */

// Content Security Policy configuration
export const getContentSecurityPolicy = (): string => {
  const policies = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      "'unsafe-eval'", // Required for Vite in development
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      'https://maps.googleapis.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and CSS-in-JS
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://*.supabase.co',
      'https://*.supabase.in'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.supabase.in',
      'https://api.stripe.com',
      'wss://*.supabase.co',
      'wss://*.supabase.in'
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };

  return Object.entries(policies)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// Security headers configuration
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    // Content Security Policy
    'Content-Security-Policy': getContentSecurityPolicy(),
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', '),
    
    // Strict Transport Security (HTTPS only)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Cross-Origin policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
};

// Apply security headers to document
export const applySecurityHeaders = (): void => {
  const headers = getSecurityHeaders();
  
  // Apply CSP via meta tag (fallback for client-side)
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!existingCSP) {
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = headers['Content-Security-Policy'];
    document.head.appendChild(cspMeta);
  }
  
  // Apply other security headers via meta tags where possible
  const metaHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  
  Object.entries(metaHeaders).forEach(([name, content]) => {
    const existing = document.querySelector(`meta[http-equiv="${name}"]`);
    if (!existing) {
      const meta = document.createElement('meta');
      meta.httpEquiv = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  });
};

// Input sanitization utilities
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    })
    .trim();
};

// URL validation
export const isValidURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Email validation with additional security checks
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Additional security checks
  const sanitized = sanitizeInput(email);
  if (sanitized !== email) {
    return false;
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /on\w+=/i
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(email));
};

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure session storage utilities
export const secureStorage = {
  set: (key: string, value: string, expirationMinutes?: number): void => {
    const item = {
      value,
      timestamp: Date.now(),
      expiration: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null
    };
    
    try {
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to store item in sessionStorage:', error);
    }
  },
  
  get: (key: string): string | null => {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.warn('Failed to retrieve item from sessionStorage:', error);
      return null;
    }
  },
  
  remove: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove item from sessionStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
  }
};

// Rate limiting for client-side operations
class ClientRateLimit {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

export const clientRateLimit = new ClientRateLimit();

// Cleanup expired rate limit entries every 5 minutes
setInterval(() => {
  clientRateLimit.cleanup();
}, 5 * 60 * 1000);

// Security event logging
export const logSecurityEvent = (event: string, details: Record<string, unknown>): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // In production, send to security monitoring service
  console.warn('Security Event:', logEntry);
  
  // Store locally for debugging (limit to last 100 events)
  try {
    const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only last 100 events
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('security_logs', JSON.stringify(existingLogs));
  } catch (error) {
    console.warn('Failed to store security log:', error);
  }
};

// Initialize security measures
export const initializeSecurity = (): void => {
  // Apply security headers
  applySecurityHeaders();
  
  // Log security initialization
  logSecurityEvent('security_initialized', {
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  });
  
  // Monitor for suspicious activity
  let clickCount = 0;
  let lastClickTime = 0;
  
  document.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastClickTime < 100) {
      clickCount++;
      if (clickCount > 10) {
        logSecurityEvent('suspicious_clicking', {
          clickCount,
          timeWindow: now - lastClickTime
        });
        clickCount = 0;
      }
    } else {
      clickCount = 1;
    }
    lastClickTime = now;
  });
  
  // Monitor for console access (potential developer tools usage)
  let devToolsOpen = false;
  const threshold = 160;
  
  const checkDevTools = () => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        logSecurityEvent('dev_tools_opened', {
          timestamp: Date.now()
        });
      }
    } else {
      devToolsOpen = false;
    }
  };
  
  setInterval(checkDevTools, 1000);
};