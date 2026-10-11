import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, bff } from "./helpers";
test("recovers a committed profile after response loss only after adult confirmation", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: /Nuevo perfil/ }).click();
  const alias = `Cometa${Date.now().toString(36)}`;
  await page.getByLabel("Alias ficticio").fill(alias);
  let posts = 0;
  let committedId = "";
  await page.route("**/api/child-profiles", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    posts++;
    const committed = await route.fetch();
    expect(committed.status()).toBe(201);
    committedId = (await committed.json()).id;
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "Crear perfil", exact: true }).click();
  await expect(page.getByRole("button", { name: "Usar este perfil" })).toBeEnabled();
  await expect(page).toHaveURL(/profiles\/new$/);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const owned = (await bff(page, "/child-profiles")).data.items;
  expect(owned.filter((profile: { alias: string }) => profile.alias === alias)).toHaveLength(1);
  expect(posts).toBe(1);
  await page.getByRole("button", { name: "Comprobar de nuevo" }).click();
  await expect(page.getByRole("button", { name: "Usar este perfil" })).toBeEnabled();
  expect(posts).toBe(1);
  await page.getByRole("button", { name: "Usar este perfil" }).click();
  await expect(page).toHaveURL(new RegExp(`/child/${committedId}$`));
  await expect(page.getByRole("heading", { name: `¡Hola, ${alias}!` })).toBeVisible();
});
