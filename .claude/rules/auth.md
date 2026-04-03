---
paths:
  - "src/lib/auth*.ts"
  - "src/app/api/**/*.ts"
  - "middleware.ts"
---

# Auth

## Availability Chain

- Call `isAuthAvailable()` before any auth operation. It requires both `hasDatabaseUrl()` and `hasAuthSecret()`.
- Missing `DATABASE_URL` → return 503 (service unavailable — DB is the dependency).
- `DATABASE_URL` present without `BETTER_AUTH_SECRET` → return 500 (misconfiguration — never treat as degraded mode). Middleware checks these at module level and throws on misconfiguration.
- **Why:** The client error-handling branches on these specific codes. Silently degrading breaks the UX flow and masks real configuration errors in production.

## Rate Limiting

- Rate limiting is Prisma-backed, keyed by `action:username:ip`. Call sequence: `buildAuthRateLimitKey()`, `getAuthRateLimitStatus()`, `registerAuthFailure()` on failure, `clearAuthRateLimit()` on success.
- Blocked requests return 429 with `retryAfterSeconds`; block duration escalates exponentially (15m, 30m, 60m max).
- Rate limiting requires `DATABASE_URL`. Do not call rate-limit functions when `DATABASE_URL` is absent; routes return 503 before reaching the rate-limit check.
- **Why:** Skipping the sequence (e.g. clearing on failure) silently disables lockout and leaves brute-force protection broken.
