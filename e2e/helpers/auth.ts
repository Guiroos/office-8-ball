import { randomBytes } from "node:crypto";

import { expect, type Page } from "@playwright/test";

type TeamMode = "solo" | "duo";

type Credentials = {
  username: string;
  password: string;
};

const TEAM_DETAIL_URL_REGEX = /\/times\/[^/?#]+$/;

function isTeamDetailUrl(url: string) {
  return TEAM_DETAIL_URL_REGEX.test(url);
}

async function recoverFromTransientRouteFailure(page: Page) {
  const routeCrashHeading = page.getByRole("heading", {
    name: "Essa rota travou no meio da jogada.",
  });
  const workerHangMessage = page.getByText(
    /The Workers runtime canceled this request because it detected that your Worker's code had hung/i,
  );
  const retryButton = page.getByRole("button", { name: "Tentar novamente" });

  const hasRouteCrash = await routeCrashHeading.isVisible().catch(() => false);
  const hasWorkerHang = await workerHangMessage.isVisible().catch(() => false);
  if (!hasRouteCrash && !hasWorkerHang) {
    return false;
  }

  if (await retryButton.isVisible().catch(() => false)) {
    await retryButton.click();
  } else {
    await page.reload();
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
  return true;
}

async function openCreatedTeamFromList(page: Page, teamName: string) {
  const normalizedName = teamName.trim().toLowerCase();

  await page.goto("/times");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await recoverFromTransientRouteFailure(page);

    const teamLink = page.locator('a[href^="/times/"]', { hasText: normalizedName }).first();
    if (await teamLink.isVisible().catch(() => false)) {
      await teamLink.click();
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
      return true;
    }

    await page.reload();
    await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
  }

  return false;
}

export function createCredentials(seed: string): Credentials {
  const safeSeed = seed.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const shortSeed = safeSeed.slice(0, 6) || "user";
  const randomPart = randomBytes(4).toString("hex");
  const uniqueSuffix = `${Date.now().toString(36)}${parseInt(randomPart, 16).toString(36).slice(0, 6)}`;
  const username = `e2e${shortSeed}${uniqueSuffix}`.slice(0, 24);

  return {
    username,
    password: "secret123",
  };
}

export async function signUp(page: Page, credentials: Credentials) {
  await page.goto("/login");
  await page.getByTestId("login-mode-register").click();
  await page.getByLabel("Username").fill(credentials.username);
  await page.getByLabel("Senha").fill(credentials.password);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByTestId("login-submit").click();

    try {
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 8000 });
      return;
    } catch (error) {
      const transientRegisterError = page.getByText("Nao foi possivel criar a conta.");
      const usernameConflictError = page.getByText("Este username ja esta em uso.");
      const emailConflictError = page.getByText("Este email ja foi cadastrado.");

      if (await transientRegisterError.isVisible().catch(() => false)) {
        if (attempt < 2) {
          continue;
        }
      }

      if (
        (await usernameConflictError.isVisible().catch(() => false)) ||
        (await emailConflictError.isVisible().catch(() => false))
      ) {
        await page.getByTestId("login-mode-login").click();
        await page.getByTestId("login-submit").click();
        await expect(page).toHaveURL(/\/dashboard$/, { timeout: 8000 });
        return;
      }

      throw error;
    }
  }

  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function login(page: Page, credentials: Credentials) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(credentials.username);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function logout(page: Page, username: string) {
  await page.getByRole("button", { name: new RegExp(username, "i") }).click();
  await page.getByTestId("dashboard-sign-out").click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function openCreateTeamDialog(page: Page) {
  await page.goto("/times");

  const emptyStateTrigger = page.getByRole("button", { name: "Criar primeiro time" });
  const sidebarTrigger = page.getByRole("button", { name: "Criar Novo Time" });

  if (await emptyStateTrigger.isVisible()) {
    await emptyStateTrigger.click();
  } else {
    await sidebarTrigger.click();
  }

  await expect(page.getByRole("dialog")).toBeVisible();
}

export async function createTeam(
  page: Page,
  teamName: string,
  mode: TeamMode = "solo",
) {
  await openCreateTeamDialog(page);
  await page.getByTestId("team-create-name").fill(teamName);

  if (mode === "duo") {
    await page.getByRole("button", { name: "Duplas" }).click();
  }

  await page.getByTestId("team-create-submit").click();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (isTeamDetailUrl(page.url())) {
      break;
    }

    try {
      await expect(page).toHaveURL(TEAM_DETAIL_URL_REGEX, { timeout: 4000 });
      break;
    } catch {
      const recovered = await recoverFromTransientRouteFailure(page);
      if (recovered && isTeamDetailUrl(page.url())) {
        break;
      }

      const openedFromList = await openCreatedTeamFromList(page, teamName);
      if (openedFromList && isTeamDetailUrl(page.url())) {
        break;
      }

      const submitButton = page.getByTestId("team-create-submit");
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
      }
    }
  }

  await expect(page).toHaveURL(TEAM_DETAIL_URL_REGEX, { timeout: 10000 });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const recovered = await recoverFromTransientRouteFailure(page);
    if (!recovered) {
      break;
    }
  }

  await expect(
    page.getByRole("heading", {
      name: "Essa rota travou no meio da jogada.",
    }),
  ).not.toBeVisible();

  return page.url();
}
