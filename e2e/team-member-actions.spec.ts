import { expect, test, type Page } from "@playwright/test";

import { createCredentials, createTeam, login, logout, signUp } from "./helpers/auth";

async function recoverFromTransientRouteFailure(page: Page) {
  const routeCrashHeading = page.getByRole("heading", {
    name: "Essa rota travou no meio da jogada.",
  });
  const workerHangMessage = page.getByText(
    /The Workers runtime canceled this request because it detected that your Worker's code had hung/i,
  );

  const hasRouteCrash = await routeCrashHeading.isVisible().catch(() => false);
  const hasWorkerHang = await workerHangMessage.isVisible().catch(() => false);

  if (!hasRouteCrash && !hasWorkerHang) {
    return false;
  }

  const retryButton = page.getByRole("button", { name: "Tentar novamente" });
  if (await retryButton.isVisible().catch(() => false)) {
    await retryButton.click();
  } else {
    await page.reload();
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
  return true;
}

test.describe("team member actions", () => {
  test.describe.configure({ timeout: 120_000 });

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

    // Invite the invitee by username (button text: "Convidar Membro")
    const inviteMemberButton = page.getByRole("button", { name: "Convidar Membro" });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (await inviteMemberButton.isVisible().catch(() => false)) {
        break;
      }

      const recovered = await recoverFromTransientRouteFailure(page);
      if (!recovered) {
        await page.reload();
      }
    }

    await expect(inviteMemberButton).toBeVisible({ timeout: 15000 });
    await inviteMemberButton.click();
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();

    await page.getByPlaceholder(/username/i).fill(invitee.username);
    await page.getByRole("button", { name: /^convidar$/i }).click();

    // After refresh, the invited member should appear in the roster.
    const invitedMemberRow = page.getByText(`@${invitee.username}`);
    const twoMembersBadge = page.getByText("2 membros", { exact: true });
    let invitedMemberVisible = false;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const hasInvitedRow = await invitedMemberRow.isVisible().catch(() => false);
      const hasUpdatedCount = await twoMembersBadge.isVisible().catch(() => false);
      if (hasInvitedRow || hasUpdatedCount) {
        invitedMemberVisible = true;
        break;
      }

      const inviteDialog = page.getByRole("dialog", { name: "Convidar Membro" });
      const inviteSubmitButton = inviteDialog.getByRole("button", { name: /^convidar$/i });
      const inviteInput = page.getByPlaceholder(/username/i);

      if (await inviteDialog.isVisible().catch(() => false)) {
        const canEditInviteInput = await inviteInput.isEditable().catch(() => false);
        const canSubmitInvite = await inviteSubmitButton.isEnabled().catch(() => false);

        if (canEditInviteInput) {
          await inviteInput.fill(invitee.username);
        }

        if (canSubmitInvite) {
          await inviteSubmitButton.click();
        }
      }

      const recovered = await recoverFromTransientRouteFailure(page);
      if (!recovered) {
        const openInviteDialogButton = page.getByRole("button", { name: "Convidar Membro" });
        if (await openInviteDialogButton.isVisible().catch(() => false)) {
          await openInviteDialogButton.click();
        }
      }
    }

    if (!invitedMemberVisible) {
      await expect
        .poll(async () => {
          const hasInvitedRow = await invitedMemberRow.isVisible().catch(() => false);
          const hasUpdatedCount = await twoMembersBadge.isVisible().catch(() => false);
          return hasInvitedRow || hasUpdatedCount;
        }, { timeout: 15000 })
        .toBe(true);
    }

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

    const accessDeniedHeading = page.getByRole("heading", {
      level: 1,
      name: /Voce nao faz parte deste time\./i,
    });

    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (await accessDeniedHeading.isVisible().catch(() => false)) {
        break;
      }

      await recoverFromTransientRouteFailure(page);
      if (await accessDeniedHeading.isVisible().catch(() => false)) {
        break;
      }

      await page.goto(teamUrl);
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
    }

    // Should see the access denied screen
    await expect(accessDeniedHeading).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("link", { name: "Voltar para meus times" })).toBeVisible();
  });
});
