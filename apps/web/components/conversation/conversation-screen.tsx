"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MicOff, Send, Flag } from "lucide-react";
import type {
  ChildProfileResponse,
  EndSessionResponse,
  MessageResponse,
  SessionResponse,
  TurnResponse,
  TurnsResponse,
  ProgressResponse,
} from "@talkytown/shared";
import { api, ApiError, errorText } from "@/lib/api";
import {
  celebrateOnce,
  clearPending,
  readPending,
  RETENTION_MS,
  savePending,
  type Pending,
} from "@/lib/pending";
import { useAdult } from "@/components/layout/app-shell";
import { AvatarDisplay, FallbackStateCard, LoadingCard, TalkyCard } from "@/components/ui/talky";
type Phase =
  | "restoring"
  | "ready"
  | "sending"
  | "retryable-error"
  | "auth-expired"
  | "safety-review"
  | "ending"
  | "completed"
  | "abandoned"
  | "expired";
export function ConversationBubble({ turn }: { turn: TurnResponse }) {
  return (
    <div className={`bubble ${turn.role}`}>
      <span className="bubble-author">{turn.role === "child" ? "Tú" : "Tu acompañante"}</span>
      <p lang={turn.role === "avatar" && /[áéíóúñ¿¡]/i.test(turn.content) ? "es" : "en"}>
        {turn.content}
      </p>
      {turn.correction.needed && turn.correction.corrected && (
        <div className="correction-card">
          <strong>Prueba así ✨</strong>
          <p lang="en">{turn.correction.corrected}</p>
          {turn.correction.explanation && <p>{turn.correction.explanation}</p>}
        </div>
      )}
    </div>
  );
}
function appendTurns(old: TurnResponse[], incoming: TurnResponse[]) {
  const map = new Map(old.map((t) => [t.id, t]));
  for (const turn of incoming) map.set(turn.id, turn);
  return [...map.values()];
}
export function ConversationScreen({
  profileId,
  sessionId,
}: {
  profileId: string;
  sessionId: string;
}) {
  const { adult, vocabulary } = useAdult();
  const [profile, setProfile] = useState<ChildProfileResponse>();
  const [session, setSession] = useState<SessionResponse>();
  const [turns, setTurns] = useState<TurnResponse[]>([]);
  const [phase, setPhase] = useState<Phase>("restoring");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [celebration, setCelebration] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const [endFailed, setEndFailed] = useState(false);
  const inflight = useRef(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  function failure(error: unknown) {
    if (
      error instanceof ApiError &&
      (error.detail.code === "SAFETY_REVIEW_REQUIRED" || error.status === 401)
    ) {
      setTurns([]);
      setText("");
      clearPending();
      setPending(null);
      vocabulary.delete(sessionId);
      setPhase(error.status === 401 ? "auth-expired" : "safety-review");
    } else setPhase("retryable-error");
    setError(errorText(error));
  }
  async function restore() {
    setError("");
    setTurns([]);
    setPhase("restoring");
    try {
      const [found, child] = await Promise.all([
        api<SessionResponse>(`/conversations/sessions/${sessionId}`),
        api<ChildProfileResponse>(`/child-profiles/${profileId}`),
      ]);
      if (found.childProfileId !== profileId) {
        clearPending();
        setPending(null);
        vocabulary.delete(sessionId);
        throw new ApiError(404, { code: "RESOURCE_NOT_FOUND" });
      }
      setSession(found);
      setProfile(child);
      let cursor: string | null = null;
      let loaded: TurnResponse[] = [];
      const seen = new Set<string>();
      do {
        const page: TurnsResponse = await api<TurnsResponse>(
          `/conversations/sessions/${sessionId}/turns?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        );
        loaded = appendTurns(loaded, page.items);
        cursor = page.nextCursor;
        if (cursor && seen.has(cursor)) throw new ApiError(502, { code: "INVALID_RESPONSE" });
        if (cursor) seen.add(cursor);
      } while (cursor);
      setTurns(loaded);
      let operation: Pending | null = null;
      try {
        operation = readPending(sessionStorage, adult.id, profileId, sessionId);
      } catch {
        setStorageWarning(true);
      }
      setPending(operation);
      setPhase(
        operation?.kind === "expired"
          ? "expired"
          : operation?.kind === "message"
            ? "retryable-error"
            : found.status === "active"
              ? "ready"
              : found.status,
      );
    } catch (error) {
      failure(error);
    }
  }
  useEffect(() => {
    void restore();
  }, [profileId, sessionId, adult.id]);
  useEffect(() => {
    if (!pending || pending.kind === "expired") return;
    const timer = setTimeout(
      () => {
        const expired: Pending = {
          version: 1,
          owner: adult.id,
          profile: profileId,
          session: sessionId,
          createdAt: pending.createdAt,
          kind: "expired",
        };
        savePending(expired);
        setPending(expired);
        setText("");
        setPhase("expired");
        setError(
          "El intento caducó y su texto se ha borrado. Recupera el historial y termina esta conversación antes de empezar otra.",
        );
      },
      Math.max(0, pending.createdAt + RETENTION_MS - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [pending, adult.id, profileId, sessionId]);
  useEffect(() => {
    if (nearBottom.current && transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [turns, phase]);
  useEffect(() => {
    if (phase === "ready") composer.current?.focus({ preventScroll: true });
  }, [phase]);
  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(() => setCelebration(""), 5000);
    return () => clearTimeout(timer);
  }, [celebration]);
  async function send(retry?: Pending) {
    if (inflight.current || (!retry && !text.trim())) return;
    const operation: Pending = retry || {
      version: 1,
      owner: adult.id,
      profile: profileId,
      session: sessionId,
      createdAt: Date.now(),
      kind: "message",
      payload: { requestId: crypto.randomUUID(), message: text.trim(), inputMode: "text" },
    };
    if (operation.kind !== "message" || Date.now() - operation.createdAt >= RETENTION_MS) {
      setPhase("expired");
      return;
    }
    inflight.current = true;
    setPhase("sending");
    setError("");
    setCelebration("");
    setPending(operation);
    setText("");
    if (!savePending(operation)) setStorageWarning(true);
    try {
      const response = await api<MessageResponse>(
        `/conversations/sessions/${sessionId}/messages`,
        "POST",
        operation.payload,
      );
      clearPending();
      setPending(null);
      setTurns((old) =>
        appendTurns(old, [
          ...(response.childTurn ? [response.childTurn] : []),
          response.avatarTurn,
        ]),
      );
      setSession(response.session);
      if (!response.safety.flagged) {
        vocabulary.set(sessionId, [
          ...new Set([...(vocabulary.get(sessionId) || []), ...response.practicedVocabulary]),
        ]);
        if (
          response.xpAwarded > 0 &&
          celebrateOnce(`${adult.id}:${sessionId}:message:${operation.payload.requestId}`)
        )
          setCelebration(`¡Buen trabajo! +${response.xpAwarded} XP`);
        const newBadges = response.awardedBadges.filter((code) =>
          celebrateOnce(`${adult.id}:${profileId}:badge:${code}`),
        );
        if (newBadges.length) setCelebration(`¡Nueva insignia! +${response.xpAwarded} XP`);
        if (response.session.status === "completed")
          celebrateOnce(`${adult.id}:${sessionId}:completed`);
      }
      setPhase(response.session.status === "active" ? "ready" : response.session.status);
    } catch (error) {
      failure(error);
    } finally {
      inflight.current = false;
    }
  }
  async function end() {
    if (inflight.current || (pending && pending.kind !== "expired")) return;
    inflight.current = true;
    setPhase("ending");
    setError("");
    setEndFailed(false);
    try {
      const response = await api<EndSessionResponse>(
        `/conversations/sessions/${sessionId}/end`,
        "POST",
      );
      clearPending();
      setPending(null);
      setSession(response);
      setPhase(response.status === "active" ? "ready" : response.status);
      if (response.status === "completed" && celebrateOnce(`${adult.id}:${sessionId}:completed`))
        setCelebration("¡Práctica terminada!");
    } catch (error) {
      setEndFailed(true);
      failure(error);
    } finally {
      inflight.current = false;
    }
  }
  const blocked = !["ready"].includes(phase) || Boolean(pending);
  return (
    <div className="conversation-page">
      <div className="conversation-heading">
        <Link href={`/child/${profileId}`} className="back-link">
          ← Mi rincón
        </Link>
        <h1>{session?.mode === "guided-mission" ? "Mi misión" : "Hablemos en inglés"}</h1>
        <span>{session?.xpEarned ?? 0} XP</span>
      </div>
      {phase === "restoring" ? (
        <LoadingCard />
      ) : (
        <div className="conversation-layout">
          <aside>
            <AvatarDisplay
              code={profile?.avatarCode || null}
              state={phase === "sending" ? "thinking" : celebration ? "celebrating" : "encouraging"}
            />
            <p>Usa palabras inventadas y temas divertidos. No compartas datos personales.</p>
            {session?.mode === "guided-mission" && (
              <>
                <label htmlFor="mission-progress">Progreso de la misión</label>
                <progress id="mission-progress" value={session.missionProgress} max={100} />
                <strong>{session.missionProgress}%</strong>
              </>
            )}
          </aside>
          <section className="conversation-panel" aria-label="Conversación">
            <div
              ref={transcript}
              className="transcript"
              role="log"
              aria-label="Mensajes aceptados"
              aria-live="polite"
              aria-relevant="additions"
              onScroll={() => {
                const node = transcript.current;
                if (node)
                  nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100;
              }}
            >
              {turns.map((turn) => (
                <ConversationBubble key={turn.id} turn={turn} />
              ))}
              {phase === "sending" && (
                <p className="thinking" role="status">
                  Tu acompañante está pensando…
                </p>
              )}
            </div>
            {celebration && (
              <p className="celebration" role="status">
                {celebration}
              </p>
            )}
            {error && (
              <FallbackStateCard
                text={error}
                retry={
                  phase === "retryable-error" && !pending && !endFailed
                    ? () => void restore()
                    : undefined
                }
              />
            )}
            {pending?.kind === "message" && phase !== "sending" && (
              <div className="pending-notice">
                <p>
                  Hay un mensaje pendiente. Reintentar conserva el mismo texto y evita recompensas
                  duplicadas.
                </p>
                <button
                  className="talky-button secondary"
                  disabled={inflight.current}
                  onClick={() => void send(pending)}
                >
                  Reintentar mensaje
                </button>
              </div>
            )}
            {storageWarning && (
              <p role="status">
                El intento solo está disponible en esta pestaña abierta. El almacenamiento del
                navegador no está disponible.
              </p>
            )}
            {phase === "expired" && (
              <button className="talky-button secondary" onClick={() => void restore()}>
                Recuperar historial
              </button>
            )}
            {["completed", "abandoned"].includes(phase) ? (
              <div className="terminal">
                <p>{phase === "completed" ? "¡Has terminado!" : "Conversación terminada"}</p>
                <Link
                  className="talky-button"
                  href={`/child/${profileId}/sessions/${sessionId}/summary`}
                >
                  Ver resumen
                </Link>
              </div>
            ) : (
              <form
                className="composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send();
                }}
              >
                <label htmlFor="message">Tu mensaje en inglés</label>
                <div className="composer-row">
                  <textarea
                    ref={composer}
                    id="message"
                    lang="en"
                    value={text}
                    maxLength={500}
                    disabled={blocked}
                    placeholder="Escribe aquí…"
                    rows={2}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        if (!blocked) void send();
                      }
                    }}
                  />
                  <button
                    className="talky-button"
                    type="submit"
                    disabled={blocked || !text.trim()}
                    aria-label="Enviar mensaje"
                  >
                    <Send aria-hidden />
                    <span>Enviar</span>
                  </button>
                </div>
                <div className="row between">
                  <small>{text.length}/500</small>
                  <button type="button" className="voice-placeholder" disabled>
                    <MicOff size={18} aria-hidden />
                    Voz disponible en fase 9
                  </button>
                </div>
              </form>
            )}
            {session?.status === "active" && phase !== "auth-expired" && (
              <button
                className="end-button"
                onClick={() => void end()}
                disabled={inflight.current || Boolean(pending && pending.kind !== "expired")}
              >
                <Flag size={18} aria-hidden />
                {endFailed
                  ? "Reintentar terminar"
                  : phase === "ending"
                    ? "Terminando…"
                    : "Terminar conversación"}
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
export function SessionSummaryScreen({
  profileId,
  sessionId,
}: {
  profileId: string;
  sessionId: string;
}) {
  const { vocabulary } = useAdult();
  const [data, setData] = useState<{ session: SessionResponse; progress: ProgressResponse }>();
  const [error, setError] = useState("");
  function load() {
    setError("");
    void Promise.all([
      api<SessionResponse>(`/conversations/sessions/${sessionId}`),
      api<ProgressResponse>(`/child-profiles/${profileId}/progress`),
    ])
      .then(([session, progress]) => {
        if (session.childProfileId !== profileId) {
          clearPending();
          vocabulary.delete(sessionId);
          throw new ApiError(404, { code: "RESOURCE_NOT_FOUND" });
        }
        setData({ session, progress });
      })
      .catch((e) => {
        setData(undefined);
        setError(errorText(e));
      });
  }
  useEffect(load, [profileId, sessionId]);
  if (error) return <FallbackStateCard text={error} retry={load} />;
  if (!data) return <LoadingCard />;
  const words = vocabulary.get(sessionId);
  return (
    <div className="narrow summary">
      <span className="summary-star" aria-hidden>
        ⭐
      </span>
      <h1>
        {data.session.status === "completed"
          ? "¡Buen trabajo, explorador!"
          : data.session.status === "active"
            ? "Tu práctica sigue abierta"
            : "Hasta la próxima aventura"}
      </h1>
      <p>Resumen guardado por TalkyTown</p>
      <TalkyCard>
        <h2>Esta conversación</h2>
        <p className="big-xp">{data.session.xpEarned} XP</p>
        <p>Progreso de misión: {data.session.missionProgress}%</p>
        <p>
          {data.session.status === "completed"
            ? "Completada"
            : data.session.status === "active"
              ? "Activa"
              : "Terminada sin completar"}
        </p>
        <p className="total-xp">
          Progreso total: {data.progress.xpTotal} XP · Nivel {data.progress.gamificationLevel}
        </p>
      </TalkyCard>
      {words?.length ? (
        <TalkyCard>
          <h2>Palabras practicadas en esta visita</h2>
          <div className="word-list">
            {words.map((word) => (
              <span lang="en" key={word}>
                {word}
              </span>
            ))}
          </div>
        </TalkyCard>
      ) : (
        <p>Consulta tu colección para ver el vocabulario guardado del perfil.</p>
      )}
      <div className="action-row">
        <Link href={`/child/${profileId}/rewards`} className="talky-button">
          Ver mi progreso
        </Link>
        <Link
          href={
            data.session.status === "active"
              ? `/child/${profileId}/sessions/${sessionId}`
              : `/child/${profileId}`
          }
          className="talky-button secondary"
        >
          {data.session.status === "active" ? "Continuar conversación" : "Volver a mi rincón"}
        </Link>
      </div>
    </div>
  );
}
