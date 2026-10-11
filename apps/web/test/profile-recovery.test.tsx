// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../lib/api";
import { NewProfileScreen } from "../components/profiles/screens";
const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("../components/layout/app-shell", () => ({ useAdult: () => ({ adult: { id: "adult" } }) }));
vi.mock("../lib/api", async (original) => ({
  ...(await original<typeof import("../lib/api")>()),
  api: vi.fn(),
}));
const submitted = {
  alias: "Star",
  age: 8,
  nativeLanguage: "es",
  targetLanguage: "en",
  learningLevel: "starter",
  avatarCode: "luna",
};
const candidate = { ...submitted, id: "owned-profile" };
beforeEach(() => {
  vi.mocked(api).mockClear();
  navigation.push.mockClear();
  sessionStorage.clear();
});
afterEach(cleanup);
async function create(matches: unknown[], code = "BACKEND_UNAVAILABLE") {
  vi.mocked(api).mockImplementation(((path: string, method?: string) => {
    if (path === "/avatars") return Promise.resolve({ items: [{ code: "luna", name: "Luna" }] });
    if (method === "POST") return Promise.reject(new ApiError(503, { code }));
    return Promise.resolve({ items: matches });
  }) as typeof api);
  render(<NewProfileScreen />);
  const input = await screen.findByLabelText("Alias ficticio");
  fireEvent.change(input, { target: { value: " Star " } });
  fireEvent.click(screen.getByRole("button", { name: "Crear perfil" }));
}
describe("ambiguous owned profile creation", () => {
  it("a failed lookup offers only an explicit GET recheck and never repeats creation", async () => {
    await create([]);
    await screen.findByText(/No hemos encontrado un perfil/);
    vi.mocked(api).mockRejectedValueOnce(new ApiError(503, { code: "BACKEND_UNAVAILABLE" }));
    fireEvent.click(screen.getByRole("button", { name: "Comprobar de nuevo" }));
    await screen.findByText(/No podemos conectar/);
    expect(screen.queryByRole("button", { name: "Usar este perfil" })).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(vi.mocked(api).mock.calls.filter((call) => call[1] === "POST")).toHaveLength(1);
  });
  it("requires explicit confirmation even when an exact shared-demo match exists", async () => {
    await create([candidate]);
    fireEvent.click(await screen.findByRole("button", { name: "Comprobar de nuevo" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Usar este perfil" })).toBeEnabled(),
    );
    expect(navigation.push).not.toHaveBeenCalled();
    expect(vi.mocked(api).mock.calls.filter((call) => call[1] === "POST")).toHaveLength(1);
    expect(screen.getByLabelText("Alias ficticio")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Usar este perfil" }));
    expect(navigation.push).toHaveBeenCalledWith("/child/owned-profile");
    expect(sessionStorage.length).toBe(0);
  });
  it.each([
    ["alias", "Other"],
    ["age", 9],
    ["nativeLanguage", "fr"],
    ["targetLanguage", "de"],
    ["learningLevel", "hero"],
    ["avatarCode", "max"],
  ])("does not recover a profile with a different %s", async (field, value) => {
    await create([{ ...candidate, [field]: value }]);
    await screen.findByText(/No hemos encontrado un perfil/);
    expect(screen.queryByRole("button", { name: "Usar este perfil" })).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(vi.mocked(api).mock.calls.filter((call) => call[1] === "POST")).toHaveLength(1);
  });
  it.each(["BACKEND_TIMEOUT", "INVALID_RESPONSE"])("recovers ambiguous %s", async (code) => {
    await create([candidate], code);
    await screen.findByRole("button", { name: "Usar este perfil" });
    expect(navigation.push).not.toHaveBeenCalled();
  });
  it("preserves uniqueness failures without querying or repeating the POST", async () => {
    await create([candidate], "RESOURCE_CONFLICT");
    await screen.findByText(/Ese alias ya existe/);
    expect(api).not.toHaveBeenCalledWith("/child-profiles");
    expect(navigation.push).not.toHaveBeenCalled();
  });
  it("a late owned-profile lookup cannot navigate after unmount", async () => {
    let resolve!: (data: unknown) => void;
    const late = new Promise((r) => {
      resolve = r;
    });
    vi.mocked(api).mockImplementation(((path: string, method?: string) =>
      path === "/avatars"
        ? Promise.resolve({ items: [{ code: "luna", name: "Luna" }] })
        : method === "POST"
          ? Promise.reject(new ApiError(504, { code: "BACKEND_TIMEOUT" }))
          : late) as typeof api);
    const view = render(<NewProfileScreen />);
    fireEvent.change(await screen.findByLabelText("Alias ficticio"), { target: { value: "Star" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear perfil" }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/child-profiles"));
    view.unmount();
    await act(async () => resolve({ items: [candidate] }));
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
