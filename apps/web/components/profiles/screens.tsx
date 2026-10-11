"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AvatarsResponse,
  ChildProfilesResponse,
  ChildProfileResponse,
  CreateChildProfileRequest,
  MissionsResponse,
  ProgressResponse,
  StartSessionResponse,
} from "@talkytown/shared";
import { api, ApiError, errorText } from "@/lib/api";
import { clearPending, readPending, savePending, type Pending, RETENTION_MS } from "@/lib/pending";
import { useAdult } from "@/components/layout/app-shell";
import {
  AvatarDisplay,
  FallbackStateCard,
  LoadingCard,
  MissionCard,
  ProfileCard,
  TalkyCard,
  XpProgressBar,
  StreakBadge,
} from "@/components/ui/talky";
export function ProfilesScreen() {
  const [data, setData] = useState<ChildProfilesResponse>();
  const [error, setError] = useState("");
  function load() {
    setError("");
    void api<ChildProfilesResponse>("/child-profiles")
      .then(setData)
      .catch((e) => {
        setData(undefined);
        setError(errorText(e));
      });
  }
  useEffect(load, []);
  return (
    <>
      <div className="page-title">
        <p className="eyebrow">Tu próxima aventura empieza aquí</p>
        <h1>¿Quién va a practicar?</h1>
        <p>Elige un alias ficticio para explorar TalkyTown.</p>
      </div>
      {error ? (
        <FallbackStateCard text={error} retry={load} />
      ) : !data ? (
        <LoadingCard />
      ) : (
        <div className="card-grid">
          {data.items.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
          <Link href="/profiles/new" className="talky-card add-profile">
            <span aria-hidden>＋</span>
            <h2>Nuevo perfil</h2>
            <p>Crea un pequeño explorador</p>
          </Link>
        </div>
      )}
      <p className="demo-notice">
        Los visitantes de esta demo comparten perfiles y progreso. Usa solo datos inventados.
      </p>
    </>
  );
}
export function NewProfileScreen() {
  const router = useRouter();
  const [avatars, setAvatars] = useState<AvatarsResponse>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const [form, setForm] = useState<CreateChildProfileRequest>({
    alias: "",
    age: 8,
    nativeLanguage: "es",
    targetLanguage: "en",
    learningLevel: "starter",
    avatarCode: "",
  });
  function load() {
    setError("");
    void api<AvatarsResponse>("/avatars")
      .then((data) => {
        setAvatars(data);
        setForm((f) => ({ ...f, avatarCode: data.items[0]?.code || "" }));
      })
      .catch((e) => setError(errorText(e)));
  }
  useEffect(load, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    try {
      const profile = await api<ChildProfileResponse>("/child-profiles", "POST", {
        ...form,
        alias: form.alias.trim(),
      });
      router.push(`/child/${profile.id}`);
    } catch (e) {
      setError(errorText(e));
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="narrow">
      <Link href="/profiles" className="back-link">
        ← Perfiles
      </Link>
      <h1>Crea tu explorador</h1>
      <p>Un adulto prepara este perfil. Usa un alias inventado, nunca un nombre real.</p>
      {error && <FallbackStateCard text={error} retry={!avatars ? load : undefined} />}
      {!avatars ? (
        !error && <LoadingCard />
      ) : (
        <form onSubmit={submit} className="talky-card form-stack">
          <label>
            Alias ficticio
            <input
              required
              minLength={2}
              maxLength={24}
              autoComplete="off"
              pattern="[\p{L}\p{N} _\-]+"
              value={form.alias}
              onChange={(e) => setForm({ ...form, alias: e.target.value })}
              placeholder="Por ejemplo: EstrellaAzul"
            />
          </label>
          <label>
            Edad
            <select
              value={form.age}
              onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            >
              {Array.from({ length: 8 }, (_, i) => i + 5).map((age) => (
                <option key={age} value={age}>
                  {age} años
                </option>
              ))}
            </select>
          </label>
          <label>
            Nivel de inglés
            <select
              value={form.learningLevel}
              onChange={(e) =>
                setForm({
                  ...form,
                  learningLevel: e.target.value as CreateChildProfileRequest["learningLevel"],
                })
              }
            >
              <option value="starter">Primeros pasos</option>
              <option value="explorer">Explorador</option>
              <option value="hero">Héroe</option>
            </select>
          </label>
          <p>Español → Inglés</p>
          <fieldset>
            <legend>Elige un acompañante</legend>
            <div className="avatar-choices">
              {avatars.items.map((avatar) => (
                <label
                  className={`avatar-choice ${form.avatarCode === avatar.code ? "selected" : ""}`}
                  key={avatar.code}
                >
                  <input
                    type="radio"
                    name="avatar"
                    value={avatar.code}
                    checked={form.avatarCode === avatar.code}
                    onChange={() => setForm({ ...form, avatarCode: avatar.code })}
                  />
                  <AvatarDisplay code={avatar.code} compact />
                </label>
              ))}
            </div>
          </fieldset>
          <button className="talky-button" disabled={busy || !form.avatarCode}>
            {busy ? "Creando…" : "Crear perfil"}
          </button>
        </form>
      )}
    </div>
  );
}
export function ChildHomeScreen({
  profileId,
  missionsOnly = false,
}: {
  profileId: string;
  missionsOnly?: boolean;
}) {
  const router = useRouter();
  const { adult } = useAdult();
  const [data, setData] = useState<{
    profile: ChildProfileResponse;
    progress: ProgressResponse;
    missions: MissionsResponse;
  }>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const guard = useRef(false);
  function load() {
    setError("");
    setData(undefined);
    void (async () => {
      const profile = await api<ChildProfileResponse>(`/child-profiles/${profileId}`);
      const progress = await api<ProgressResponse>(`/child-profiles/${profileId}/progress`);
      const missions = await api<MissionsResponse>(`/child-profiles/${profileId}/missions`);
      return { profile, progress, missions };
    })()
      .then(setData)
      .catch((e) => {
        setData(undefined);
        setError(errorText(e));
      });
  }
  useEffect(() => {
    load();
    try {
      setPending(readPending(sessionStorage, adult.id, profileId, "start"));
    } catch {
      setStorageWarning(true);
    }
  }, [profileId, adult.id]);
  useEffect(() => {
    if (!pending || pending.kind === "expired") return;
    const timer = setTimeout(
      () => {
        const expired: Pending = {
          version: 1,
          owner: adult.id,
          profile: profileId,
          session: "start",
          createdAt: pending.createdAt,
          kind: "expired",
        };
        savePending(expired);
        setPending(expired);
      },
      Math.max(0, pending.createdAt + RETENTION_MS - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [pending, adult.id, profileId]);
  async function start(missionCode?: string, retry?: Pending) {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    const operation: Pending = retry || {
      version: 1,
      owner: adult.id,
      profile: profileId,
      session: "start",
      createdAt: Date.now(),
      kind: "start",
      payload: {
        requestId: crypto.randomUUID(),
        childProfileId: profileId,
        mode: missionCode ? "guided-mission" : "free-talk",
        ...(missionCode ? { missionCode } : {}),
      },
    };
    if (operation.kind !== "start" || Date.now() - operation.createdAt >= RETENTION_MS) {
      guard.current = false;
      setBusy(false);
      return;
    }
    setPending(operation);
    if (!savePending(operation)) setStorageWarning(true);
    try {
      const response = await api<StartSessionResponse>(
        "/conversations/sessions",
        "POST",
        operation.payload,
      );
      clearPending();
      setPending(null);
      router.push(`/child/${profileId}/sessions/${response.session.id}`);
    } catch (e) {
      if (
        e instanceof ApiError &&
        (e.status === 401 || e.detail.code === "SAFETY_REVIEW_REQUIRED")
      ) {
        clearPending();
        setPending(null);
      }
      setError(errorText(e));
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" href="/profiles">
        ← Cambiar perfil
      </Link>
      {error && <FallbackStateCard text={error} retry={!data ? load : undefined} />}
      {storageWarning && (
        <p role="status">
          El navegador no permite guardar el intento. Mantén esta pestaña abierta para reintentar.
        </p>
      )}
      {pending?.kind === "start" && (
        <TalkyCard>
          <p>
            Hay un inicio de conversación pendiente. Reintenta el mismo intento antes de empezar
            otro.
          </p>
          <button
            className="talky-button"
            disabled={busy}
            onClick={() => void start(undefined, pending)}
          >
            Recuperar conversación
          </button>
        </TalkyCard>
      )}
      {pending?.kind === "expired" && (
        <TalkyCard>
          <p>
            El intento pendiente caducó. Se ha borrado su contenido. Revisa las conversaciones
            recientes y cierra la anterior antes de empezar otra.
          </p>
          {data?.progress.recentSessions.map((s) => (
            <p key={s.id}>
              <Link href={`/child/${profileId}/sessions/${s.id}`}>
                {s.missionCode || "Conversación libre"} · {s.status}
              </Link>
            </p>
          ))}
          <button
            className="talky-button secondary"
            onClick={() => {
              clearPending();
              setPending(null);
            }}
          >
            He revisado las conversaciones
          </button>
        </TalkyCard>
      )}
      {!data ? (
        !error && <LoadingCard />
      ) : (
        <>
          {!missionsOnly && (
            <div className="home-hero">
              <AvatarDisplay code={data.profile.avatarCode} />
              <div>
                <p className="eyebrow">Tu rincón de TalkyTown</p>
                <h1>¡Hola, {data.profile.alias}!</h1>
                <p>Una pequeña conversación, una gran aventura.</p>
                <XpProgressBar progress={data.progress} />
                <StreakBadge days={data.progress.streakDays} />
                <div className="action-row">
                  <button
                    className="talky-button"
                    disabled={busy || Boolean(pending)}
                    onClick={() => void start()}
                  >
                    Conversación libre
                  </button>
                  <Link className="talky-button secondary" href={`/child/${profileId}/rewards`}>
                    Mis recompensas
                  </Link>
                </div>
              </div>
            </div>
          )}
          <div className="section-title">
            {missionsOnly ? <h1>Elige tu misión</h1> : <h2>Misiones para ti</h2>}
            <p>Practica inglés a tu ritmo. Las recompensas se guardan al aprender.</p>
            {!missionsOnly && (
              <Link className="back-link" href={`/child/${profileId}/missions`}>
                Elegir una misión →
              </Link>
            )}
          </div>
          <div className="card-grid">
            {data.missions.items.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                busy={busy || Boolean(pending)}
                onStart={() => void start(mission.code)}
              />
            ))}
          </div>
          {!data.missions.items.length && (
            <TalkyCard>
              <p>
                No hay misiones disponibles para este perfil. Puedes practicar conversación libre.
              </p>
            </TalkyCard>
          )}
        </>
      )}
    </>
  );
}
