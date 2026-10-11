import Link from "next/link";
import {
  Award,
  Flame,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Mic,
  MessageCircle,
  PawPrint,
  Flag,
  BadgeCheck,
} from "lucide-react";
import type { ProgressResponse, ChildProfileResponse, MissionResponse } from "@talkytown/shared";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";
export function TalkyButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn("talky-button h-auto whitespace-normal text-base", className)}
      {...props}
    />
  );
}
export function TalkyCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("talky-card", className)}>{children}</section>;
}
export function FallbackStateCard({
  text,
  retry,
  busy = false,
}: {
  text: string;
  retry?: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fallback" role="alert">
      <AlertCircle aria-hidden />
      <p>{text}</p>
      {retry && (
        <button className="talky-button secondary" onClick={retry} disabled={busy}>
          <RotateCcw size={18} aria-hidden />
          Reintentar
        </button>
      )}
      <Link href="/login">Entrar de nuevo</Link>
    </div>
  );
}
export function LoadingCard() {
  return (
    <div className="talky-card loading" role="status">
      Preparando tu aventura…
      <span className="loading-dot" aria-hidden />
    </div>
  );
}
export function AvatarDisplay({
  code,
  state = "idle",
  compact = false,
}: {
  code: string | null;
  state?: "idle" | "thinking" | "encouraging" | "celebrating";
  compact?: boolean;
}) {
  const name = code === "luna" ? "Luna" : code === "max" ? "Max" : "Acompañante";
  const labels = {
    idle: "Listo para practicar",
    thinking: "Preparando una respuesta",
    encouraging: "Vamos paso a paso",
    celebrating: "¡Buen trabajo!",
  };
  return (
    <div className={cn("avatar-display", compact && "compact", state)}>
      {code === "luna" ? (
        <img
          src="/avatars/luna.png"
          alt="Luna, un búho amigable"
          width={compact ? 88 : 200}
          height={compact ? 88 : 200}
        />
      ) : code === "max" ? (
        <img
          src="/avatars/max.png"
          alt="Max, un zorro explorador con una pequeña bandolera"
          width={compact ? 88 : 200}
          height={compact ? 88 : 200}
        />
      ) : (
        <Sparkles size={64} />
      )}
      <strong>{name}</strong>
      <span className="avatar-state" role="status">
        {labels[state]}
      </span>
    </div>
  );
}
export function StreakBadge({ days }: { days: number }) {
  return (
    <span className="streak">
      <Flame size={20} aria-hidden />
      {days} {days === 1 ? "día" : "días"} de racha
    </span>
  );
}
export function XpProgressBar({ progress }: { progress: ProgressResponse }) {
  return (
    <div className="xp-block">
      <div className="row between">
        <strong>Nivel {progress.gamificationLevel}</strong>
        <span>{progress.xpTotal} XP</span>
      </div>
      <progress
        aria-label="Progreso al siguiente nivel"
        max={progress.levelProgress.xpPerLevel}
        value={progress.levelProgress.xpIntoLevel}
      />
      <small>{progress.levelProgress.xpToNextLevel} XP para el siguiente nivel</small>
    </div>
  );
}
export function ProfileCard({ profile }: { profile: ChildProfileResponse }) {
  return (
    <Link className="talky-card profile-card" href={`/child/${profile.id}`}>
      <AvatarDisplay code={profile.avatarCode} compact />
      <h2>{profile.alias}</h2>
      <p>
        Nivel {profile.gamificationLevel} · {profile.xpTotal} XP
      </p>
      <StreakBadge days={profile.streakDays} />
      <span className="talky-button">¡Vamos a jugar!</span>
    </Link>
  );
}
export function MissionCard({
  mission,
  onStart,
  busy,
}: {
  mission: MissionResponse;
  onStart: () => void;
  busy: boolean;
}) {
  const icons: Record<string, string> = {
    "animal-adventure": "🐾",
    "meet-a-new-friend": "👋",
    "ice-cream-shop": "🍦",
    "space-explorer": "🚀",
  };
  return (
    <TalkyCard className="mission-card">
      <span className="mission-art" aria-hidden>
        {icons[mission.code] || "⭐"}
      </span>
      <h2 lang="en">{mission.title}</h2>
      <p lang="en">{mission.description}</p>
      <p className="reward-label">
        <Sparkles size={18} aria-hidden />
        {mission.estimatedXp} XP de recompensa al completar
      </p>
      <TalkyButton onClick={onStart} disabled={busy}>
        Empezar {mission.title}
      </TalkyButton>
    </TalkyCard>
  );
}
export function RewardBadgeCard({ badge }: { badge: ProgressResponse["badgeCatalog"][number] }) {
  const icons: Record<string, typeof Award> = {
    "message-circle": MessageCircle,
    mic: Mic,
    "paw-print": PawPrint,
    flag: Flag,
    flame: Flame,
    sparkles: Sparkles,
    "badge-check": BadgeCheck,
  };
  const Icon = icons[badge.icon] || Award;
  return (
    <TalkyCard className={cn("badge-card", !badge.unlocked && "locked")}>
      <Icon size={44} aria-hidden />
      <h3 lang="en">{badge.title}</h3>
      <p lang="en">{badge.description}</p>
      <span>{badge.unlocked ? "¡Conseguida!" : "Por descubrir"}</span>
    </TalkyCard>
  );
}
