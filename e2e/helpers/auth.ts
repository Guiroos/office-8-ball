import { randomBytes } from "node:crypto";

import { expect, type Page } from "@playwright/test";

type Credentials = {
  username: string;
  email: string;
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
    email: `e2e-${safeSeed}-${uniqueSuffix}@office8ball.dev`,
    password: "secret123",
  };
}

export async function signUp(page: Page, credentials: Credentials) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Criar conta" }).first().click();
  await page.getByLabel("Username").fill(credentials.username);
  await page.getByLabel("E-mail corporativo").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Criar conta" }).last().click();
  await expect(page).toHaveURL(/\/scoreboard$/);
}

export async function login(page: Page, credentials: Credentials) {
  await page.goto("/login");
  await page.getByLabel("E-mail corporativo").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Entrar" }).last().click();
  await expect(page).toHaveURL(/\/scoreboard$/);
}

export async function logout(page: Page) {
  await page.getByTestId("dashboard-sign-out").click();
  await expect(page).toHaveURL(/\/login$/);
}
