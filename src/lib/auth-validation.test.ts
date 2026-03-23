import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  getLoginFieldErrors,
  getRegisterFieldErrors,
  loginSchema,
  mapZodErrorToFieldErrors,
  registerSchema,
  validateLoginPayload,
  validateRegisterPayload,
} from "@/lib/auth-validation";

describe("auth-validation", () => {
  it("normalizes register fields when the payload is valid", () => {
    const result = validateRegisterPayload({
      username: " Gui.Dev ",
      password: "secret123",
    });

    expect(result).toEqual({
      data: {
        username: "gui.dev",
        password: "secret123",
      },
      fieldErrors: undefined,
    });
  });

  it("returns field errors for invalid register payloads", () => {
    expect(
      getRegisterFieldErrors({
        username: "x",
        password: "123",
      }),
    ).toEqual({
      username:
        "Use de 3 a 24 caracteres com letras, numeros, ponto, tracinho ou underscore.",
      password: "A senha precisa ter pelo menos 8 caracteres.",
    });
  });

  it("returns field errors for invalid login payloads", () => {
    expect(
      getLoginFieldErrors({
        username: "x!",
        password: "",
      }),
    ).toEqual({
      username:
        "Use de 3 a 24 caracteres com letras, numeros, ponto, tracinho ou underscore.",
      password: "Informe a senha.",
    });
  });

  it("normalizes login username when the payload is valid", () => {
    const result = validateLoginPayload({
      username: " GUI.Dev ",
      password: "secret123",
    });

    expect(result).toEqual({
      data: {
        username: "gui.dev",
        password: "secret123",
      },
      fieldErrors: undefined,
    });
  });

  it("loginSchema valida username + senha", () => {
    const result = loginSchema.safeParse({ username: "joao123", password: "senha123" });
    expect(result.success).toBe(true);
  });

  it("loginSchema rejeita email como identificador", () => {
    const result = loginSchema.safeParse({ email: "joao@x.com", password: "senha123" });
    expect(result.success).toBe(false);
  });

  it("registerSchema aceita registro sem email", () => {
    const result = registerSchema.safeParse({ username: "joao123", password: "Senha@123" });
    expect(result.success).toBe(true);
  });

  it("registerSchema aceita registro com email", () => {
    const result = registerSchema.safeParse({ username: "joao123", password: "Senha@123", email: "joao@x.com" });
    expect(result.success).toBe(true);
  });

  it("maps the first zod issue per field to the api shape", () => {
    const error = new ZodError([
      { code: "custom", message: "Primeiro username", path: ["username"] },
      { code: "custom", message: "Segundo username", path: ["username"] },
      { code: "custom", message: "Erro de email", path: ["email"] },
    ]);

    expect(mapZodErrorToFieldErrors(error)).toEqual({
      username: "Primeiro username",
      email: "Erro de email",
    });
  });
});
