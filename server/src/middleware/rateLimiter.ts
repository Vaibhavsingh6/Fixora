import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for Authentication and Privileged Endpoints
 * Limits rapid consecutive requests to prevent automated brute-force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip in automated tests to prevent false timeouts
});

/**
 * Dedicated Rate Limiter for AI Issue Analysis (POST /api/analyze-issue)
 * Protects against rapid automated calls, resource exhaustion, and high LLM API costs.
 * Returns HTTP 429 when rate limit is exceeded with clear retry guidance.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 15, // Limit each IP to 15 analyses per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: 'Too many AI issue analysis requests. Please wait a few minutes before analyzing another issue.',
  },
  skip: (req) => process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
});
