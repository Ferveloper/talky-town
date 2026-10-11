import { expect, type Page } from "@playwright/test";
export async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar en la demo" }).click();
  await expect(page).toHaveURL(/\/profiles$/);
}
export async function createProfile(page: Page, age = "8") {
  await login(page);
  await page.getByRole("link", { name: /Nuevo perfil/ }).click();
  await page.getByLabel("Alias ficticio").fill(`Estrella${Date.now().toString(36)}`);
  await page.getByRole("combobox", { name: "Edad", exact: true }).selectOption(age);
  await page.getByRole("button", { name: "Crear perfil", exact: true }).click();
  await expect(page).toHaveURL(/\/child\/[^/]+$/);
  await expect(page.getByRole("button", { name: "Conversación libre", exact: true })).toBeVisible();
  return page.url().split("/").at(-1)!;
}
export async function startFree(page: Page) {
  await page.getByRole("button", { name: "Conversación libre", exact: true }).click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+$/);
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  return page.url().split("/").at(-1)!;
}
export async function send(page: Page, text: string) {
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  await page.getByLabel("Tu mensaje en inglés").fill(text);
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(
    page.locator(".bubble.child").filter({ has: page.getByText(text, { exact: true }) }),
  ).toBeVisible();
}
export async function bff(page: Page, path: string, method = "GET", body?: unknown) {
  return page.evaluate(
    async ({ path, method, body }) => {
      const response = await fetch(`/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", "X-TalkyTown-Request": "1" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, data: await response.json() };
    },
    { path, method, body },
  );
}
