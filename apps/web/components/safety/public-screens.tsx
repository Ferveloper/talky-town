"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdultIdentity } from "@talkytown/shared";
import { api, errorText } from "@/lib/api";
import { clearBrowserSession } from "@/lib/pending";
import { AvatarDisplay, FallbackStateCard, TalkyCard } from "@/components/ui/talky";
export function LandingScreen() {
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          <BookOpen aria-hidden />
          TalkyTown
        </Link>
        <nav>
          <Link href="/safety">Uso seguro</Link>
          <Link className="talky-button small" href="/login">
            Entrar
          </Link>
        </nav>
      </header>
      <main id="main-content">
        <section className="landing-hero">
          <div>
            <span className="demo-pill">Una aventura para aprender inglés</span>
            <h1>
              Pequeñas palabras.
              <br />
              <em>Grandes aventuras.</em>
            </h1>
            <p>
              Explora, conversa y descubre nuevas palabras con un acompañante amigable. Para
              exploradores de 5 a 12 años.
            </p>
            <Link className="talky-button" href="/login">
              Probar la demo <ArrowRight aria-hidden />
            </Link>
            <p className="hero-note">
              <ShieldCheck size={20} aria-hidden />
              Acceso preparado por un adulto
            </p>
          </div>
          <div className="landing-avatar">
            <span className="floating-star star-one" aria-hidden>
              ✦
            </span>
            <AvatarDisplay code="luna" />
            <span className="floating-star star-two" aria-hidden>
              ✦
            </span>
            <span className="hello-bubble" lang="en">
              Hello, explorer! 👋
            </span>
          </div>
        </section>
        <section className="page-container">
          <div className="card-grid">
            <TalkyCard>
              <Sparkles aria-hidden />
              <h2>Misiones a tu ritmo</h2>
              <p>Animales, saludos, helados y viajes al espacio.</p>
            </TalkyCard>
            <TalkyCard>
              <BookOpen aria-hidden />
              <h2>Aprender conversando</h2>
              <p>Practica por escrito y recibe ayuda amable.</p>
            </TalkyCard>
            <TalkyCard>
              <ShieldCheck aria-hidden />
              <h2>Una demo acompañada</h2>
              <p>Perfiles ficticios y configuración supervisada por un adulto.</p>
            </TalkyCard>
          </div>
          <p className="demo-notice">
            Proyecto de fin de máster · Demostración compartida. Los perfiles y sus datos son
            visibles para otros visitantes de la demo.
          </p>
        </section>
      </main>
      <footer>
        <Link href="/safety">Guía de uso seguro</Link> · TalkyTown
      </footer>
    </>
  );
}
export function LoginScreen() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  useEffect(() => {
    clearBrowserSession();
  }, []);
  async function login() {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    clearBrowserSession();
    try {
      await api<{ user: AdultIdentity }>("/auth/demo", "POST");
      router.replace("/profiles");
      router.refresh();
    } catch (e) {
      setError(errorText(e));
      guard.current = false;
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="page-container narrow login-page">
      <Link className="brand" href="/">
        <BookOpen aria-hidden />
        TalkyTown
      </Link>
      <AvatarDisplay code="luna" compact />
      <h1>Entra a la aventura</h1>
      <p>Un adulto debe preparar y acompañar esta demostración.</p>
      <TalkyCard>
        <h2>Demostración TFM</h2>
        <p>
          Esta cuenta de adulto es compartida. Todos sus visitantes pueden ver los mismos perfiles y
          progreso. Usa solamente aliases y datos ficticios.
        </p>
        <p>
          Entrar conserva el proveedor seleccionado. Un adulto puede cambiarlo explícitamente para
          las conversaciones nuevas.
        </p>
        <button className="talky-button" onClick={login} disabled={busy}>
          {busy ? "Entrando…" : "Entrar en la demo"}
        </button>
      </TalkyCard>
      {error && <FallbackStateCard text={error} />}
      <Link href="/safety" className="back-link">
        Lee la guía de uso seguro
      </Link>
    </main>
  );
}
export function SafetyScreen() {
  return (
    <main id="main-content" className="page-container narrow">
      <Link className="brand" href="/">
        <BookOpen aria-hidden />
        TalkyTown
      </Link>
      <h1>Una aventura acompañada</h1>
      <TalkyCard>
        <h2>Para pequeños exploradores</h2>
        <p>
          Usa un alias inventado. Habla de animales, juegos y aventuras. No compartas tu nombre
          completo, dirección, teléfono, colegio, ubicación ni datos privados de tu familia.
        </p>
        <p>
          Si algo te preocupa, habla con un adulto de confianza. Puedes terminar una conversación
          cuando quieras.
        </p>
      </TalkyCard>
      <TalkyCard>
        <h2>Para adultos</h2>
        <p>
          TalkyTown es una demostración educativa con perfiles ficticios y cuenta compartida. No
          ofrece privacidad entre visitantes ni supervisión humana automática. Las respuestas de IA
          pueden equivocarse.
        </p>
        <p>
          Las solicitudes no adecuadas se redirigen. Un historial que requiera revisión puede
          ocultarse hasta la recuperación administrativa. No se envían notificaciones automáticas a
          padres.
        </p>
        <p>
          La demo funciona sin claves con Mock. Los proveedores reales se configuran en el servidor
          y se prueban solo mediante una acción explícita de adulto.
        </p>
        <p>
          Antes de abrir la demo al público sin restricciones deben aislarse las cuentas de
          visitantes o restringirse el acceso.
        </p>
      </TalkyCard>
      <Link className="talky-button" href="/login">
        Entrar en la demo
      </Link>
    </main>
  );
}
