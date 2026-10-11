"use client";
import { createContext, useContext, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, ShieldCheck, Users } from "lucide-react";
import type { AdultIdentity } from "@talkytown/shared";
import { api, errorText } from "@/lib/api";
import { clearBrowserSession, sweepPending } from "@/lib/pending";
type AppState = { adult: AdultIdentity; vocabulary: Map<string, string[]> };
const Context = createContext<AppState | null>(null);
export function useAdult() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing authenticated layout");
  return context;
}
export function AppShell({ adult, children }: { adult: AdultIdentity; children: React.ReactNode }) {
  const router = useRouter();
  const vocabulary = useRef(new Map<string, string[]>()).current;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      sweepPending(sessionStorage, Date.now(), adult.id);
    } catch {
      /* Storage unavailable. */
    }
    vocabulary.clear();
  }, [adult.id, vocabulary]);
  useEffect(() => {
    const clear = () => vocabulary.clear();
    window.addEventListener("talkytown:auth-expired", clear);
    return () => window.removeEventListener("talkytown:auth-expired", clear);
  }, [vocabulary]);
  async function logout() {
    setBusy(true);
    clearBrowserSession();
    vocabulary.clear();
    try {
      await api("/auth/logout", "POST");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setError(errorText(error));
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ adult, vocabulary }}>
      <header className="site-header">
        <Link className="brand" href="/profiles">
          <BookOpen aria-hidden />
          TalkyTown<span className="demo-pill">Demo TFM</span>
        </Link>
        <nav aria-label="Navegación principal">
          <Link href="/profiles" aria-label="Perfiles">
            <Users size={20} aria-hidden />
            <span>Perfiles</span>
          </Link>
          <Link href="/adult" aria-label="Adultos">
            <ShieldCheck size={20} aria-hidden />
            <span>Adultos</span>
          </Link>
          <button
            className="nav-button"
            onClick={logout}
            disabled={busy}
            aria-label="Salir de la demostración"
          >
            <LogOut size={20} aria-hidden />
            <span>Salir</span>
          </button>
        </nav>
      </header>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <main id="main-content" className="page-container">
        {children}
      </main>
      <footer>
        Demostración compartida con datos ficticios · <Link href="/safety">Uso seguro</Link>
      </footer>
    </Context.Provider>
  );
}
