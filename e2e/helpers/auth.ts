import { randomBytes } from "node:crypto";

import { expect, type Page } from "@playwright/test";

type TeamMode = "solo" | "duo";

type Credentials = {
  username: string;
  password: string;
};

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
  await page.getByTestId("login-submit").click();
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
  await expect(page).toHaveURL(/\/times\/[^/?#]+$/);

  return page.url();
}
