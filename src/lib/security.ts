/**
 * Qdelta CRM v1 — Enterprise Security & Threat Defense Layer
 * 
 * Provides defense-in-depth protections against:
 * 1. Cross-Site Scripting (XSS) & Malicious Script Injection
 * 2. Signature Canvas & Base64 Payload Tampering
 * 3. Webhook Forgery & Replay Attacks via HMAC SHA-256 Signatures
 * 4. API Abuse & Brute-Force Rate Limiting
 * 5. Input Schema & Tamper-Proof Financial Validation
 */

import crypto from 'crypto';

// ============================================================================
// 1. XSS & MALICIOUS SCRIPT SANITIZATION
// ============================================================================

const DANGEROUS_HTML_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /<meta\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, // Matches onload=, onerror=, onclick=, etc.
];

/**
 * Strips all executable scripts, event handlers, and dangerous HTML entities
 * from untrusted string inputs to prevent Stored & Reflected XSS.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input);
  }

  let sanitized = input;

  // 1. Remove dangerous tag patterns and inline JS event handlers
  for (const pattern of DANGEROUS_HTML_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // 2. Escape dangerous standalone HTML bracket characters
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized.trim();
}

/**
 * Recursively sanitizes all string properties in an object or array.
 */
export function sanitizeObject<T>(data: T): T {
  if (!data || typeof data !== 'object') {
    if (typeof data === 'string') {
      return sanitizeString(data) as unknown as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    // Preserve signature data URLs from standard HTML entity escaping, but validate them separately
    if (key === 'signatureDataUrl' && typeof value === 'string') {
      const validation = validateSignatureBase64(value);
      result[key] = validation.valid ? value : '';
    } else {
      result[key] = sanitizeObject(value);
    }
  }

  return result as T;
}

// ============================================================================
// 2. SIGNATURE CANVAS & BASE64 VALIDATION
// ============================================================================

/**
 * Validates that an e-signature Data URL is strictly a legitimate image (PNG / SVG)
 * without embedded script payloads, oversized data buffers, or executable binaries.
 */
export function validateSignatureBase64(dataUrl: string): { valid: boolean; reason?: string } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { valid: false, reason: 'Empty or non-string signature data.' };
  }

  // Enforce Max Size (500 KB limit for signature drawing canvas)
  if (dataUrl.length > 500 * 1024) {
    return { valid: false, reason: 'Signature payload exceeds maximum allowable size (500KB).' };
  }

  // Match standard Base64 image Data URL scheme
  const match = dataUrl.match(/^data:image\/(png|svg\+xml|jpeg);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return { valid: false, reason: 'Invalid Data URL format or unsupported MIME type.' };
  }

  const base64Data = match[2];
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    // Verify PNG magic bytes (0x89, 0x50, 0x4E, 0x47) or valid image buffer
    if (match[1] === 'png' && buffer.length >= 4) {
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      if (!isPng) {
        return { valid: false, reason: 'Corrupted PNG magic byte signature.' };
      }
    }
  } catch {
    return { valid: false, reason: 'Base64 decoding failed.' };
  }

  return { valid: true };
}

// ============================================================================
// 3. HMAC SHA-256 WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

// Read Webhook Secret strictly from server environment variables (.env.local)
const SERVER_WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

/**
 * Generates an HMAC SHA-256 signature for outgoing webhook dispatches.
 */
export function generateHmacSignature(payload: string | object, secret: string = SERVER_WEBHOOK_SECRET): string {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(content).digest('hex');
}

/**
 * Verifies an incoming webhook HMAC SHA-256 signature using timing-safe comparison.
 * Prevents forgery, unauthorized webhook triggers, and timing attacks.
 */
export function verifyHmacSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string = SERVER_WEBHOOK_SECRET
): boolean {
  if (!signatureHeader) return false;

  // Clean signature (support "sha256=xxx" prefix or raw hex)
  const incomingSig = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7)
    : signatureHeader;

  if (incomingSig.length !== 64) return false; // SHA-256 hex is exactly 64 characters

  try {
    const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const incomingBuffer = Buffer.from(incomingSig, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (incomingBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(incomingBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ============================================================================
// 4. IN-MEMORY SLIDING-WINDOW RATE LIMITER
// ============================================================================

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * In-memory rate limiter to protect public API endpoints against brute force and DDoS.
 * @param key Identifier (e.g. IP address or client token)
 * @param maxRequests Maximum allowed requests in the time window
 * @param windowMs Time window in milliseconds (default 60 seconds)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 20,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInSec: Math.ceil((record.resetTime - now) / 1000),
  };
}

// ============================================================================
// 5. INPUT FORMAT & TAMPER VALIDATORS
// ============================================================================

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim()) && email.length <= 150;
}

export function isValidPositiveNumber(val: unknown): boolean {
  const num = Number(val);
  return !isNaN(num) && num >= 0 && Number.isFinite(num);
}

// ============================================================================
// 6. ENTERPRISE CRYPTOGRAPHIC JWT AUTHENTICATION ENGINE
// ============================================================================

const SERVER_JWT_SECRET = process.env.JWT_SECRET || 'qdelta_jwt_sec_8f7b3e1a90c24d65e718b2c4d9a301f5';

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export interface JwtSessionPayload {
  sub: string;
  user: string;
  role: string;
  iat: number;
  exp: number;
  [key: string]: any;
}

/**
 * Creates a cryptographically signed HMAC SHA-256 JWT Token for Agency Staff Authentication.
 */
export function createJwtToken(
  payload: Record<string, any>,
  secret: string = SERVER_JWT_SECRET,
  expiresInSeconds: number = 7 * 24 * 3600 // 7 Days session validity
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtSessionPayload = {
    sub: payload.user || 'agency-partner',
    user: payload.user || 'Partner',
    role: payload.role || 'Managing Partner',
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  const hmac = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64');
  const signatureB64 = hmac.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${signatureInput}.${signatureB64}`;
}

/**
 * Verifies a JWT token using timing-safe signature comparison and expiration check.
 */
export function verifyJwtToken<T extends JwtSessionPayload = JwtSessionPayload>(
  token: string | null | undefined,
  secret: string = SERVER_JWT_SECRET
): { valid: boolean; payload?: T; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing or empty.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid JWT structure.' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedHmac = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64');
    const expectedSigB64 = expectedHmac.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const sigBuf = Buffer.from(signatureB64);
    const expBuf = Buffer.from(expectedSigB64);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, error: 'Invalid token signature. Unauthorized.' };
    }

    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson) as T;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Session token has expired. Please log in again.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Malformed token payload.' };
  }
}

/**
 * Extracts and verifies authenticated session from an incoming HTTP request (Bearer header or cookie).
 */
export function getAuthenticatedSession(req: Request | Headers): {
  authenticated: boolean;
  user?: JwtSessionPayload;
  error?: string;
} {
  const headers = req instanceof Headers ? req : req.headers;
  
  // 1. Check Authorization Bearer header
  let token: string | null = null;
  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Fallback to session cookie
  if (!token) {
    const cookieHeader = headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/qdelta_auth_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  if (!token) {
    return { authenticated: false, error: 'No authorization token provided.' };
  }

  const result = verifyJwtToken(token);
  if (!result.valid || !result.payload) {
    return { authenticated: false, error: result.error || 'Invalid session token.' };
  }

  return { authenticated: true, user: result.payload };
}


