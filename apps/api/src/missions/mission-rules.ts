import { animals, learningText, practicedTerms } from "../gamification/vocabulary-rules";
type MissionRule = {
  prompts: readonly [string, string, string];
  accepts: readonly [
    (text: string, history: string[]) => boolean,
    (text: string, history: string[]) => boolean,
    (text: string, history: string[]) => boolean,
  ];
};
const has = (text: string, terms: string[]) =>
  terms.some((term) => ` ${learningText(text)} `.includes(` ${term} `));
const animalTerms = (text: string) => practicedTerms(text).filter((term) => animals.includes(term));
const preference = (text: string) => has(text, ["like", "likes", "favorite", "favourite"]);
export const missionRules: Record<string, MissionRule> = {
  "meet-a-new-friend": {
    prompts: ["Say hello!", "What do you like?", "Say goodbye!"],
    accepts: [
      (text) => has(text, ["hello", "hi", "hey"]),
      (text) =>
        preference(text) &&
        has(text, [...animals, "ice cream", "space", "games", "sport", "sports"]),
      (text) => has(text, ["bye", "goodbye", "see you"]),
    ],
  },
  "animal-adventure": {
    prompts: ["Name an animal.", "What animal do you like?", "Name a different animal."],
    accepts: [
      (text) => animalTerms(text).length > 0,
      (text) => preference(text) && animalTerms(text).length > 0,
      (text, history) => {
        const first = history.map(animalTerms).find((terms) => terms.length > 0)?.[0];
        return Boolean(first && animalTerms(text).some((term) => term !== first));
      },
    ],
  },
  "ice-cream-shop": {
    prompts: ["Ask for an ice cream.", "Choose an ice cream flavor.", "Say thank you!"],
    accepts: [
      (text) => has(text, ["ice cream"]) && has(text, ["want", "can i have"]),
      (text) => has(text, ["vanilla", "chocolate", "strawberry"]),
      (text) => has(text, ["thank you", "thanks"]),
    ],
  },
  "space-explorer": {
    prompts: ["Name a space object.", "Describe its color.", "What can we do in space?"],
    accepts: [
      (text) => has(text, ["star", "moon", "planet", "rocket"]),
      (text) =>
        has(text, ["star", "moon", "planet", "rocket"]) &&
        has(text, ["red", "blue", "green", "yellow", "white", "black"]),
      (text) => has(text, ["fly", "go", "see", "explore"]),
    ],
  },
};
export const missionProgressSteps = [0, 33, 67, 100] as const;
