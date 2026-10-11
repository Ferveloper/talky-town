import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdultIdentity } from "@talkytown/shared";
import { backendUrl, SESSION_COOKIE } from "./bff";
export async function requireAdult(): Promise<AdultIdentity> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  try {
    const response = await fetch(backendUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 401) redirect("/login");
    if (!response.ok) throw new Error("BACKEND_UNAVAILABLE");
    return (await response.json()) as AdultIdentity;
  } catch (error) {
    if (error instanceof Error && error.message === "BACKEND_UNAVAILABLE") throw error;
    // Next redirects must propagate, including their framework digest.
    if (error && typeof error === "object" && "digest" in error) throw error;
    throw new Error("El servidor no está disponible. Vuelve a intentarlo en unos instantes.");
  }
}
