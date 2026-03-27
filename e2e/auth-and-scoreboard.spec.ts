import { expect, test } from "@playwright/test";

import { createCredentials, createTeam, login, logout, signUp } from "./helpers/auth";

test.describe("authenticated scoreboard flow", () => {
  test("signs up, registers a win, and persists the updated scoreboard", async ({ page }) => {
    const credentials = createCredentials("scoreboard");
    const note = `Virou passeio ${Date.now()}`;

    await signUp(page, credentials);
    await createTeam(page, `time-a-${Date.now()}`);
    await createTeam(page, `time-b-${Date.now()}`);

    await page.goto("/dashboard");
    await expect(page.getByText(credentials.username, { exact: true })).toBeVisible();

    const firstTeamWins = page.locator('[data-testid^="team-wins-"]').first();
    const initialWins = Number(await firstTeamWins.textContent());

    await page.locator('[data-testid^="team-note-"]').first().fill(note);
    await page.locator('[data-testid^="register-win-"]').first().click();

    await expect(page.getByText("Partida registrada com sucesso.")).toBeVisible();
    await expect
      .poll(async () => Number(await firstTeamWins.textContent()))
      .toBeGreaterThan(initialWins);
    await expect(page.getByRole("list").getByText(note, { exact: true })).toBeVisible();

    const persistedWins = await firstTeamWins.textContent();

    await page.reload();

    await expect(firstTeamWins).toHaveText(persistedWins ?? "");
    await expect(page.getByRole("list").getByText(note, { exact: true })).toBeVisible();
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

  test("registers a second team win with note and keeps it visible after reload", async ({
    page,
  }) => {
    const credentials = createCredentials("team-note");
    const note = `Time anotou ${Date.now()}`;

    await signUp(page, credentials);
    await createTeam(page, `time-a-${Date.now()}`);
    await createTeam(page, `time-b-${Date.now()}`);

    await page.goto("/dashboard");

    const secondTeamWins = page.locator('[data-testid^="team-wins-"]').nth(1);
    const initialWins = Number(await secondTeamWins.textContent());

    await page.locator('[data-testid^="team-note-"]').nth(1).fill(note);
    await page.locator('[data-testid^="register-win-"]').nth(1).click();

    await expect(page.getByText("Partida registrada com sucesso.")).toBeVisible();
    await expect
      .poll(async () => Number(await secondTeamWins.textContent()))
      .toBeGreaterThan(initialWins);
    await expect(page.getByRole("list").getByText(note, { exact: true })).toBeVisible();

    const persistedWins = await secondTeamWins.textContent();

    await page.reload();

    await expect(secondTeamWins).toHaveText(persistedWins ?? "");
    await expect(page.getByRole("list").getByText(note, { exact: true })).toBeVisible();
  });
});
