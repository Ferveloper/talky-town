import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { createProfile, startFree, send, bff } from "./helpers";
let server: Server;
let state: "safe" | "unsafe" | "failure" = "safe";
const models: string[] = [];
test.beforeAll(async () => {
  server = createServer((request, response) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      const body = JSON.parse(raw);
      models.push(body.model);
      if (state === "failure") {
        response.writeHead(503, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "scripted fixture unavailable" }));
        return;
      }
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          choices: [
            {
              index: 0,
              finish_reason: "stop",
              message: {
                role: "assistant",
                content: JSON.stringify({
                  reply:
                    state === "unsafe" ? "What is your phone number?" : "Let's talk about animals.",
                  newVocabulary: [],
                  avatarEmotion: "happy",
                  safety: { flagged: false },
                }),
              },
            },
          ],
        }),
      );
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(1234, "127.0.0.1", resolve);
  });
});
test.afterAll(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
});
test.afterEach(async ({ page }) => {
  state = "safe";
  if (test.info().project.name === "desktop")
    await bff(page, "/ai-providers/active", "PUT", { providerType: "mock" });
});
test("adult saves, tests and activates separately; login preserves selection and sessions stay pinned", async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== "desktop",
    "Provider adapter scenario runs once; child/responsive journeys cover every viewport.",
  );
  const mockProfile = await createProfile(page);
  const mockSession = await startFree(page);
  const mockUrl = page.url();
  await page.goto("/adult/ai-settings");
  const local = page.locator(".provider-card").filter({
    has: page.getByRole("heading", { name: "Servidor local compatible con OpenAI", exact: true }),
  });
  await local.getByLabel("Dirección de local-openai-compatible").fill("http://127.0.0.1:1234/v1");
  await local.getByLabel("Modelo de local-openai-compatible").fill("fixture-alpha");
  await local.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(
    page.getByText("Configuración guardada. La selección del proveedor no ha cambiado."),
  ).toBeVisible();
  expect(models).toHaveLength(0);
  expect((await bff(page, "/ai-providers")).data.activeProvider).toBe("mock");
  await local.getByRole("button", { name: "Probar Servidor local compatible con OpenAI" }).click();
  await expect(local.getByText(/Disponible en la última prueba: fixture-alpha/)).toBeVisible();
  expect(models).toEqual(["fixture-alpha"]);
  expect((await bff(page, "/ai-providers")).data.activeProvider).toBe("mock");
  await page
    .getByRole("combobox", { name: "Elegir proveedor" })
    .selectOption("local-openai-compatible");
  await page.getByRole("button", { name: "Activar para nuevas conversaciones" }).click();
  await expect(page.getByText(/Proveedor activado para conversaciones nuevas/)).toBeVisible();
  // Login is intentionally exercised while Local is selected.
  const localProfile = await createProfile(page);
  expect((await bff(page, "/ai-providers")).data.activeProvider).toBe("local-openai-compatible");
  const localSession = await startFree(page);
  const localUrl = page.url();
  expect((await bff(page, `/conversations/sessions/${localSession}`)).data).toMatchObject({
    aiProviderType: "local-openai-compatible",
    aiModel: "fixture-alpha",
  });
  await page.goto(mockUrl);
  await send(page, "dog");
  expect((await bff(page, `/conversations/sessions/${mockSession}`)).data.aiProviderType).toBe(
    "mock",
  );
  expect(models).toHaveLength(1);
  await page.goto("/adult/ai-settings");
  await local.getByLabel("Modelo de local-openai-compatible").fill("fixture-beta");
  await local.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByText(/Configuración guardada/)).toBeVisible();
  expect((await bff(page, `/conversations/sessions/${localSession}`)).data.aiModel).toBe(
    "fixture-alpha",
  );
  state = "unsafe";
  await page.goto(localUrl);
  await page.getByLabel("Tu mensaje en inglés").fill("cat");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  await expect(page.getByText("What is your phone number?", { exact: true })).toHaveCount(0);
  await expect(page.locator(".bubble.child")).toHaveCount(0);
  expect((await bff(page, `/child-profiles/${localProfile}/progress`)).data.xpTotal).toBe(0);
  state = "failure";
  await page.getByLabel("Tu mensaje en inglés").fill("dog");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByRole("button", { name: "Reintentar mensaje" })).toBeVisible();
  await expect(page.locator(".bubble.child")).toHaveCount(0);
  expect((await bff(page, "/ai-providers")).data.activeProvider).toBe("local-openai-compatible");
  // Explicit selection change still cannot silently replace the provider pinned to this retry.
  expect((await bff(page, "/ai-providers/active", "PUT", { providerType: "mock" })).status).toBe(
    200,
  );
  state = "safe";
  await page.getByRole("button", { name: "Reintentar mensaje" }).click();
  await expect(page.locator(".bubble.child")).toHaveCount(1);
  expect(models.at(-1)).toBe("fixture-alpha");
  expect((await bff(page, `/child-profiles/${localProfile}/progress`)).data.xpTotal).toBe(5);
  await page.goto("/adult/ai-settings");
  await local.getByLabel("Dirección de local-openai-compatible").fill("http://127.0.0.1:11434/v1");
  await local.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByText(/Hay conversaciones activas con esta dirección/)).toBeVisible();
  expect((await bff(page, `/child-profiles/${mockProfile}/progress`)).data.xpTotal).toBe(5);
  await expect(page.getByRole("textbox", { name: /clave|api.?key/i })).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});
