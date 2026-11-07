import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createProfile, startFree, bff, send } from "./helpers";
import { installSpeech, recognize } from "./speech-fakes";

test("reviewed voice Animal Adventure preserves 45 XP/four badges and accessible playback", async ({
  page,
}) => {
  await installSpeech(page);
  const profile = await createProfile(page);
  await page.getByRole("button", { name: "Empezar Animal Adventure" }).click();
  await expect(page.getByRole("button", { name: "Usar micrófono" })).toBeEnabled();
  await page.getByRole("button", { name: "Escuchar respuesta" }).click();
  await expect(page.locator(".avatar-display.speaking")).toHaveCount(0);
  await page.evaluate(() => window.speechTest.audioStart());
  await expect(page.locator(".avatar-display.speaking")).toHaveCount(1);
  await page.getByRole("button", { name: "Usar micrófono" }).click();
  await expect(page.locator(".avatar-display.listening")).toHaveCount(0);
  await page.evaluate(() => {
    window.speechTest.begin();
    window.speechTest.result("dog draft");
  });
  await expect(page.locator(".avatar-display.listening")).toHaveCount(1);
  expect(await page.evaluate(() => window.speechTest.cancellations)).toBe(1);
  await page.getByRole("button", { name: "Parar y revisar" }).click();
  await expect(page.locator(".bubble.child")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("talkytown.pending.")),
    ),
  ).toHaveLength(0);
  await page.getByLabel("Tu mensaje en inglés").fill("dog");
  await page.getByRole("button", { name: "Confirmar y enviar transcripción" }).click();
  await expect(page.locator(".bubble.child")).toHaveCount(1);
  await recognize(page, "I likes dogs");
  await page.getByRole("button", { name: "Confirmar y enviar transcripción" }).click();
  await expect(page.getByText("I like dogs", { exact: true })).toBeVisible();
  await recognize(page, "cat");
  await page.getByRole("button", { name: "Confirmar y enviar transcripción" }).click();
  await expect(page.getByRole("link", { name: "Ver resumen" })).toBeVisible();
  await expect(page.locator(".conversation-heading")).toContainText("45 XP");
  const history = (await bff(page, `/conversations/sessions/${page.url().split("/").at(-1)}/turns`))
    .data;
  expect(
    history.items
      .filter((turn: { role: string }) => turn.role === "child")
      .map((turn: { inputMode: string }) => turn.inputMode),
  ).toEqual(["voice", "voice", "voice"]);
  const progress = (await bff(page, `/child-profiles/${profile}/progress`)).data;
  expect(progress.xpTotal).toBe(45);
  expect(progress.badges).toHaveLength(4);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: `test-results/voice-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("lost committed voice preserves immutable replay through navigation/reload and isolated sessions", async ({
  page,
}) => {
  await installSpeech(page);
  const profile = await createProfile(page);
  const a = await startFree(page);
  const bodies: string[] = [];
  await page.route("**/api/conversations/sessions/*/messages", async (route) => {
    bodies.push(route.request().postData() || "");
    if (bodies.length <= 2) {
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await recognize(page, "dog");
  await page.getByRole("button", { name: "Confirmar y enviar transcripción" }).click();
  await expect(page.getByRole("button", { name: "Reintentar mensaje" })).toBeVisible();
  const original = await page.evaluate(() =>
    Object.values(sessionStorage).find((value) => value.includes('"kind":"message"')),
  );
  const b = (
    await bff(page, "/conversations/sessions", "POST", {
      requestId: randomUUID(),
      childProfileId: profile,
      mode: "free-talk",
    })
  ).data.session.id;
  await page.goto(`/child/${profile}/sessions/${b}`);
  await recognize(page, "cat");
  await page.getByRole("button", { name: "Confirmar y enviar transcripción" }).click();
  await expect(page.getByRole("button", { name: "Reintentar mensaje" })).toBeVisible();
  await page.goto(`/child/${profile}/sessions/${a}`);
  await page.reload();
  await expect(page.getByRole("button", { name: "Reintentar mensaje" })).toBeVisible();
  expect(bodies).toHaveLength(2);
  expect(
    await page.evaluate((original) => Object.values(sessionStorage).includes(original!), original),
  ).toBe(true);
  await page.getByRole("button", { name: "Reintentar mensaje" }).click();
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  expect(bodies[2]).toBe(bodies[0]);
  expect(JSON.parse(bodies[2]!).inputMode).toBe("voice");
  await expect(page.locator(".bubble.child")).toHaveCount(1);
  expect((await bff(page, `/child-profiles/${profile}/progress`)).data.xpTotal).toBe(10);
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("talkytown.pending.")),
    ),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "Salir de la demostración" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("talkytown.pending.")),
    ),
  ).toHaveLength(0);
});

test("voice safety disclosure remains Spanish, manual and zero-reward after restoration", async ({
  page,
}) => {
  await installSpeech(page);
  const profile = await createProfile(page);
  const session = await startFree(page);
  await page.getByRole("combobox", { name: "Idioma del micrófono" }).selectOption("es-ES");
  await recognize(page, "nadie me quiere");
  await page.getByRole("button", { name: "Confirmar y enviar transcripción" }).click();
  await expect(
    page.getByText(/Habla con un adulto de confianza que pueda escucharte/),
  ).toBeVisible();
  await expect(page.locator(".bubble.child")).toHaveCount(0);
  expect((await bff(page, `/child-profiles/${profile}/progress`)).data.xpTotal).toBe(0);
  const turns = (await bff(page, `/conversations/sessions/${session}/turns`)).data.items;
  expect(turns.every((turn: { role: string }) => turn.role === "avatar")).toBe(true);
  await page.reload();
  await expect(page.locator(".bubble.avatar")).toHaveCount(2);
  expect(await page.evaluate(() => window.speechTest.utterances)).toHaveLength(0);
  await page
    .locator(".bubble.avatar")
    .last()
    .getByRole("button", { name: "Escuchar respuesta" })
    .click();
  expect((await page.evaluate(() => window.speechTest.utterances))[0]?.language).toBe("es-ES");
  await page.evaluate(() => window.speechTest.audioStart());
  await page.getByRole("button", { name: "Detener voz" }).click();
  await page.evaluate(() => window.speechTest.removeSpanish());
  await expect(
    page
      .locator(".bubble.avatar")
      .last()
      .getByRole("button", { name: "Volver a escuchar respuesta" }),
  ).toBeDisabled();
});

test("missing pack stays local-only until informed adult selection, which is lost on reload", async ({
  page,
}) => {
  await installSpeech(page, { unavailablePack: true });
  const profile = await createProfile(page);
  const session = await startFree(page);
  await expect(page.getByRole("button", { name: "Usar micrófono" })).toBeDisabled();
  expect(await page.evaluate(() => window.speechTest.starts)).toHaveLength(0);
  await page.getByRole("link", { name: "Adultos", exact: true }).click();
  await page.getByRole("radio", { name: /Permitir servicio del navegador/ }).check();
  await page.getByRole("link", { name: "Perfiles", exact: true }).click();
  await page.locator(`a[href="/child/${profile}"]`).click();
  await page.getByRole("button", { name: "Conversación libre", exact: true }).click();
  await expect(page.getByRole("button", { name: "Usar micrófono" })).toBeEnabled();
  await page.getByRole("button", { name: "Usar micrófono" }).click();
  expect((await page.evaluate(() => window.speechTest.starts))[0]?.local).toBe(false);
  await page.getByRole("button", { name: "Descartar voz" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Usar micrófono" })).toBeDisabled();
  await page.goto(`/child/${profile}/sessions/${session}`);
  await send(page, "dog");
});

test("permission denial, silence, discard, timeout and late callbacks preserve typing", async ({
  page,
}) => {
  await installSpeech(page);
  const profile = await createProfile(page);
  await startFree(page);
  await page.getByRole("button", { name: "Usar micrófono" }).click();
  await page.evaluate(() => window.speechTest.error("not-allowed"));
  await expect(page.getByText(/El micrófono no tiene permiso/)).toBeVisible();
  await recognize(page, " ");
  await expect(page.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled();
  await recognize(page, "a".repeat(501));
  await expect(
    page.getByRole("button", { name: "Confirmar y enviar transcripción" }),
  ).toBeDisabled();
  await page.getByLabel("Tu mensaje en inglés").fill("a".repeat(500));
  await expect(
    page.getByRole("button", { name: "Confirmar y enviar transcripción" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Descartar borrador" }).click();
  await page.clock.install();
  await page.getByRole("button", { name: "Usar micrófono" }).click();
  await page.clock.fastForward(15001);
  await expect(page.getByText(/El micrófono no empezó a tiempo/)).toBeVisible();
  await page.getByRole("button", { name: "Usar micrófono" }).click();
  await page.getByRole("link", { name: "← Mi rincón" }).click();
  await page.evaluate(() => window.speechTest.late());
  await page.goto(`/child/${profile}`);
  await startFree(page);
  await expect(page.getByLabel("Tu mensaje en inglés")).toHaveValue("");
});

test("unsupported browser API preserves complete text conversation", async ({ page }) => {
  await installSpeech(page, { unsupported: true });
  await createProfile(page);
  await startFree(page);
  await expect(page.getByRole("button", { name: "Usar micrófono" })).toBeDisabled();
  await send(page, "dog");
  await expect(page.locator(".conversation-heading")).toContainText("5 XP");
});
