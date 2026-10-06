import { initialMissions, normalizeVocabularyTerm } from "@talkytown/shared";

type DemoTurn = {
  role: "child" | "avatar";
  content: string;
  xpAwarded: number;
  correctedContent?: string;
  correctionExplanation?: string;
};

type DemoSession = {
  key: string;
  alias: string;
  avatarCode: string;
  missionCode?: string;
  startedAt: Date;
  endedAt: Date;
  completionXp: number;
  turns: DemoTurn[];
};

function missionReward(code: string): number {
  const mission = initialMissions.find((item) => item.code === code);
  if (!mission) throw new Error(`Unknown demo mission: ${code}`);
  return mission.estimatedXp;
}

export const demoSessions: DemoSession[] = [
  {
    key: "greetings",
    alias: "Sofia",
    avatarCode: "luna",
    startedAt: new Date("2026-05-16T16:00:00.000Z"),
    endedAt: new Date("2026-05-16T16:04:00.000Z"),
    completionXp: 0,
    turns: [
      { role: "avatar", content: "Let's say hello!", xpAwarded: 0 },
      { role: "child", content: "Hello!", xpAwarded: 5 },
      { role: "avatar", content: "Say hello to a dog.", xpAwarded: 0 },
      { role: "child", content: "Hello, dog!", xpAwarded: 5 },
      { role: "avatar", content: "Great! Try it again.", xpAwarded: 0 },
      { role: "child", content: "Hello, dog!", xpAwarded: 10 },
    ],
  },
  {
    key: "animals",
    alias: "Sofia",
    avatarCode: "luna",
    missionCode: "animal-adventure",
    startedAt: new Date("2026-05-17T16:00:00.000Z"),
    endedAt: new Date("2026-05-17T16:04:00.000Z"),
    completionXp: missionReward("animal-adventure"),
    turns: [
      { role: "avatar", content: "What animal do you like?", xpAwarded: 0 },
      {
        role: "child",
        content: "I likes a dog.",
        xpAwarded: 5,
        correctedContent: "I like a dog.",
        correctionExplanation: 'Use "like" with "I".',
      },
      { role: "avatar", content: "Nice! Say: I like a dog.", xpAwarded: 0 },
      { role: "child", content: "I like a dog.", xpAwarded: 5 },
      { role: "avatar", content: "Great! What other animal do you like?", xpAwarded: 0 },
      { role: "child", content: "I like a cat.", xpAwarded: 5 },
    ],
  },
  {
    key: "space",
    alias: "Sofia",
    avatarCode: "max",
    missionCode: "space-explorer",
    startedAt: new Date("2026-05-18T16:00:00.000Z"),
    endedAt: new Date("2026-05-18T16:04:00.000Z"),
    completionXp: missionReward("space-explorer"),
    turns: [
      { role: "avatar", content: "Say hello to our space bird!", xpAwarded: 0 },
      { role: "child", content: "Hello, bird!", xpAwarded: 1 },
      { role: "avatar", content: "What can our bird see?", xpAwarded: 0 },
      { role: "child", content: "The bird sees a star.", xpAwarded: 2 },
      { role: "avatar", content: "What color is it?", xpAwarded: 0 },
      { role: "child", content: "It is yellow.", xpAwarded: 2 },
    ],
  },
  {
    key: "first-friend",
    alias: "Leo",
    avatarCode: "max",
    missionCode: "meet-a-new-friend",
    startedAt: new Date("2026-05-18T15:00:00.000Z"),
    endedAt: new Date("2026-05-18T15:03:00.000Z"),
    completionXp: missionReward("meet-a-new-friend"),
    turns: [
      { role: "avatar", content: "Let's say hello!", xpAwarded: 0 },
      { role: "child", content: "Hello!", xpAwarded: 5 },
      { role: "avatar", content: "Great! Say: hello, dog.", xpAwarded: 0 },
      { role: "child", content: "Hello, dog!", xpAwarded: 5 },
    ],
  },
];

export const demoBadgeAwards = [
  { alias: "Sofia", badgeCode: "first-talk", awardedAt: new Date("2026-05-16T16:00:30Z") },
  { alias: "Sofia", badgeCode: "animal-explorer", awardedAt: new Date("2026-05-17T16:04:00Z") },
  { alias: "Sofia", badgeCode: "three-day-streak", awardedAt: new Date("2026-05-18T16:04:00Z") },
  { alias: "Leo", badgeCode: "first-talk", awardedAt: new Date("2026-05-18T15:00:30Z") },
];

const vocabularyTerms: Record<string, string[]> = {
  Sofia: ["dog", "cat", "bird", "hello"],
  Leo: ["hello", "dog"],
};

export function getDemoTurnTime(session: DemoSession, turnIndex: number): Date {
  return new Date(session.startedAt.getTime() + turnIndex * 30_000);
}

export function getDemoSessionXp(session: DemoSession): number {
  return session.turns.reduce((total, turn) => total + turn.xpAwarded, session.completionXp);
}

export function getDemoVocabulary(alias: string) {
  const childTurns = demoSessions
    .filter((session) => session.alias === alias)
    .flatMap((session) =>
      session.turns.flatMap((turn, index) =>
        turn.role === "child" ? [{ ...turn, practicedAt: getDemoTurnTime(session, index) }] : [],
      ),
    );

  // These English fixtures count each term once per child turn, not avatar prompts.
  return (vocabularyTerms[alias] ?? []).map((term) => {
    const normalizedTerm = normalizeVocabularyTerm(term);
    const practices = childTurns.filter((turn) => {
      const words: readonly string[] = normalizeVocabularyTerm(turn.content).match(/[a-z]+/g) ?? [];
      return words.includes(normalizedTerm);
    });
    const first = practices.at(0);
    const last = practices.at(-1);
    if (!first || !last) {
      throw new Error(`Missing demo practice for ${alias}: ${term}`);
    }

    return {
      language: "en",
      term,
      normalizedTerm,
      practiceCount: practices.length,
      successfulUseCount: practices.filter((turn) => !turn.correctedContent).length,
      firstSeenAt: first.practicedAt,
      lastPracticedAt: last.practicedAt,
    };
  });
}
