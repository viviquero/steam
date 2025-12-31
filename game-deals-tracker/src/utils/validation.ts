// Input validation and sanitization utilities

/**
 * Sanitize string input - removes potentially dangerous characters
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 500); // Limit length
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  if (password.length > 128) {
    errors.push('La contraseña es demasiado larga');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate display name
 */
export const validateDisplayName = (name: string): {
  isValid: boolean;
  error?: string;
} => {
  const sanitized = sanitizeString(name);
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }
  if (sanitized.length > 50) {
    return { isValid: false, error: 'El nombre es demasiado largo' };
  }
  if (!/^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s_-]+$/.test(sanitized)) {
    return { isValid: false, error: 'El nombre contiene caracteres no permitidos' };
  }
  
  return { isValid: true };
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query: string): string => {
  return sanitizeString(query)
    .replace(/[^\w\s\-':áéíóúñÁÉÍÓÚÑ]/g, '') // Only allow safe characters
    .slice(0, 100);
};

/**
 * Validate price input
 */
export const validatePrice = (price: number): boolean => {
  return typeof price === 'number' && 
         !isNaN(price) && 
         price >= 0 && 
         price <= 999999;
};

/**
 * Rate limiter for API calls (client-side)
 */
class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 30) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.timestamps.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.timestamps.set(key, validTimestamps);
    return true;
  }

  reset(key: string): void {
    this.timestamps.delete(key);
  }
}

export const apiRateLimiter = new RateLimiter(60000, 30); // 30 requests per minute
export const searchRateLimiter = new RateLimiter(10000, 5); // 5 searches per 10 seconds
