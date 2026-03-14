import { z, type ZodError } from "zod";

import type { ApiErrorResponse } from "@/lib/types";

export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthFieldErrors = NonNullable<ApiErrorResponse["fieldErrors"]>;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .refine((value) => USERNAME_PATTERN.test(value), {
    message:
      "Use de 3 a 24 caracteres com letras, numeros, ponto, tracinho ou underscore.",
  });

const emailSchema = z
  .string()
  .transform(normalizeEmail)
  .refine((value) => EMAIL_PATTERN.test(value), {
    message: "Informe um email valido.",
  });

const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH, {
  message: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
});

const loginPasswordSchema = z.string().min(1, {
  message: "Informe a senha.",
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export type RegisterPayload = z.output<typeof registerSchema>;
export type LoginPayload = z.output<typeof loginSchema>;

export function mapZodErrorToFieldErrors(error: ZodError): AuthFieldErrors {
  const fieldErrors: AuthFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      (field === "username" || field === "email" || field === "password") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export function getRegisterFieldErrors(payload: unknown): AuthFieldErrors {
  const result = registerSchema.safeParse(payload);

  if (result.success) {
    return {};
  }

  return mapZodErrorToFieldErrors(result.error);
}

export function getLoginFieldErrors(payload: unknown): AuthFieldErrors {
  const result = loginSchema.safeParse(payload);

  if (result.success) {
    return {};
  }

  return mapZodErrorToFieldErrors(result.error);
}

export function validateRegisterPayload(payload: unknown) {
  const result = registerSchema.safeParse(payload);

  if (!result.success) {
    return {
      data: undefined,
      fieldErrors: mapZodErrorToFieldErrors(result.error),
    } as const;
  }

  return {
    data: result.data,
    fieldErrors: undefined,
  } as const;
}

export function validateLoginPayload(payload: unknown) {
  const result = loginSchema.safeParse(payload);

  if (!result.success) {
    return {
      data: undefined,
      fieldErrors: mapZodErrorToFieldErrors(result.error),
    } as const;
  }

  return {
    data: result.data,
    fieldErrors: undefined,
  } as const;
}
