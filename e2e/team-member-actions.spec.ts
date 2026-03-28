import { expect, test } from "@playwright/test";

import { createCredentials, createTeam, login, logout, signUp } from "./helpers/auth";

test.describe("team member actions", () => {
  test("manage team members flow", async ({ page }) => {
    const owner = createCredentials("teamowner");
    const invitee = createCredentials("invitee");
    const teamName = `members-flow-${Date.now()}`;

    // Sign up both users; invitee first so their account exists before being invited
    await signUp(page, invitee);
    await logout(page, invitee.username);

    // Owner signs up and creates a solo team
    await signUp(page, owner);

    await createTeam(page, teamName);
    const teamUrl = page.url();

    // Invite the invitee by username (button text: "Convidar Membro")
    await page.getByRole("button", { name: "Convidar Membro" }).click();
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();

    await page.getByPlaceholder(/username/i).fill(invitee.username);
    await page.getByRole("button", { name: /^convidar$/i }).click();

    // Wait for success feedback and roster refresh
    await expect(page.getByText("Membro adicionado com sucesso.")).toBeVisible();

    // After router.refresh, the new member should appear in the member list
    await expect(page.getByText(`@${invitee.username}`)).toBeVisible();

  });

  test("team details authorization blocks non-members", async ({ page }) => {
    const owner = createCredentials("authowner");
    const outsider = createCredentials("outsider");
    const teamName = `auth-test-${Date.now()}`;

    // Set up: outsider registers
    await signUp(page, outsider);
    await logout(page, outsider.username);

    // Owner creates a team
    await signUp(page, owner);
    const teamUrl = await createTeam(page, teamName);

    await logout(page, owner.username);

    // Login as outsider and navigate directly to owner's team URL
    await login(page, outsider);
    await page.goto(teamUrl);

    // Should see the access denied screen
    await expect(page.getByRole("heading", { level: 1, name: "Voce nao faz parte deste time." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar para meus times" })).toBeVisible();
  });
});
