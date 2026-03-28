import { expect, test } from "@playwright/test";

import { createCredentials, openCreateTeamDialog, signUp } from "./helpers/auth";

test.describe("team create flow", () => {
  test("create solo team flow", async ({ page }) => {
    const credentials = createCredentials("teamcreate");
    const teamName = `solo-flow-${Date.now()}`;

    await signUp(page, credentials);

    await openCreateTeamDialog(page);
    await page.getByTestId("team-create-name").fill(teamName);
    await page.getByTestId("team-create-submit").click();

    await expect(page).toHaveURL(/\/times\/[^/?#]+$/);
    await expect(page.getByText(teamName.toLowerCase(), { exact: true })).toBeVisible();

    await page.goto("/times");
    await expect(page.getByText(teamName.toLowerCase(), { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText(teamName.toLowerCase(), { exact: true })).toBeVisible();
  });
});
