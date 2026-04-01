import { expect, test } from "@playwright/test";

import { createCredentials, createTeam, login, logout, signUp } from "./helpers/auth";

test.describe("authenticated flow", () => {
  test("signs up, creates teams, and opens the partida route", async ({ page }) => {
    const credentials = createCredentials("scoreboard");

    await signUp(page, credentials);
    await createTeam(page, `time-a-${Date.now()}`);
    await createTeam(page, `time-b-${Date.now()}`);

    await page.goto("/partida");
    await expect(page.getByText(credentials.username, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nova Partida" })).toBeVisible();
  });

  test("logs out and protects /scoreboard from anonymous access", async ({ page }) => {
    const credentials = createCredentials("logout");

    await signUp(page, credentials);
    await logout(page, credentials.username);

    await login(page, credentials);
    await logout(page, credentials.username);

    await page.goto("/scoreboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows a login error for invalid credentials", async ({ page }) => {
    const credentials = createCredentials("invalid-login");

    await signUp(page, credentials);
    await logout(page, credentials.username);

    await page.getByLabel("Username").fill(credentials.username);
    await page.getByLabel("Senha").fill("wrong-password");
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Entre para registrar a proxima vitoria." }),
    ).toBeVisible();
    await expect(page.getByTestId("dashboard-sign-out")).toHaveCount(0);
  });

  test("redirects anonymous users away from /scoreboard", async ({ page }) => {
    await page.goto("/scoreboard");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Entre para registrar a proxima vitoria." }),
    ).toBeVisible();
  });

  test("shows field conflicts when signup reuses an existing username and email", async ({
    page,
  }) => {
    const credentials = createCredentials("signup-conflict");

    await signUp(page, credentials);
    await logout(page, credentials.username);

    await page.getByTestId("login-mode-register").click();
    await page.getByLabel("Username").fill(credentials.username);
    await page.getByLabel("Senha").fill(credentials.password);
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Já existe uma conta com esses dados.")).toBeVisible();
    await expect(page.getByText("Este usuário já está em uso.")).toBeVisible();
  });

  test("redirects authenticated users from /dashboard to /times", async ({ page }) => {
    const credentials = createCredentials("team-note");

    await signUp(page, credentials);
    await createTeam(page, `time-a-${Date.now()}`);
    await createTeam(page, `time-b-${Date.now()}`);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/times$/);
  });
});
