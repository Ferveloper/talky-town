"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProgressResponse } from "@talkytown/shared";
import { api, errorText } from "@/lib/api";
import {
  FallbackStateCard,
  LoadingCard,
  RewardBadgeCard,
  StreakBadge,
  TalkyCard,
  XpProgressBar,
} from "@/components/ui/talky";
export function RewardsScreen({ profileId }: { profileId: string }) {
  const [data, setData] = useState<ProgressResponse>();
  const [error, setError] = useState("");
  function load() {
    setData(undefined);
    setError("");
    void api<ProgressResponse>(`/child-profiles/${profileId}/progress`)
      .then(setData)
      .catch((e) => setError(errorText(e)));
  }
  useEffect(load, [profileId]);
  return (
    <>
      <Link className="back-link" href={`/child/${profileId}`}>
        ← Mi rincón
      </Link>
      <div className="page-title">
        <p className="eyebrow">Cada palabra cuenta</p>
        <h1>Mi colección de aventuras</h1>
        <p>Tu aprendizaje, paso a paso.</p>
      </div>
      {error ? (
        <FallbackStateCard text={error} retry={load} />
      ) : !data ? (
        <LoadingCard />
      ) : (
        <>
          <TalkyCard>
            <XpProgressBar progress={data} />
            <StreakBadge days={data.streakDays} />
            <p>
              Las rachas cuentan los días de práctica en Madrid. Puedes volver a empezar siempre.
            </p>
          </TalkyCard>
          <h2 className="section-title">Mis insignias</h2>
          <div className="card-grid">
            {data.badgeCatalog.map((badge) => (
              <RewardBadgeCard badge={badge} key={badge.code} />
            ))}
          </div>
          <h2 className="section-title">Palabras que voy practicando</h2>
          <TalkyCard>
            {data.vocabulary.length ? (
              <div className="word-list">
                {data.vocabulary.map((word) => (
                  <span lang="en" key={word.id}>
                    {word.term}
                  </span>
                ))}
              </div>
            ) : (
              <p>Tu primera palabra está por descubrir. ¡Empieza una conversación!</p>
            )}
          </TalkyCard>
          <h2 className="section-title">Mis aventuras recientes</h2>
          <TalkyCard>
            {data.recentSessions.length ? (
              data.recentSessions.map((session) => (
                <p key={session.id}>
                  <Link href={`/child/${profileId}/sessions/${session.id}`}>
                    {session.missionCode || "Conversación libre"} ·{" "}
                    {session.status === "active" ? "Continuar" : "Ver conversación"} ·{" "}
                    {session.xpEarned} XP
                  </Link>
                </p>
              ))
            ) : (
              <p>Aquí aparecerán tus conversaciones.</p>
            )}
            <small>Hasta las diez conversaciones más recientes.</small>
          </TalkyCard>
        </>
      )}
    </>
  );
}
