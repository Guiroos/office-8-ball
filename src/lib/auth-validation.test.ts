import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  getLoginFieldErrors,
  getRegisterFieldErrors,
  mapZodErrorToFieldErrors,
  validateLoginPayload,
  validateRegisterPayload,
} from "@/lib/auth-validation";

describe("auth-validation", () => {
  it("normalizes register fields when the payload is valid", () => {
    const result = validateRegisterPayload({
      username: " Gui.Dev ",
      email: " GUI@office8ball.dev ",
      password: "secret123",
    });

    expect(result).toEqual({
      data: {
        username: "gui.dev",
        email: "gui@office8ball.dev",
        password: "secret123",
      },
      fieldErrors: undefined,
    });
  });

  it("returns field errors for invalid register payloads", () => {
    expect(
      getRegisterFieldErrors({
        username: "x",
        email: "invalido",
        password: "123",
      }),
    ).toEqual({
      username:
        "Use de 3 a 24 caracteres com letras, numeros, ponto, tracinho ou underscore.",
      email: "Informe um email valido.",
      password: "A senha precisa ter pelo menos 8 caracteres.",
    });
  });

  it("returns field errors for invalid login payloads", () => {
    expect(
      getLoginFieldErrors({
        email: "invalido",
        password: "",
      }),
    ).toEqual({
      email: "Informe um email valido.",
      password: "Informe a senha.",
    });
  });

  it("normalizes login email when the payload is valid", () => {
    const result = validateLoginPayload({
      email: " GUI@office8ball.dev ",
      password: "secret123",
    });

    expect(result).toEqual({
      data: {
        email: "gui@office8ball.dev",
        password: "secret123",
      },
      fieldErrors: undefined,
    });
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
