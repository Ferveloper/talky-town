// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import type { AdultIdentity } from "@talkytown/shared";
import { AppShell } from "../components/layout/app-shell";
import { VoicePreferences } from "../components/parent/voice-preferences";
import { clearBrowserSession } from "../lib/pending";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
afterEach(cleanup);
it("requires explicit adult selection and forgets it on identity change, logout and remount", () => {
  const adult = { id: "adult-a" } as AdultIdentity;
  const view = render(
    <AppShell adult={adult}>
      <VoicePreferences />
    </AppShell>,
  );
  const remote = () => screen.getByRole("radio", { name: /Permitir servicio/ });
  expect(remote()).not.toBeChecked();
  fireEvent.click(remote());
  expect(remote()).toBeChecked();
  view.rerender(
    <AppShell adult={{ ...adult, id: "adult-b" }}>
      <VoicePreferences />
    </AppShell>,
  );
  expect(remote()).not.toBeChecked();
  view.rerender(
    <AppShell adult={adult}>
      <VoicePreferences />
    </AppShell>,
  );
  expect(remote()).not.toBeChecked();
  fireEvent.click(remote());
  act(() => clearBrowserSession());
  expect(remote()).not.toBeChecked();
  fireEvent.click(remote());
  view.unmount();
  render(
    <AppShell adult={adult}>
      <VoicePreferences />
    </AppShell>,
  );
  expect(remote()).not.toBeChecked();
});
