"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel, Input } from "@/components/ui/form";
import { AUTH_RATE_LIMIT_ERROR } from "@/lib/auth-rate-limit";
import {
  getLoginFieldErrors,
  getRegisterFieldErrors,
  type AuthFieldErrors,
} from "@/lib/auth-validation";
import type { ApiErrorResponse } from "@/lib/types";

type LoginScreenProps = {
  authAvailable: boolean;
  authUnavailableReason?: string;
};

type AuthMode = "login" | "register";

type FormState = {
  username: string;
  email: string;
  password: string;
};

const INITIAL_FORM: FormState = {
  username: "",
  email: "",
  password: "",
};

const INITIAL_FIELD_ERRORS = {
  username: "",
  email: "",
  password: "",
};

type FieldErrorState = typeof INITIAL_FIELD_ERRORS;

const INITIAL_TOUCHED_FIELDS = {
  username: false,
  email: false,
  password: false,
};

const SEGMENT_BUTTON_BASE_CLASS =
  "rounded-[var(--radius-sm)] px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed";

export function LoginScreen({
  authAvailable,
  authUnavailableReason = "Autenticacao indisponivel sem DATABASE_URL configurado.",
}: LoginScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [localFieldErrors, setLocalFieldErrors] = useState(INITIAL_FIELD_ERRORS);
  const [remoteFieldErrors, setRemoteFieldErrors] = useState(INITIAL_FIELD_ERRORS);
  const [touchedFields, setTouchedFields] = useState(INITIAL_TOUCHED_FIELDS);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetFeedback() {
    setRemoteFieldErrors(INITIAL_FIELD_ERRORS);
    setGeneralError("");
  }

  function resetValidationState() {
    setLocalFieldErrors(INITIAL_FIELD_ERRORS);
    setRemoteFieldErrors(INITIAL_FIELD_ERRORS);
    setTouchedFields(INITIAL_TOUCHED_FIELDS);
    setHasSubmitted(false);
    setGeneralError("");
  }

  function toFieldErrorState(fieldErrors: AuthFieldErrors): FieldErrorState {
    return {
      username: fieldErrors.username ?? "",
      email: fieldErrors.email ?? "",
      password: fieldErrors.password ?? "",
    };
  }

  function getValidationErrors(nextForm: FormState, nextMode: AuthMode): FieldErrorState {
    const fieldErrors =
      nextMode === "register"
        ? getRegisterFieldErrors(nextForm)
        : getLoginFieldErrors({
            email: nextForm.email,
            password: nextForm.password,
          });

    return toFieldErrorState(fieldErrors);
  }

  function getVisibleFieldError(field: keyof FormState) {
    if (!touchedFields[field] && !hasSubmitted) {
      return "";
    }

    return remoteFieldErrors[field] || localFieldErrors[field] || "";
  }

  function hasFieldErrors(fieldErrors: FieldErrorState) {
    return Object.values(fieldErrors).some(Boolean);
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    resetValidationState();
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
      };

      setLocalFieldErrors(getValidationErrors(nextForm, mode));
      setRemoteFieldErrors((currentRemoteErrors) => ({
        ...currentRemoteErrors,
        [field]: "",
      }));

      return nextForm;
    });
  }

  function touchField(field: keyof FormState) {
    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));
    setLocalFieldErrors(getValidationErrors(form, mode));
  }

  async function handleRegister() {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        password: form.password,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      setRemoteFieldErrors({
        username: payload?.fieldErrors?.username ?? "",
        email: payload?.fieldErrors?.email ?? "",
        password: payload?.fieldErrors?.password ?? "",
      });
      setGeneralError(payload?.error ?? "Nao foi possivel criar a conta.");
      throw new Error(payload?.error ?? "register_failed");
    }

    const signInResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
      callbackUrl: "/scoreboard",
    });

    if (!signInResult || signInResult.error) {
      setGeneralError("Conta criada, mas nao foi possivel abrir a sessao.");
      throw new Error(signInResult?.error ?? "signin_after_register_failed");
    }
  }

  async function handleLogin() {
    const signInResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
      callbackUrl: "/scoreboard",
    });

    if (!signInResult || signInResult.error) {
      setGeneralError(
        signInResult?.error === AUTH_RATE_LIMIT_ERROR
          ? "Muitas tentativas seguidas. Aguarde um pouco antes de tentar novamente."
          : "Email ou senha invalidos.",
      );
      throw new Error(signInResult?.error ?? "signin_failed");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authAvailable) {
      setGeneralError(authUnavailableReason);
      return;
    }

    resetFeedback();
    setHasSubmitted(true);
    const nextFieldErrors = getValidationErrors(form, mode);

    setLocalFieldErrors(nextFieldErrors);

    if (hasFieldErrors(nextFieldErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await handleRegister();
      } else {
        await handleLogin();
      }

      router.push("/scoreboard");
      router.refresh();
    } catch {
      // Error feedback is already set by the auth handlers above.
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegisterMode = mode === "register";
  const visibleFieldErrors = {
    username: getVisibleFieldError("username"),
    email: getVisibleFieldError("email"),
    password: getVisibleFieldError("password"),
  };
  const isSubmitDisabled = isSubmitting || !authAvailable;
  const submitLabel = isSubmitting
    ? isRegisterMode
      ? "Criando conta..."
      : "Entrando..."
    : isRegisterMode
      ? "Criar conta"
      : "Entrar";

  return (
    <main className="min-h-dvh overflow-x-clip bg-[image:var(--brand-gradient)] lg:h-dvh lg:overflow-y-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:h-full lg:min-h-0 lg:px-8 lg:py-5">
        <section className="flex min-h-0 flex-1 lg:overflow-hidden">
          <div className="grid w-full min-h-0 flex-1 gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-5">
            <aside className="relative hidden min-h-0 overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--border-inverse)] bg-[color:var(--surface-brand)] shadow-[var(--shadow-brand)] lg:flex">
              <Image
                src="/login/login-onboarding.png"
                alt="Mesa de sinuca estilizada representando a rivalidade entre frontend e backend."
                fill
                sizes="(min-width: 1024px) 55vw, 0vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,15,10,0.78)_0%,rgba(7,20,14,0.24)_45%,rgba(179,143,71,0.12)_100%)]" />
            </aside>

            <section className="flex min-h-0 items-stretch justify-center lg:overflow-hidden">
              <div className="flex w-full max-w-[540px] flex-col rounded-[var(--radius-2xl)] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:h-full lg:max-h-full lg:p-8">
                <div className="space-y-6 lg:flex lg:h-full lg:flex-col lg:justify-center lg:space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="[font-family:var(--font-display)] text-3xl font-black leading-none tracking-[0.04em] text-[color:var(--foreground)] sm:text-4xl">
                          Office 8 Ball
                        </p>
                      </div>
                      <ThemeToggle className="h-11 shrink-0 rounded-[var(--radius-sm)] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] text-[color:var(--foreground-soft)] hover:bg-[color:var(--surface-muted)]" />
                    </div>

                    <div className="space-y-3">
                      <h1 className="text-xl font-semibold leading-tight tracking-[-0.03em] text-[color:var(--foreground-soft)] sm:text-2xl">
                        {isRegisterMode
                          ? "Crie a conta basica para liberar a mesa."
                          : "Entre para registrar a proxima vitoria."}
                      </h1>
                      {!authAvailable ? (
                        <p className="text-sm leading-6 text-[color:var(--danger)]">
                          {authUnavailableReason}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] p-2">
                    <button
                      type="button"
                      className={`${SEGMENT_BUTTON_BASE_CLASS} ${
                        !isRegisterMode
                          ? "bg-[color:var(--frontend)] text-[color:var(--foreground-inverse)] shadow-[var(--shadow-sm)]"
                          : "text-[color:var(--foreground-soft)]"
                      }`}
                      onClick={() => handleModeChange("login")}
                      disabled={isSubmitting}
                    >
                      Entrar
                    </button>
                    <button
                      type="button"
                      className={`${SEGMENT_BUTTON_BASE_CLASS} ${
                        isRegisterMode
                          ? "bg-[color:var(--frontend)] text-[color:var(--foreground-inverse)] shadow-[var(--shadow-sm)]"
                          : "text-[color:var(--foreground-soft)]"
                      }`}
                      onClick={() => handleModeChange("register")}
                      disabled={isSubmitting}
                    >
                      Criar conta
                    </button>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    {isRegisterMode ? (
                      <Field>
                        <FieldLabel htmlFor="username">Username</FieldLabel>
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          placeholder="gui.dev"
                          autoComplete="username"
                          value={form.username}
                          onChange={(event) => updateField("username", event.target.value)}
                          onBlur={() => touchField("username")}
                          disabled={isSubmitting || !authAvailable}
                          invalid={Boolean(visibleFieldErrors.username)}
                          aria-describedby={
                            visibleFieldErrors.username ? "username-error" : undefined
                          }
                        />
                        <FieldError id="username-error">
                          {visibleFieldErrors.username}
                        </FieldError>
                      </Field>
                    ) : null}

                    <Field>
                      <FieldLabel htmlFor="email">E-mail corporativo</FieldLabel>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="gui@office8ball.dev"
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        onBlur={() => touchField("email")}
                        disabled={isSubmitting || !authAvailable}
                        invalid={Boolean(visibleFieldErrors.email)}
                        aria-describedby={visibleFieldErrors.email ? "email-error" : undefined}
                      />
                      <FieldError id="email-error">{visibleFieldErrors.email}</FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="password">Senha</FieldLabel>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete={isRegisterMode ? "new-password" : "current-password"}
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        onBlur={() => touchField("password")}
                        disabled={isSubmitting || !authAvailable}
                        invalid={Boolean(visibleFieldErrors.password)}
                        aria-describedby={
                          visibleFieldErrors.password ? "password-error" : undefined
                        }
                      />
                      <FieldError id="password-error">
                        {visibleFieldErrors.password}
                      </FieldError>
                    </Field>

                    {generalError ? (
                      <div className="rounded-[var(--radius-md)] border border-[color:var(--backend-soft)] bg-[color:var(--surface-danger)] px-4 py-3 text-sm text-[color:var(--danger)]">
                        {generalError}
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="h-14 w-full rounded-[var(--radius-md)] text-base shadow-[var(--shadow-brand)]"
                      disabled={isSubmitDisabled}
                    >
                      {submitLabel}
                    </Button>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
