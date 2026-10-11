import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ token: "test-token" as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => (state.token ? { value: state.token } : undefined) }),
}));
import { POST as login } from "../app/api/auth/demo/route";
import { POST as logout } from "../app/api/auth/logout/route";
import { POST as end } from "../app/api/conversations/sessions/[sessionId]/end/route";
import { POST as testProvider } from "../app/api/ai-providers/[providerType]/test/route";
import { POST as message } from "../app/api/conversations/sessions/[sessionId]/messages/route";
import { GET as profiles } from "../app/api/child-profiles/route";
import { GET as turns } from "../app/api/conversations/sessions/[sessionId]/turns/route";
function request(
  path = "/api/auth/demo",
  options: { body?: string; origin?: string; header?: string; type?: string; method?: string } = {},
) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: options.method || "POST",
    headers: {
      Origin: options.origin ?? "http://localhost:3000",
      "X-TalkyTown-Request": options.header ?? "1",
      "Content-Type": options.type ?? "application/json",
    },
    ...(options.body === undefined ? {} : { body: options.body }),
  });
}
beforeEach(() => {
  state.token = "test-token";
  vi.stubEnv("WEB_APP_ORIGIN", "http://localhost:3000");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => Response.json({ ok: true })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("actual BFF Route Handlers", () => {
  it("accepts empty login, strips token and sets a bounded HttpOnly cookie, without provider mutations", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        accessToken: "secret-jwt",
        expiresIn: 9000,
        user: { id: "adult", role: "adult" },
      }),
    );
    const response = await login(request());
    expect(await response.json()).toEqual({
      user: { id: "adult", role: "adult" },
      expiresIn: 7200,
    });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=7200");
    expect(response.headers.get("set-cookie")).not.toContain("Secure");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toMatch(/\/auth\/demo$/);
  });
  it("sets Secure on HTTPS and forwards no adult token to public login", async () => {
    vi.stubEnv("WEB_APP_ORIGIN", "https://talky.test");
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ accessToken: "secret", expiresIn: 7200, user: { id: "adult" } }),
    );
    const response = await login(request("/api/auth/demo", { origin: "https://talky.test" }));
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.headers).not.toHaveProperty("Authorization");
  });
  it.each([
    ["https://evil.test", "1", "application/json", 403],
    ["http://localhost:3000", "", "application/json", 403],
    ["http://localhost:3000", "1", "text/plain", 415],
  ])("rejects invalid transport %s %s %s", async (origin, header, type, status) => {
    expect((await login(request("/api/auth/demo", { origin, header, type }))).status).toBe(status);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects required empty body, malformed JSON and oversized body", async () => {
    for (const body of [undefined, "{", "null", "[]", "x".repeat(17000)])
      expect(
        (await message(request("/api/messages", { body }), { params: { sessionId: "session" } }))
          .status,
      ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("supports bodyless end, provider test, and logout", async () => {
    expect((await end(request(), { params: { sessionId: "opaque-session" } })).status).toBe(200);
    expect((await testProvider(request(), { params: { providerType: "mock" } })).status).toBe(200);
    expect(vi.mocked(fetch).mock.calls.every((call) => call[1]?.body === undefined)).toBe(true);
    const response = await logout(request());
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("rejects missing auth and clears a rejected token; sanitizes backend errors", async () => {
    state.token = undefined;
    let response = await profiles(request("/api/child-profiles", { method: "GET" }));
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(fetch).not.toHaveBeenCalled();
    state.token = "expired";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ code: "UNAUTHORIZED", raw: "private" }, { status: 401 }),
    );
    response = await profiles(request("/api/child-profiles", { method: "GET" }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: "UNAUTHORIZED" });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
  it("forwards immutable UUID/body, encoded session and only allowed pagination params", async () => {
    const body = JSON.stringify({ requestId: "uuid", message: "dog", inputMode: "text" });
    await message(request("/api/message", { body }), { params: { sessionId: "a/b" } });
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain("a%2Fb/messages");
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.body).toBe(body);
    await turns(
      request("/api/turns?cursor=turn&limit=50&url=https://evil.test", { method: "GET" }),
      { params: { sessionId: "s" } },
    );
    expect(vi.mocked(fetch).mock.calls[1]?.[0]).toMatch(/turns\?cursor=turn&limit=50$/);
  });
  it("returns controlled no-store failures without rejected text", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("private provider content"));
    const response = await profiles(request("/api/child-profiles", { method: "GET" }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: "BACKEND_UNAVAILABLE" });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("uses configured operation timeout and treats an ambiguous timeout as retryable", async () => {
    vi.stubEnv("BFF_OPERATION_TIMEOUT_MS", "5");
    vi.mocked(fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () => reject(new Error("abort"))),
        ),
    );
    const response = await end(request(), { params: { sessionId: "session" } });
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ code: "BACKEND_TIMEOUT" });
  });
});
