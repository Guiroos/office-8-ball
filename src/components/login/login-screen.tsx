"use client";

import { LockKeyhole, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel, Input } from "@/components/ui/form";
import { IconCallout } from "@/components/ui/icon-callout";
import { SurfacePanel } from "@/components/ui/surface-panel";
import { AUTH_RATE_LIMIT_ERROR } from "@/lib/auth-rate-limit";
import {
  getLoginFieldErrors,
  getRegisterFieldErrors,
  type AuthFieldErrors,
} from "@/lib/auth-validation";
import type { ApiErrorResponse } from "@/lib/types";

const TRUST_SIGNALS = [
  "Placar em tempo real para Frontend vs Backend",
  "Historico recente sempre recalculado a partir das partidas",
  "Sessao protegida para manter o salao interno",
];

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
  const [statusMessage, setStatusMessage] = useState(
    authAvailable
      ? "Autenticacao pronta para liberar o acesso real ao placar."
      : authUnavailableReason,
  );
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
    setStatusMessage(
      nextMode === "login"
        ? "Entre com email e senha para cair direto no placar."
        : "Crie a conta basica com username, email e senha para abrir a sessao.",
    );
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
      setStatusMessage("Auth local bloqueada ate a configuracao obrigatoria estar pronta.");
      return;
    }

    resetFeedback();
    setHasSubmitted(true);
    const nextFieldErrors = getValidationErrors(form, mode);

    setLocalFieldErrors(nextFieldErrors);

    if (hasFieldErrors(nextFieldErrors)) {
      setStatusMessage("Revise os campos destacados antes de continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await handleRegister();
      } else {
        await handleLogin();
      }

      setStatusMessage("Sessao aberta. Redirecionando para o placar...");
      router.push("/scoreboard");
      router.refresh();
    } catch {
      setStatusMessage(
        mode === "register"
          ? "Cadastro interrompido. Revise os campos e tente de novo."
          : "Login negado. Confira as credenciais e tente novamente.",
      );
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
  const isSubmitDisabled =
    isSubmitting ||
    !authAvailable ||
    hasFieldErrors(getValidationErrors(form, mode));
  const submitLabel = isSubmitting
    ? isRegisterMode
      ? "Criando conta..."
      : "Entrando..."
    : isRegisterMode
      ? "Criar conta"
      : "Entrar";

  return (
    <main className="min-h-screen overflow-x-clip bg-[image:var(--brand-gradient)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <SurfacePanel
          variant="brand"
          className="flex flex-none items-center justify-between gap-4 px-5 py-4 sm:px-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-[var(--radius-pill)] border border-[color:var(--gold-soft)] bg-[color:var(--surface-strong-muted)] text-[color:var(--gold)]">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <p className="text-[length:var(--text-label)] font-semibold uppercase tracking-[var(--tracking-label-wide)] text-[color:var(--surface-strong-foreground-muted)]">
                Office 8 Ball
              </p>
              <h1 className="text-lg font-black tracking-[-0.03em] text-[color:var(--surface-strong-foreground)] sm:text-xl">
                Login
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="hidden max-w-xs text-right text-sm text-[color:var(--surface-strong-foreground-muted)] lg:block">
              A mesa continua verde, agora com acesso controlado.
            </p>
            <ThemeToggle className="h-11 rounded-[var(--radius-sm)] border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] text-[color:var(--surface-strong-foreground)] hover:bg-[color:var(--surface-muted)]" />
          </div>
        </SurfacePanel>

        <section className="flex min-h-0 flex-1 py-4 lg:py-5">
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
              <div className="relative flex h-full flex-col justify-between p-8 text-[color:var(--surface-strong-foreground)] xl:p-10">
                <div className="max-w-md space-y-5">
                  <span className="inline-flex rounded-[var(--radius-pill)] border border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] px-4 py-2 text-[length:var(--text-label)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--surface-strong-foreground-muted)]">
                    Frontend vs Backend
                  </span>
                  <div className="space-y-4">
                    <h2 className="[font-family:var(--font-display)] text-[length:var(--text-display-md)] leading-[0.95] tracking-[0.02em] text-[color:var(--surface-strong-foreground)]">
                      A mesa abre antes do deploy.
                    </h2>
                    <p className="max-w-md text-base leading-7 text-[color:var(--surface-strong-foreground-muted)]">
                      O placar continua sendo o fluxo real do app. Agora o acesso passa por
                      sessao antes de liberar a rivalidade oficial.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {TRUST_SIGNALS.map((item) => (
                    <div
                      key={item}
                      className="rounded-[var(--radius-lg)] border border-[color:var(--border-inverse)] bg-[color:var(--surface-brand)] px-4 py-3 backdrop-blur-sm"
                    >
                      <p className="text-sm font-medium text-[color:var(--surface-strong-foreground)]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section className="flex min-h-0 items-center justify-center">
              <div className="w-full max-w-[540px] rounded-[var(--radius-2xl)] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-9">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <span className="inline-flex rounded-[var(--radius-pill)] border border-[color:var(--border)] bg-[color:var(--surface-success)] px-4 py-2 text-[length:var(--text-label)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--frontend)]">
                      Entrar no salao
                    </span>

                    <div className="space-y-3">
                      <h2 className="text-[length:var(--text-display-sm)] font-black leading-none tracking-[-0.05em] text-[color:var(--foreground)]">
                        {isRegisterMode
                          ? "Crie a conta basica para liberar a mesa."
                          : "Entre para registrar a proxima vitoria."}
                      </h2>
                      <p className="text-base leading-7 text-[color:var(--muted-foreground)]">
                        Primeiro corte com login por email e senha. O nickname pode entrar
                        depois na fase de perfil.
                      </p>
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

                    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-success)] px-4 py-3 text-sm text-[color:var(--foreground-soft)]">
                      <span>
                        {authAvailable
                          ? "Sessao local pronta para liberar o placar."
                          : authUnavailableReason}
                      </span>
                      <a
                        href="/scoreboard"
                        className="font-semibold text-[color:var(--frontend)] transition hover:opacity-80"
                      >
                        Ver placar
                      </a>
                    </div>

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

                  <IconCallout
                    icon={<ShieldCheck className="size-4" />}
                    title="Status do ambiente"
                    description={statusMessage}
                    tone="default"
                  />
                </div>
              </div>
            </section>
          </div>
        </section>

        <SurfacePanel
          className="flex flex-none flex-col items-center justify-between gap-3 px-5 py-4 text-sm text-[color:var(--surface-strong-foreground-muted)] sm:flex-row sm:px-6"
          variant="brand"
        >
          <p>Office 8 Ball agora separa preview visual de acesso real com sessao.</p>
          <div className="flex items-center gap-3 text-[color:var(--gold)]">
            <span className="h-2 w-2 rounded-full bg-current" />
            <span>Frontend e Backend entram pela mesma porta autenticada.</span>
          </div>
        </SurfacePanel>
      </div>
    </main>
  );
}
