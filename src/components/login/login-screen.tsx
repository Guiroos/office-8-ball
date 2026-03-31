"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { type FormEvent, useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/primitives/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { AUTH_RATE_LIMIT_ERROR } from "@/lib/auth-rate-limit-shared";
import {
  getLoginFieldErrors,
  getRegisterFieldErrors,
  type AuthFieldErrors,
} from "@/lib/auth-validation";
import type { ApiErrorResponse } from "@/lib/types";

import LoginPageImage from '../../../public/login/login-onboarding.png'

type LoginScreenProps = {
  authAvailable: boolean;
  authUnavailableReason?: string;
};

type AuthMode = "login" | "register";

type FormState = {
  username: string;
  password: string;
};

const INITIAL_FORM: FormState = {
  username: "",
  password: "",
};

const INITIAL_FIELD_ERRORS = {
  username: "",
  password: "",
};

type FieldErrorState = typeof INITIAL_FIELD_ERRORS;

const INITIAL_TOUCHED_FIELDS = {
  username: false,
  password: false,
};

export function LoginScreen({
  authAvailable,
  authUnavailableReason = "Autenticacao indisponivel sem DATABASE_URL configurado.",
}: LoginScreenProps) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [localFieldErrors, setLocalFieldErrors] = useState(INITIAL_FIELD_ERRORS);
  const [remoteFieldErrors, setRemoteFieldErrors] = useState(INITIAL_FIELD_ERRORS);
  const [touchedFields, setTouchedFields] = useState(INITIAL_TOUCHED_FIELDS);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
      password: fieldErrors.password ?? "",
    };
  }

  function getValidationErrors(nextForm: FormState, nextMode: AuthMode): FieldErrorState {
    const fieldErrors =
      nextMode === "register"
        ? getRegisterFieldErrors(nextForm)
        : getLoginFieldErrors({
            username: nextForm.username,
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
        password: form.password,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      setRemoteFieldErrors({
        username: payload?.fieldErrors?.username ?? "",
        password: payload?.fieldErrors?.password ?? "",
      });
      setGeneralError(payload?.error ?? "Nao foi possivel criar a conta.");
      throw new Error(payload?.error ?? "register_failed");
    }

    const { error: signInError } = await authClient.signIn.username({
      username: form.username,
      password: form.password,
    });

    if (signInError) {
      setGeneralError("Conta criada, mas nao foi possivel abrir a sessao.");
      throw new Error(
        (typeof signInError === "object" && signInError !== null && "message" in signInError
          ? (signInError as { message?: string }).message
          : String(signInError)) ?? "signin_after_register_failed",
      );
    }
  }

  async function handleLogin() {
    const { error } = await authClient.signIn.username({
      username: form.username,
      password: form.password,
    });

    if (error) {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : String(error);
      setGeneralError(
        errorMessage === AUTH_RATE_LIMIT_ERROR
          ? "Muitas tentativas seguidas. Aguarde um pouco antes de tentar novamente."
          : "Username ou senha invalidos.",
      );
      throw new Error(errorMessage ?? "signin_failed");
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

      router.push("/profile");
    } catch {
      // Error feedback is already set by the auth handlers above.
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegisterMode = mode === "register";
  const visibleFieldErrors = {
    username: getVisibleFieldError("username"),
    password: getVisibleFieldError("password"),
  };
  const areControlsDisabled = !isHydrated || isSubmitting;
  const isSubmitDisabled = areControlsDisabled || !authAvailable;
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
            <aside className="relative hidden min-h-0 overflow-hidden rounded-2xl border border-border-inverse bg-surface-brand shadow-lg shadow-gold/35 lg:flex">
              <Image
                src={LoginPageImage}
                alt="Mesa de sinuca estilizada representando a rivalidade entre frontend e backend."
                fill
                sizes="(min-width: 1024px) 55vw, 0vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,15,10,0.78)_0%,rgba(7,20,14,0.24)_45%,rgba(179,143,71,0.12)_100%)]" />
            </aside>

            <section className="flex min-h-0 items-stretch justify-center lg:overflow-hidden">
              <div className="flex w-full max-w-[540px] flex-col rounded-2xl border border-border bg-surface p-6 shadow-lg sm:p-8 lg:h-full lg:max-h-full lg:p-8">
                <div className="space-y-6 lg:flex lg:h-full lg:flex-col lg:justify-center lg:space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-3xl font-black leading-none tracking-[0.04em] text-foreground sm:text-4xl">
                          Office 8 Ball
                        </p>
                      </div>
                      <ThemeToggle className="h-11 shrink-0 rounded-sm border border-border bg-surface-emphasis text-muted-foreground hover:bg-surface-muted" />
                    </div>

                    <div className="space-y-3">
                      <h1 className="subtitle leading-tight text-muted-foreground">
                        {isRegisterMode
                          ? "Crie a conta basica para liberar a mesa."
                          : "Entre para registrar a proxima vitoria."}
                      </h1>
                      {!authAvailable ? (
                        <p className="text-sm leading-6 text-danger">
                          {authUnavailableReason}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <SegmentedControl className="grid grid-cols-2">
                    <SegmentedControlItem
                      type="button"
                      active={!isRegisterMode}
                      onClick={() => handleModeChange("login")}
                      disabled={areControlsDisabled}
                      data-testid="login-mode-login"
                    >
                      Entrar
                    </SegmentedControlItem>
                    <SegmentedControlItem
                      type="button"
                      active={isRegisterMode}
                      onClick={() => handleModeChange("register")}
                      disabled={areControlsDisabled}
                      data-testid="login-mode-register"
                    >
                      Criar conta
                    </SegmentedControlItem>
                  </SegmentedControl>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <Field>
                      <Label htmlFor="username" className="text-sm font-semibold text-muted-foreground">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="gui.dev"
                        autoComplete="username"
                        value={form.username}
                        onChange={(event) => updateField("username", event.target.value)}
                        onBlur={() => touchField("username")}
                        disabled={areControlsDisabled || !authAvailable}
                        invalid={Boolean(visibleFieldErrors.username)}
                        aria-describedby={
                          visibleFieldErrors.username ? "username-error" : undefined
                        }
                      />
                      <FieldError id="username-error">
                        {visibleFieldErrors.username}
                      </FieldError>
                    </Field>

                    <Field>
                      <Label htmlFor="password" className="text-sm font-semibold text-muted-foreground">Senha</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete={isRegisterMode ? "new-password" : "current-password"}
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        onBlur={() => touchField("password")}
                        disabled={areControlsDisabled || !authAvailable}
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
                      <div className="rounded-md border border-team-beta-soft bg-surface-danger px-4 py-3 text-sm text-danger">
                        {generalError}
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="h-14 w-full rounded-md text-base"
                      disabled={isSubmitDisabled}
                      data-testid="login-submit"
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
