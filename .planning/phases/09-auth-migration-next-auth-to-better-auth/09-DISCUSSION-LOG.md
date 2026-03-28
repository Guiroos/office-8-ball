# Phase 9: Auth Migration next-auth to better-auth — Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-03-28
**Phase:** 09-auth-migration-next-auth-to-better-auth
**Mode:** assumptions (auto)
**Areas analyzed:** Auth Provider, Session Strategy, Schema Changes, Register Route, DATABASE_URL Guard, Client-Side Auth, Type Augmentation, Test Isolation

## Assumptions Presented

### Auth Provider & Credentials
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Use better-auth username plugin for username-based login | Confident | `src/lib/auth.ts` — CredentialsProvider with `username` field; no email |
| Preserve bcryptjs hashing for existing password hash compatibility | Confident | `src/lib/auth.ts` uses `compare()` from bcryptjs; existing users have bcrypt hashes |

### Session Strategy
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Switch to database sessions (better-auth default) | Likely | JWT was next-auth default; better-auth default is DB sessions; more secure |
| Preserve cookie config (httpOnly, secure in prod) | Confident | `src/lib/auth.ts` `shouldUseSecureAuthCookies()` logic |

### Schema Changes
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| New session + account tables needed | Confident | better-auth requires these; not in current schema |
| AuthRateLimit table preserved with custom rate limiting | Confident | `src/lib/auth-rate-limit.ts` has no next-auth deps; fully reusable |

### Register Route
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Keep custom /api/auth/register POST route | Confident | Complex logic (Zod, rate limit, 409 conflict, 201 response); not worth delegating |

### DATABASE_URL Guard
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Guard helpers preserved unchanged | Confident | Called by every API route; breaking change if removed |
| Middleware conditional auth preserved | Confident | `middleware.ts` feature-flags auth on DATABASE_URL |

### Client-Side Auth
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Replace signIn("credentials") with better-auth client | Confident | `login-screen.tsx` line with `signIn` import from next-auth/react |
| Session shape (user.id, user.username) unchanged | Confident | `SessionUser` type in types.ts; used throughout all components |

### Type Augmentation
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Remove next-auth.d.ts, replace with better-auth type inference | Confident | `src/types/next-auth.d.ts` only exists to augment next-auth types |

## Corrections Made

No corrections — auto mode, all assumptions Confident/Likely.

## Auto-Resolved

- Session strategy (JWT vs DB): auto-selected database sessions (better-auth default, more secure)
