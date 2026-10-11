import { expect, test, type Page } from "@playwright/test";
async function createProfile(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar en la demo" }).click();
  await expect(page).toHaveURL(/\/profiles$/);
  await page.getByRole("link", { name: /Nuevo perfil/ }).click();
  await page.getByLabel("Alias ficticio").fill("?");
  await page.getByRole("button", { name: "Crear perfil", exact: true }).click();
  await expect(page).toHaveURL(/\/profiles\/new$/);
  expect(
    await page
      .getByLabel("Alias ficticio")
      .evaluate((input: HTMLInputElement) => input.checkValidity()),
  ).toBe(false);
  await page.getByLabel("Alias ficticio").fill(`Estrella${Date.now().toString(36)}`);
  await page.getByRole("combobox", { name: "Edad", exact: true }).selectOption("8");
  await page.getByRole("button", { name: "Crear perfil", exact: true }).click();
  await expect(page).toHaveURL(/\/child\/[^/]+$/);
  await expect(page.getByRole("button", { name: "Empezar Animal Adventure" })).toBeVisible();
  return page.url().split("/").at(-1)!;
}
async function send(page: Page, message: string) {
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  await page.getByLabel("Tu mensaje en inglés").fill(message);
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(
    page.locator(".bubble.child").filter({ has: page.getByText(message, { exact: true }) }),
  ).toBeVisible();
}
test("real demo → fresh profile → Animal Adventure → 45 XP → summary/progress", async ({
  page,
}) => {
  page.on("response", async (response) => {
    if (response.url().includes("/api/") && response.status() >= 400) {
      const data = await response.json().catch(() => ({}));
      console.log("BFF failure", new URL(response.url()).pathname, response.status(), data.code);
    }
  });
  const id = await createProfile(page);
  await page.getByRole("button", { name: "Empezar Animal Adventure" }).click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+$/);
  await send(page, "dog");
  await send(page, "I likes dogs");
  await expect(page.getByText("I like dogs", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `test-results/correction-${test.info().project.name}.png`,
    fullPage: true,
  });
  await send(page, "cat");
  await expect(page.getByRole("link", { name: "Ver resumen" })).toBeVisible();
  await expect(page.locator(".conversation-heading")).toContainText("45 XP");
  await page.reload();
  await expect(page.locator(".bubble")).toHaveCount(7);
  await expect(page.locator(".celebration")).toHaveCount(0);
  await page.getByRole("link", { name: "Ver resumen" }).click();
  await expect(page.locator(".big-xp")).toHaveText("45 XP");
  await expect(page.locator(".total-xp")).toContainText("45 XP");
  const progress = await page.evaluate(async (profileId) => {
    const response = await fetch(`/api/child-profiles/${profileId}/progress`);
    return response.json();
  }, id);
  expect(progress).toMatchObject({
    xpTotal: 45,
    gamificationLevel: 1,
    completedMissionCount: 1,
    completedSessions: 1,
  });
  expect(progress.badges.map((b: { code: string }) => b.code)).toEqual(
    expect.arrayContaining(["first-talk", "kind-corrector", "animal-explorer", "mission-complete"]),
  );
  await page.screenshot({
    path: `test-results/first-journey-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Ver mi progreso", exact: true }).click();
  await expect(page.locator(".xp-block")).toContainText("45 XP");
  await expect(page.locator(".badge-card:not(.locked)")).toHaveCount(4);
  await page.screenshot({
    path: `test-results/earned-rewards-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.goto("/adult");
  await expect(page.getByRole("heading", { name: "Progreso por perfil" })).toBeVisible();
  const profileLink = page.locator(`a[href="/adult/profiles/${id}"]`);
  await expect(profileLink.locator("xpath=../..")).toContainText("45");
  await profileLink.click();
  await expect(page.locator(".xp-block")).toContainText("45 XP");
  await expect(page.getByText("Nivel de inglés: Primeros pasos", { exact: false })).toBeVisible();
  await page.screenshot({
    path: `test-results/earned-adult-${test.info().project.name}.png`,
    fullPage: true,
  });
});
