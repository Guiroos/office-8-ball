import { expect, test } from "@playwright/test";

import { createCredentials, login, logout, signUp } from "./helpers/auth";

test.describe("authenticated scoreboard flow", () => {
  test("signs up, registers a win, and persists the updated scoreboard", async ({ page }) => {
    const credentials = createCredentials("scoreboard");
    const note = `Virou passeio ${Date.now()}`;

    await signUp(page, credentials);
    await expect(page.getByText(credentials.username, { exact: true })).toBeVisible();
    await expect(page.getByText("Frontend vs Backend")).toBeVisible();

    const initialFrontendWins = Number(
      await page.getByTestId("team-wins-frontend").textContent(),
    );

    await page.getByTestId("team-note-frontend").fill(note);
    await page.getByTestId("register-win-frontend").click();

    await expect(
      page.getByText(
        /Frontend ganhou\. Backend abriu um ticket para investigar\.|Jean chamou de responsivo\. A mesa concordou\.|Mais uma para o pixel perfect da sinuca\./,
      ),
    ).toBeVisible();
    await expect
      .poll(async () => Number(await page.getByTestId("team-wins-frontend").textContent()))
      .toBeGreaterThan(initialFrontendWins);
    await expect(page.getByRole("list").getByText(note, { exact: true })).toBeVisible();

    const persistedFrontendWins = await page.getByTestId("team-wins-frontend").textContent();

    await page.reload();

    await expect(page.getByTestId("team-wins-frontend")).toHaveText(persistedFrontendWins ?? "");
    await expect(page.getByRole("list").getByText(note, { exact: true })).toBeVisible();
  });

  test("logs out and protects /scoreboard from anonymous access", async ({ page }) => {
    const credentials = createCredentials("logout");

    await signUp(page, credentials);
    await logout(page);

    await login(page, credentials);
    await logout(page);

    await page.goto("/scoreboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows a login error for invalid credentials", async ({ page }) => {
    const credentials = createCredentials("invalid-login");

    await signUp(page, credentials);
    await logout(page);

    await page.getByLabel("E-mail corporativo").fill(credentials.email);
    await page.getByLabel("Senha").fill("wrong-password");
    await page.getByRole("button", { name: "Entrar" }).last().click();

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
    await logout(page);

    await page.getByRole("button", { name: "Criar conta" }).first().click();
    await page.getByLabel("Username").fill(credentials.username);
    await page.getByLabel("E-mail corporativo").fill(credentials.email);
    await page.getByLabel("Senha").fill(credentials.password);
    await page.getByRole("button", { name: "Criar conta" }).last().click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Ja existe uma conta com esses dados.")).toBeVisible();
    await expect(page.getByText("Este username ja esta em uso.")).toBeVisible();
    await expect(page.getByText("Este email ja esta em uso.")).toBeVisible();
  });

  test("registers a backend win with note and keeps it visible after reload", async ({
    page,
  }) => {
    const credentials = createCredentials("backend-note");
    const note = `Backend anotou ${Date.now()}`;

    await signUp(page, credentials);

    const initialBackendWins = Number(await page.getByTestId("team-wins-backend").textContent());

    await page.getByTestId("team-note-backend").fill(note);
    await page.getByTestId("register-win-backend").click();

    await expect(
      page.getByText(
        /Backend levou\. Frontend vai culpar a iluminação\.|Richard chamou de regra de negócio e encerrou a discussão\.|Adair versionou a humilhação em produção\./,
      ),
    ).toBeVisible();
    await expect
      .poll(async () => Number(await page.getByTestId("team-wins-backend").textContent()))
      .toBeGreaterThan(initialBackendWins);
    await expect(page.getByRole("list").getByText(note, { exact: true })).toBeVisible();

    const persistedBackendWins = await page.getByTestId("team-wins-backend").textContent();

    await page.reload();

    await expect(page.getByTestId("team-wins-backend")).toHaveText(persistedBackendWins ?? "");
    await expect(page.getByRole("list").getByText(note, { exact: true })).toBeVisible();
  });
});
