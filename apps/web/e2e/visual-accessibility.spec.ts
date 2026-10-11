import { expect, test, type Page } from "./speech-test";
import AxeBuilder from "@axe-core/playwright";
import { createProfile, startFree, bff } from "./helpers";
async function capture(page: Page, name: string, axe = true) {
  await expect(page.locator(".loading")).toHaveCount(0);
  await expect(page.locator(".fallback")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  if (axe)
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
    ).toEqual([]);
  await page.screenshot({
    path: `test-results/visual-${test.info().project.name}-${name}.png`,
    fullPage: true,
  });
}
test("local assets, responsive screens, keyboard access and reduced motion", async ({ page }) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await capture(page, "landing");
  await page.getByRole("link", { name: "Probar la demo" }).click();
  await capture(page, "login");
  const profile = await createProfile(page);
  await capture(page, "home");
  await page.goto("/profiles");
  await capture(page, "profiles");
  await page.goto("/profiles/new");
  await expect(page.getByRole("radio", { name: /Max/ })).toBeVisible();
  await capture(page, "profile-form");
  await page.goto(`/child/${profile}/missions`);
  await capture(page, "missions");
  await page.goto(`/child/${profile}`);
  const session = await startFree(page);
  await capture(page, "conversation");
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeFocused();
  await expect(page.getByRole("button", { name: "Usar micrófono" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Idioma del micrófono" })).toHaveValue("en-US");
  // Playback must receive pointer input, rather than be covered by a tall mobile composer.
  await page.getByRole("button", { name: "Escuchar respuesta" }).click({ trial: true });
  await page.getByRole("button", { name: "Terminar conversación", exact: true }).click();
  await page.getByRole("link", { name: "Ver resumen" }).click();
  await capture(page, "summary");
  expect((await bff(page, `/conversations/sessions/${session}`)).data.status).toBe("abandoned");
  await page.goto(`/child/${profile}/rewards`);
  await capture(page, "rewards");
  await page.goto("/adult");
  await expect(page.getByRole("heading", { name: "Progreso por perfil" })).toBeVisible();
  await capture(page, "adult");
  await page.goto(`/adult/profiles/${profile}`);
  await capture(page, "adult-profile");
  await page.goto("/adult/ai-settings");
  await expect(
    page.getByRole("heading", { name: "Proveedor para conversaciones nuevas" }),
  ).toBeVisible();
  await capture(page, "providers");
  await page.goto("/profiles");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toMatch(/A|BUTTON/);
});
