import { acceptedPracticeEvents, type PracticeEvent } from "./gamification-rules";

export const PRACTICE_TIMEZONE = "Europe/Madrid" as const;
const calendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRACTICE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function practiceDay(at: Date): number {
  const parts = calendar.formatToParts(at);
  const part = (name: string) => Number(parts.find((value) => value.type === name)!.value);
  // UTC arithmetic operates on calendar labels, not elapsed local-day durations.
  return Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000;
}
export function practiceDays(events: readonly PracticeEvent[], asOf: Date) {
  const today = practiceDay(asOf);
  const firstByDay = new Map<number, Date>();
  for (const event of acceptedPracticeEvents(events)) {
    const day = practiceDay(event.createdAt);
    if (day > today) continue;
    const existing = firstByDay.get(day);
    if (!existing || event.createdAt < existing) firstByDay.set(day, event.createdAt);
  }
  return [...firstByDay].sort(([left], [right]) => left - right);
}
export function streakDays(events: readonly PracticeEvent[], asOf: Date): number {
  const days = practiceDays(events, asOf);
  const latest = days.at(-1)?.[0];
  if (latest === undefined || practiceDay(asOf) - latest > 1) return 0;
  let count = 1;
  for (let index = days.length - 2; index >= 0; index--) {
    if (days[index]![0] !== latest - count) break;
    count++;
  }
  return count;
}
export function threeDayAchievementAt(events: readonly PracticeEvent[], asOf: Date) {
  let previous: number | undefined;
  let run = 0;
  for (const [day, at] of practiceDays(events, asOf)) {
    run = previous === day - 1 ? run + 1 : 1;
    if (run >= 3) return at;
    previous = day;
  }
  return undefined;
}
