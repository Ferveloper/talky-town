"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, Flag } from "lucide-react";
import { safetyResponseLocale } from "@talkytown/shared";
import { useSpeechInput } from "./use-speech-input";
import { useSpeechOutput } from "./use-speech-output";
import { MicrophoneControl } from "./microphone-control";
import { SpeechOutputControls } from "./speech-output-controls";
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
  expirePending,
  readPending,
  RETENTION_MS,
  savePending,
  type Pending,
} from "@/lib/pending";
import { useOperationScope } from "@/lib/use-operation-scope";
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
export function ConversationBubble({
  turn,
  children,
}: {
  turn: TurnResponse;
  children?: React.ReactNode;
}) {
  return (
    <div className={`bubble ${turn.role}`}>
      <span className="bubble-author">{turn.role === "child" ? "Tú" : "Tu acompañante"}</span>
      <p lang={turn.role === "avatar" ? safetyResponseLocale(turn.content) || "en" : "en"}>
        {turn.content}
      </p>
      {turn.correction.needed && turn.correction.corrected && (
        <div className="correction-card">
          <strong>Prueba así ✨</strong>
          <p lang="en">{turn.correction.corrected}</p>
          {turn.correction.explanation && <p>{turn.correction.explanation}</p>}
        </div>
      )}
      {children}
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
  const { adult } = useAdult();
  return (
    <ScopedConversation
      key={`${adult.id}:${profileId}:${sessionId}`}
      profileId={profileId}
      sessionId={sessionId}
    />
  );
}
function ScopedConversation({ profileId, sessionId }: { profileId: string; sessionId: string }) {
  const { adult, vocabulary, recognitionMode = "local-only" } = useAdult();
  const [profile, setProfile] = useState<ChildProfileResponse>();
  const [session, setSession] = useState<SessionResponse>();
  const [turns, setTurns] = useState<TurnResponse[]>([]);
  const [phase, setPhase] = useState<Phase>("restoring");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [pending, setPending] = useState<Pending | null>(null);
  const [celebration, setCelebration] = useState("");
  const [badgeCelebration, setBadgeCelebration] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const [endFailed, setEndFailed] = useState(false);
  const inflight = useRef(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const output = useSpeechOutput(profile?.avatarCode || "luna");
  const input = useSpeechInput(recognitionMode, phase === "ready" && !pending, (value) => {
    if (value || inputMode === "voice") {
      setText(value);
      setInputMode(value ? "voice" : "text");
    }
  });
  function discardDraft() {
    input.cancel();
    setText("");
    setInputMode("text");
  }
  useEffect(() => {
    if (phase !== "ready") {
      input.cancel();
      output.cancel();
    }
  }, [phase, input.cancel, output.cancel]);
  useEffect(() => {
    setText("");
    setInputMode("text");
  }, [recognitionMode]);
  const capture = useOperationScope(`${adult.id}:${profileId}:${sessionId}`, () => {
    setTurns([]);
    setText("");
    setPending(null);
    setCelebration("");
    setBadgeCelebration("");
    setPhase("auth-expired");
    setError(errorText(new ApiError(401, { code: "UNAUTHORIZED" })));
  });
  function discardPending() {
    const operation = readPending(sessionStorage, adult.id, profileId, sessionId);
    if (operation) clearPending(operation);
  }
  function failure(error: unknown, operation?: Pending) {
    if (
      error instanceof ApiError &&
      (error.detail.code === "SAFETY_REVIEW_REQUIRED" || error.status === 401)
    ) {
      setTurns([]);
      setText("");
      if (operation) clearPending(operation);
      else discardPending();
      setPending(null);
      vocabulary.delete(sessionId);
      setPhase(error.status === 401 ? "auth-expired" : "safety-review");
    } else setPhase("retryable-error");
    setError(errorText(error));
  }
  async function restore() {
    const current = capture();
    setError("");
    setTurns([]);
    setPhase("restoring");
    try {
      const [found, child] = await Promise.all([
        api<SessionResponse>(`/conversations/sessions/${sessionId}`),
        api<ChildProfileResponse>(`/child-profiles/${profileId}`),
      ]);
      if (!current()) return;
      if (found.childProfileId !== profileId) {
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
        if (!current()) return;
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
      if (current()) failure(error);
    }
  }
  useEffect(() => {
    void restore();
  }, [profileId, sessionId, adult.id]);
  useEffect(() => {
    if (!pending || pending.kind === "expired") return;
    const timer = setTimeout(
      () => {
        const expired = expirePending(pending);
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
    if (!celebration && !badgeCelebration) return;
    const timer = setTimeout(() => {
      setCelebration("");
      setBadgeCelebration("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [celebration, badgeCelebration]);
  async function send(retry?: Pending) {
    const current = capture();
    if (
      inflight.current ||
      (!retry &&
        (phase !== "ready" || pending || input.busy || !text.trim() || text.trim().length > 500))
    )
      return;
    const operation: Pending = retry || {
      version: 1,
      owner: adult.id,
      profile: profileId,
      session: sessionId,
      createdAt: Date.now(),
      kind: "message",
      payload: { requestId: crypto.randomUUID(), message: text.trim(), inputMode },
    };
    if (operation.kind !== "message" || Date.now() - operation.createdAt >= RETENTION_MS) {
      setPhase("expired");
      return;
    }
    Object.freeze(operation.payload);
    Object.freeze(operation);
    inflight.current = true;
    input.cancel();
    output.cancel();
    setPhase("sending");
    setError("");
    setCelebration("");
    setBadgeCelebration("");
    setPending(operation);
    setText("");
    setInputMode("text");
    if (!savePending(operation)) setStorageWarning(true);
    try {
      const response = await api<MessageResponse>(
        `/conversations/sessions/${sessionId}/messages`,
        "POST",
        operation.payload,
      );
      clearPending(operation);
      if (!current()) return;
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
        if (newBadges.length) setBadgeCelebration("¡Nueva insignia!");
        if (response.session.status === "completed")
          celebrateOnce(`${adult.id}:${sessionId}:completed`);
      }
      setPhase(response.session.status === "active" ? "ready" : response.session.status);
    } catch (error) {
      if (current()) failure(error, operation);
    } finally {
      inflight.current = false;
    }
  }
  async function end() {
    const current = capture();
    if (inflight.current || (pending && pending.kind !== "expired")) return;
    discardDraft();
    output.cancel();
    inflight.current = true;
    setPhase("ending");
    setError("");
    setEndFailed(false);
    try {
      const response = await api<EndSessionResponse>(
        `/conversations/sessions/${sessionId}/end`,
        "POST",
      );
      if (pending) clearPending(pending);
      if (!current()) return;
      setPending(null);
      setSession(response);
      setPhase(response.status === "active" ? "ready" : response.status);
      if (response.status === "completed" && celebrateOnce(`${adult.id}:${sessionId}:completed`))
        setCelebration("¡Práctica terminada!");
    } catch (error) {
      if (!current()) return;
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
              state={
                input.phase === "listening"
                  ? "listening"
                  : output.phase === "speaking"
                    ? "speaking"
                    : phase === "sending"
                      ? "thinking"
                      : celebration || badgeCelebration
                        ? "celebrating"
                        : "encouraging"
              }
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
                <ConversationBubble key={turn.id} turn={turn}>
                  {turn.role === "avatar" && (
                    <SpeechOutputControls
                      turn={turn}
                      output={output}
                      disabled={input.busy || !["ready", "completed", "abandoned"].includes(phase)}
                    />
                  )}
                </ConversationBubble>
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
            {badgeCelebration && (
              <p className="celebration" role="status">
                {badgeCelebration}
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
                    lang={inputMode === "voice" ? input.language : "en"}
                    value={text}
                    maxLength={500}
                    disabled={blocked || input.busy}
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
                    disabled={blocked || input.busy || !text.trim() || text.trim().length > 500}
                    aria-label={
                      inputMode === "voice" ? "Confirmar y enviar transcripción" : "Enviar mensaje"
                    }
                  >
                    <Send aria-hidden />
                    <span>{inputMode === "voice" ? "Confirmar y enviar" : "Enviar"}</span>
                  </button>
                </div>
                <div className="row between">
                  <small>{text.length}/500</small>
                  {text && (
                    <button
                      type="button"
                      className="text-button"
                      disabled={blocked}
                      onClick={discardDraft}
                    >
                      Descartar borrador
                    </button>
                  )}
                </div>
                {inputMode === "voice" && (
                  <p role="status">
                    Revisa y edita la transcripción antes de confirmar. No se envía automáticamente.
                  </p>
                )}
                {text.length > 500 && (
                  <p role="alert">Acorta la transcripción a 500 caracteres para enviarla.</p>
                )}
                {text && <small>Envía o descarta el borrador antes de usar el micrófono.</small>}
                <MicrophoneControl
                  input={input}
                  disabled={blocked || Boolean(text)}
                  discard={discardDraft}
                />
                <small>
                  Si la voz no está disponible, sigue escribiendo. Un adulto puede revisar el
                  procesamiento en <Link href="/adult">la zona de adultos</Link>.
                </small>
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
