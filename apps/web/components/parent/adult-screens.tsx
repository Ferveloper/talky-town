"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  ChildProfilesResponse,
  ChildProfileResponse,
  ProgressResponse,
} from "@talkytown/shared";
import { api, errorText } from "@/lib/api";
import { VoicePreferences } from "./voice-preferences";
import {
  FallbackStateCard,
  LoadingCard,
  TalkyCard,
  XpProgressBar,
  StreakBadge,
  RewardBadgeCard,
} from "@/components/ui/talky";
const proficiency = { starter: "Primeros pasos", explorer: "Explorador", hero: "Héroe" };
export function AdultDashboard() {
  const [items, setItems] =
    useState<{ profile: ChildProfileResponse; progress: ProgressResponse }[]>();
  const [error, setError] = useState("");
  function load() {
    setItems(undefined);
    setError("");
    void api<ChildProfilesResponse>("/child-profiles")
      .then(async (profiles) => {
        const loaded = [];
        for (const profile of profiles.items)
          loaded.push({
            profile,
            progress: await api<ProgressResponse>(`/child-profiles/${profile.id}/progress`),
          });
        return loaded;
      })
      .then(setItems)
      .catch((e) => setError(errorText(e)));
  }
  useEffect(load, []);
  return (
    <>
      <div className="row between">
        <div>
          <p className="eyebrow">Zona de adultos</p>
          <h1>Un vistazo a sus aventuras</h1>
        </div>
        <Link href="/adult/ai-settings" className="talky-button secondary">
          Configurar IA
        </Link>
      </div>
      <p>Perfiles y progreso compartidos de una demostración con datos ficticios.</p>
      <VoicePreferences />
      {error ? (
        <FallbackStateCard text={error} retry={load} />
      ) : !items ? (
        <LoadingCard />
      ) : !items.length ? (
        <TalkyCard>
          <p>Aún no hay perfiles. Prepara un explorador para empezar.</p>
          <Link className="talky-button" href="/profiles/new">
            Crear perfil
          </Link>
        </TalkyCard>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat">
              <strong>{items.length}</strong>Perfiles
            </div>
            <div className="stat">
              <strong>{items.reduce((sum, i) => sum + i.progress.xpTotal, 0)}</strong>XP total
            </div>
            <div className="stat">
              <strong>{items.reduce((sum, i) => sum + i.progress.completedSessions, 0)}</strong>
              Conversaciones completadas
            </div>
          </div>
          <TalkyCard>
            <h2>Progreso por perfil</h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Alias</th>
                    <th>Inglés</th>
                    <th>Nivel de juego</th>
                    <th>XP</th>
                    <th>Racha</th>
                    <th>Misiones distintas</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ profile, progress }) => (
                    <tr key={profile.id}>
                      <td>
                        <Link href={`/adult/profiles/${profile.id}`}>{profile.alias}</Link>
                      </td>
                      <td>{proficiency[profile.learningLevel]}</td>
                      <td>{progress.gamificationLevel}</td>
                      <td>{progress.xpTotal}</td>
                      <td>{progress.streakDays} días</td>
                      <td>{progress.completedMissionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TalkyCard>
        </>
      )}
      <p className="demo-notice">
        La demo no incluye cuentas privadas de visitantes, avisos automáticos a padres ni análisis
        de todo el historial.
      </p>
    </>
  );
}
export function AdultProfileScreen({ profileId }: { profileId: string }) {
  const [data, setData] = useState<{ profile: ChildProfileResponse; progress: ProgressResponse }>();
  const [error, setError] = useState("");
  function load() {
    setData(undefined);
    setError("");
    void Promise.all([
      api<ChildProfileResponse>(`/child-profiles/${profileId}`),
      api<ProgressResponse>(`/child-profiles/${profileId}/progress`),
    ])
      .then(([profile, progress]) => setData({ profile, progress }))
      .catch((e) => setError(errorText(e)));
  }
  useEffect(load, [profileId]);
  return (
    <>
      <Link className="back-link" href="/adult">
        ← Zona de adultos
      </Link>
      {error ? (
        <FallbackStateCard text={error} retry={load} />
      ) : !data ? (
        <LoadingCard />
      ) : (
        <>
          <h1>Progreso de {data.profile.alias}</h1>
          <p>Nivel de inglés: {proficiency[data.profile.learningLevel]} · Español → Inglés</p>
          <TalkyCard>
            <XpProgressBar progress={data.progress} />
            <StreakBadge days={data.progress.streakDays} />
            <p>
              {data.progress.completedSessions} conversaciones completadas ·{" "}
              {data.progress.completedMissionCount} misiones distintas
            </p>
            <p>
              Última práctica:{" "}
              {data.progress.lastPracticedAt
                ? new Date(data.progress.lastPracticedAt).toLocaleString("es-ES", {
                    timeZone: "Europe/Madrid",
                  })
                : "Todavía no ha practicado"}
            </p>
          </TalkyCard>
          <h2 className="section-title">Insignias</h2>
          <div className="card-grid">
            {data.progress.badgeCatalog.map((badge) => (
              <RewardBadgeCard key={badge.code} badge={badge} />
            ))}
          </div>
          <h2 className="section-title">Vocabulario del perfil</h2>
          <TalkyCard>
            {data.progress.vocabulary.length ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Palabra</th>
                      <th>Prácticas</th>
                      <th>Usos correctos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.progress.vocabulary.map((word) => (
                      <tr key={word.id}>
                        <td lang="en">{word.term}</td>
                        <td>{word.practiceCount}</td>
                        <td>{word.successfulUseCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aún no hay vocabulario guardado.</p>
            )}
          </TalkyCard>
          <h2 className="section-title">Diez conversaciones recientes</h2>
          <TalkyCard>
            {data.progress.recentSessions.length ? (
              data.progress.recentSessions.map((session) => (
                <p key={session.id}>
                  <Link href={`/child/${profileId}/sessions/${session.id}/summary`}>
                    {session.missionCode || "Conversación libre"} · {session.status} ·{" "}
                    {session.xpEarned} XP
                  </Link>
                  {session.status === "active" && (
                    <>
                      {" "}
                      ·{" "}
                      <Link href={`/child/${profileId}/sessions/${session.id}`}>
                        Abrir para terminar
                      </Link>
                    </>
                  )}
                </p>
              ))
            ) : (
              <p>No hay conversaciones todavía.</p>
            )}
            <small>
              El backend devuelve hasta diez sesiones. Puedes abrir otras si conoces su enlace.
            </small>
          </TalkyCard>
        </>
      )}
    </>
  );
}
