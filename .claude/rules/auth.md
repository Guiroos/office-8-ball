# Auth

## Availability Chain

- `isAuthAvailable()` requires both `hasDatabaseUrl()` and `hasAuthSecret()` to be true. Missing `DATABASE_URL` returns 503; `DATABASE_URL` without `NEXTAUTH_SECRET` returns 500 -- never treat it as a degraded fallback. Middleware checks these at module level and throws on misconfiguration.

## Rate Limiting

- Rate limiting is Prisma-backed, keyed by `action:email:ip`. Call sequence: `buildAuthRateLimitKey()`, `getAuthRateLimitStatus()`, `registerAuthFailure()` on failure, `clearAuthRateLimit()` on success. Blocked requests return 429 with `retryAfterSeconds`; block duration escalates exponentially (15m, 30m, 60m max). Unavailable in in-memory mode.
