import { expect, test } from "@playwright/test";
import { createHmac } from "node:crypto";
import { createProfile, startFree, send, bff } from "./helpers";
import { execFileSync } from "node:child_process";
function historyFixture(sessionId: string, unsafe = false) {
  execFileSync(
    process.execPath,
    [
      process.env.npm_execpath!,
      "--filter",
      "@talkytown/api",
      "exec",
      "tsx",
      "test/helpers/browser-fixtures.ts",
      "history",
      sessionId,
      unsafe ? "unsafe" : "safe",
    ],
    { cwd: process.cwd(), env: process.env, stdio: "pipe", windowsHide: true },
  );
}
test("lost start response replays the same UUID without another session", async ({ page }) => {
  const profile = await createProfile(page);
  const bodies: string[] = [];
  await page.route("**/api/conversations/sessions", async (route) => {
    bodies.push(route.request().postData() || "");
    if (bodies.length === 1) {
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Conversación libre", exact: true }).click();
  await expect(page.getByRole("button", { name: "Recuperar conversación" })).toBeEnabled();
  await page.getByRole("button", { name: "Recuperar conversación" }).click();
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  expect(bodies).toHaveLength(2);
  expect(bodies[1]).toBe(bodies[0]);
  await expect(page.locator(".bubble")).toHaveCount(1);
  const progress = await bff(page, `/child-profiles/${profile}/progress`);
  expect(progress.data.recentSessions).toHaveLength(1);
  expect(progress.data.xpTotal).toBe(0);
});
test("lost committed message survives home/rewards navigation and reload; replay awards XP once", async ({
  page,
}) => {
  const profile = await createProfile(page);
  const session = await startFree(page);
  const bodies: string[] = [];
  await page.route("**/api/conversations/sessions/*/messages", async (route) => {
    bodies.push(route.request().postData() || "");
    if (bodies.length === 1) {
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByLabel("Tu mensaje en inglés").fill("dog");
  await page.getByRole("button", { name: "Enviar mensaje" }).dblclick();
  await expect(page.getByRole("button", { name: "Reintentar mensaje" })).toBeVisible();
  expect(bodies).toHaveLength(1);
  await page.getByRole("link", { name: "← Mi rincón" }).click();
  await expect(page.getByRole("button", { name: "Conversación libre", exact: true })).toBeEnabled();
  await page.getByRole("link", { name: "Mis recompensas", exact: true }).click();
  await page.goto(`/child/${profile}/sessions/${session}`);
  await page.reload();
  await expect(page.getByRole("button", { name: "Reintentar mensaje" })).toBeVisible();
  await expect(page.locator(".bubble")).toHaveCount(3);
  await page.getByRole("button", { name: "Reintentar mensaje" }).click();
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  expect(bodies[1]).toBe(bodies[0]);
  await expect(page.locator(".bubble")).toHaveCount(3);
  expect((await bff(page, `/child-profiles/${profile}/progress`)).data.xpTotal).toBe(5);
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("talkytown.pending.")),
    ),
  ).toHaveLength(0);
  await page.reload();
  await expect(page.locator(".bubble")).toHaveCount(3);
  await expect(page.locator(".celebration")).toHaveCount(0);
});
test("free talk end retry stays at 25 XP and terminal restore stays read-only", async ({
  page,
}) => {
  const profile = await createProfile(page);
  const session = await startFree(page);
  await send(page, "dog");
  await send(page, "cat");
  await send(page, "bird");
  let attempts = 0;
  await page.route("**/api/conversations/sessions/*/end", async (route) => {
    attempts++;
    if (attempts === 1) {
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Terminar conversación", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reintentar terminar" })).toBeVisible();
  await page.getByRole("button", { name: "Reintentar terminar" }).click();
  await page.getByRole("link", { name: "Ver resumen" }).click();
  await expect(page.locator(".big-xp")).toHaveText("25 XP");
  await page.reload();
  await expect(page.locator(".big-xp")).toHaveText("25 XP");
  expect(attempts).toBe(2);
  expect((await bff(page, `/child-profiles/${profile}/progress`)).data.xpTotal).toBe(25);
  expect(
    (await bff(page, `/conversations/sessions/${session}/end`, "POST")).data.completionRewardXp,
  ).toBe(10);
});

test("two sessions retain independent retries when A completes late while B is pending", async ({
  page,
}) => {
  const profile = await createProfile(page);
  const a = await startFree(page);
  let committed!: () => void;
  const aCommitted = new Promise<void>((resolve) => {
    committed = resolve;
  });
  let release!: () => void;
  const releaseA = new Promise<void>((resolve) => {
    release = resolve;
  });
  let delivered!: () => void;
  const aDelivered = new Promise<void>((resolve) => {
    delivered = resolve;
  });
  const bodies = new Map<string, string[]>();
  await page.route("**/api/conversations/sessions/*/messages", async (route) => {
    const id = route.request().url().split("/").at(-2)!;
    const attempts = bodies.get(id) || [];
    attempts.push(route.request().postData()!);
    bodies.set(id, attempts);
    if (attempts.length > 1) return route.continue();
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    if (id === a) {
      committed();
      await releaseA;
      await route.fulfill({ response });
      delivered();
    } else await route.abort("failed");
  });
  await page.getByLabel("Tu mensaje en inglés").fill("dog");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await aCommitted;
  await page.getByRole("link", { name: "← Mi rincón" }).click();
  const b = await startFree(page);
  await page.getByLabel("Tu mensaje en inglés").fill("cat");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByRole("button", { name: "Reintentar mensaje" })).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("talkytown.pending.v2:")),
    ),
  ).toHaveLength(2);
  release();
  await aDelivered;
  // B's exact stored body survives regardless of whether navigation canceled A's fetch.
  const storedB = await page.evaluate(
    (id) =>
      Object.entries(sessionStorage).find(
        ([key]) =>
          key.startsWith("talkytown.pending.v2:") &&
          JSON.parse(sessionStorage.getItem(key)!).session === id,
      )?.[1],
    b,
  );
  expect(JSON.parse(storedB!).payload).toEqual(JSON.parse(bodies.get(b)![0]!));
  await expect(page.getByRole("button", { name: "Reintentar mensaje" })).toBeVisible();
  await page.getByRole("button", { name: "Reintentar mensaje" }).click();
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  expect(bodies.get(b)![1]).toBe(bodies.get(b)![0]);
  for (const id of [a, b]) {
    const turns = (await bff(page, `/conversations/sessions/${id}/turns`)).data.items;
    expect(turns.filter((turn: { role: string }) => turn.role === "child")).toHaveLength(1);
    expect((await bff(page, `/conversations/sessions/${id}`)).data.xpEarned).toBe(5);
  }
  expect((await bff(page, `/child-profiles/${profile}/progress`)).data.xpTotal).toBe(10);
});
test("blocked personal-data and distress text stays absent and grants no learning", async ({
  page,
}) => {
  const profile = await createProfile(page);
  await startFree(page);
  for (const text of ["my phone is 612 345 678", "I want to die"]) {
    const response = page.waitForResponse(
      (r) => r.url().endsWith("/messages") && r.request().method() === "POST",
    );
    await page.getByLabel("Tu mensaje en inglés").fill(text);
    await page.getByRole("button", { name: "Enviar mensaje" }).click();
    const data = await (await response).json();
    expect(data.childTurn).toBeNull();
    expect(data.xpAwarded).toBe(0);
    expect(data.safety.flagged).toBe(true);
    await expect(page.locator(".bubble.avatar").last().locator("p").first()).toHaveText(
      data.avatarTurn.content,
    );
    await expect(page.getByText(text, { exact: true })).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        Object.keys(sessionStorage).filter((key) => key.startsWith("talkytown.pending.")),
      ),
    ).toHaveLength(0);
    await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  }
  expect((await bff(page, `/child-profiles/${profile}/progress`)).data.xpTotal).toBe(0);
});
test("restores every history page and hides all history when a later page needs review", async ({
  page,
}) => {
  await createProfile(page);
  const session = await startFree(page);
  const url = page.url();
  await historyFixture(session);
  await page.reload();
  await expect(page.locator(".bubble")).toHaveCount(52);
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeEnabled();
  // Test-owned administrative fixture only, never a production mutation endpoint.
  const profile = await createProfile(page);
  const unsafeSession = await startFree(page);
  await historyFixture(unsafeSession, true);
  await page.reload();
  await expect(page.getByText(/revisión de un administrador/)).toBeVisible();
  await expect(page.locator(".bubble")).toHaveCount(0);
  await expect(page.getByLabel("Tu mensaje en inglés")).toBeDisabled();
  await expect(page.getByText("What is your phone number?", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Terminar conversación", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ver resumen" })).toBeVisible();
  // Even another profile owned by the same adult must not display this session.
  await page.goto(url.replace(/\/child\/[^/]+\//, `/child/${profile}/`));
  await expect(page.getByRole("alert").filter({ hasText: /No se pudo/ })).toBeVisible();
  await expect(page.locator(".bubble")).toHaveCount(0);
});
test("expired authentication clears cookie and unresolved text; logout has no browser JWT", async ({
  page,
  context,
}) => {
  await createProfile(page);
  await startFree(page);
  expect(await page.evaluate(() => document.cookie)).not.toContain("talkytown_session");
  const identity = (await bff(page, "/auth/session")).data;
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: identity.id,
      role: "adult",
      iss: "talkytown-api",
      aud: "talkytown-demo",
      exp: 1,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", process.env.JWT_SECRET!)
    .update(`${header}.${payload}`)
    .digest("base64url");
  const expiredCookie = {
    name: "talkytown_session",
    value: `${header}.${payload}.${signature}`,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax" as const,
  };
  await context.addCookies([expiredCookie]);
  await page.getByLabel("Tu mensaje en inglés").fill("dog");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByText(/sesión de adulto ha caducado/)).toBeVisible();
  expect((await context.cookies()).some((cookie) => cookie.name === "talkytown_session")).toBe(
    false,
  );
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("talkytown.pending.")),
    ),
  ).toHaveLength(0);
  await page.getByRole("link", { name: "Entrar de nuevo" }).click();
  await page.getByRole("button", { name: "Entrar en la demo" }).click();
  await expect(page).toHaveURL(/profiles$/);
  // A server-rendered route can detect expiration before the browser API does.
  await page.evaluate(() => {
    sessionStorage.setItem(
      "talkytown.pending.v1",
      JSON.stringify({
        version: 1,
        owner: "fixture",
        profile: "fixture",
        session: "fixture",
        createdAt: Date.now(),
        kind: "message",
        payload: { requestId: crypto.randomUUID(), message: "dog", inputMode: "text" },
      }),
    );
  });
  await context.addCookies([expiredCookie]);
  await page.goto("/adult");
  await expect(page).toHaveURL(/login$/);
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("talkytown.pending.v1")))
    .toBeNull();
  await page.getByRole("button", { name: "Entrar en la demo" }).click();
  await expect(page).toHaveURL(/profiles$/);
  await page.getByRole("button", { name: "Salir de la demostración" }).click();
  await expect(page).toHaveURL(/login$/);
  expect((await context.cookies()).some((cookie) => cookie.name === "talkytown_session")).toBe(
    false,
  );
  expect(
    await page.evaluate(() =>
      Object.values(sessionStorage).some((value) => /accessToken|Bearer/.test(value)),
    ),
  ).toBe(false);
});
