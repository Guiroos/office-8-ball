import { expect, test } from "@playwright/test";

import { createCredentials, createTeam, logout, signUp } from "./helpers/auth";

test.describe("team create flow", () => {
  test("create solo team flow", async ({ page }) => {
    const credentials = createCredentials("teamcreate");
    const teamName = `solo-flow-${Date.now()}`;

    await signUp(page, credentials);
    await createTeam(page, teamName, "solo");

    await expect(page).toHaveURL(/\/times\/[^/?#]+$/);
    await expect(page.getByText(teamName.toLowerCase(), { exact: true })).toBeVisible();

    await page.goto("/times");
    await expect(page.getByText(teamName.toLowerCase(), { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText(teamName.toLowerCase(), { exact: true })).toBeVisible();
  });

  test("create duo team flow", async ({ page }) => {
    const credentials = createCredentials("teamduo");
    const teamName = `duo-flow-${Date.now()}`;

    await signUp(page, credentials);
    await createTeam(page, teamName, "duo");

    await expect(page).toHaveURL(/\/times\/[^/?#]+$/);
    await expect(page.getByText(teamName.toLowerCase(), { exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText("Duplas", { exact: true })).toBeVisible();

    await page.goto("/times");
    await expect(page.getByText(teamName.toLowerCase(), { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText(teamName.toLowerCase(), { exact: true })).toBeVisible();
  });

  test("create duo team and invite teammate flow", async ({ page }) => {
    const owner = createCredentials("duoinviteowner");
    const invitee = createCredentials("duoinvitee");
    const teamName = `duo-invite-${Date.now()}`;

    await signUp(page, invitee);
    await logout(page, invitee.username);

    await signUp(page, owner);
    await createTeam(page, teamName, "duo");

    await expect(page.getByRole("main").getByText("Duplas", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Convidar Membro" }).click();
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();

    await page.getByPlaceholder(/username/i).fill(invitee.username);
    await page.getByRole("button", { name: /^convidar$/i }).click();

    await expect(page.getByText("Membro adicionado com sucesso.")).toBeVisible();
    await expect(page.getByText(`@${invitee.username}`)).toBeVisible();
  });
});
