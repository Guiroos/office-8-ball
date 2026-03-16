import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth-validation";

const WINDOW_MINUTES = 10;
const FAILURE_LIMIT = 5;
const BLOCK_MINUTES = 15;
const MAX_BLOCK_MINUTES = 60;
const IP_FALLBACK = "unknown";

export const AUTH_RATE_LIMIT_ERROR = "AuthRateLimited";
export const AUTH_RATE_LIMIT_MESSAGE =
  "Muitas tentativas seguidas. Aguarde um pouco antes de tentar novamente.";

export type AuthRateLimitAction = "login" | "register";

type HeaderBag = Headers | Record<string, string | string[] | undefined> | undefined;

export type AuthRateLimitKey = {
  id: string;
  action: AuthRateLimitAction;
  email: string;
  ip: string;
};

type AuthRateLimitResult = {
  blocked: boolean;
  retryAfterSeconds: number;
};

function getHeaderValue(headers: HeaderBag, name: string) {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const value = headers[name];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function resolveClientIp(headers: HeaderBag) {
  const forwardedFor = getHeaderValue(headers, "x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);

    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = getHeaderValue(headers, "x-real-ip")?.trim();

  return realIp || IP_FALLBACK;
}

export function buildAuthRateLimitKey(input: {
  action: AuthRateLimitAction;
  email: string;
  headers?: HeaderBag;
}) {
  const email = normalizeEmail(input.email);
  const ip = resolveClientIp(input.headers);

  return {
    id: `${input.action}:${email}:${ip}`,
    action: input.action,
    email,
    ip,
  } satisfies AuthRateLimitKey;
}

function getRetryAfterSeconds(blockedUntil: Date, now: Date) {
  return Math.max(1, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000));
}

function getBlockDurationMinutes(blockLevel: number) {
  return Math.min(BLOCK_MINUTES * 2 ** blockLevel, MAX_BLOCK_MINUTES);
}

function getWindowExpiry(now: Date) {
  return now.getTime() - WINDOW_MINUTES * 60 * 1000;
}

export async function getAuthRateLimitStatus(
  key: AuthRateLimitKey,
  now = new Date(),
): Promise<AuthRateLimitResult> {
  const current = await prisma.authRateLimit.findUnique({
    where: { id: key.id },
  });

  if (!current?.blockedUntil || current.blockedUntil <= now) {
    return {
      blocked: false,
      retryAfterSeconds: 0,
    };
  }

  return {
    blocked: true,
    retryAfterSeconds: getRetryAfterSeconds(current.blockedUntil, now),
  };
}

export async function clearAuthRateLimit(key: AuthRateLimitKey) {
  await prisma.authRateLimit.deleteMany({
    where: { id: key.id },
  });
}

export async function registerAuthFailure(
  key: AuthRateLimitKey,
  now = new Date(),
): Promise<AuthRateLimitResult> {
  const current = await prisma.authRateLimit.findUnique({
    where: { id: key.id },
  });
  const windowExpired =
    !current || current.windowStartedAt.getTime() < getWindowExpiry(now);

  const failCount = windowExpired ? 1 : current.failCount + 1;
  const windowStartedAt = windowExpired ? now : current.windowStartedAt;

  if (failCount >= FAILURE_LIMIT) {
    const nextBlockLevel = Math.min((current?.blockLevel ?? 0) + 1, 3);
    const blockMinutes = getBlockDurationMinutes(nextBlockLevel - 1);
    const blockedUntil = new Date(now.getTime() + blockMinutes * 60 * 1000);

    await prisma.authRateLimit.upsert({
      where: { id: key.id },
      create: {
        ...key,
        failCount: 0,
        blockLevel: nextBlockLevel,
        windowStartedAt: now,
        blockedUntil,
        lastFailedAt: now,
      },
      update: {
        failCount: 0,
        blockLevel: nextBlockLevel,
        windowStartedAt: now,
        blockedUntil,
        lastFailedAt: now,
      },
    });

    return {
      blocked: true,
      retryAfterSeconds: getRetryAfterSeconds(blockedUntil, now),
    };
  }

  await prisma.authRateLimit.upsert({
    where: { id: key.id },
    create: {
      ...key,
      failCount,
      blockLevel: current?.blockLevel ?? 0,
      windowStartedAt,
      blockedUntil: null,
      lastFailedAt: now,
    },
    update: {
      action: key.action,
      email: key.email,
      ip: key.ip,
      failCount,
      windowStartedAt,
      blockedUntil: null,
      lastFailedAt: now,
    },
  });

  return {
    blocked: false,
    retryAfterSeconds: 0,
  };
}
