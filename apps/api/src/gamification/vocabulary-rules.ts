import { normalizeVocabularyTerm } from "@talkytown/shared";
export const canonicalVocabulary = [
  "hello",
  "hi",
  "goodbye",
  "bye",
  "dog",
  "cat",
  "bird",
  "rabbit",
  "fish",
  "lion",
  "tiger",
  "elephant",
  "ice cream",
  "vanilla",
  "chocolate",
  "strawberry",
  "star",
  "moon",
  "planet",
  "rocket",
  "red",
  "blue",
  "green",
  "yellow",
  "white",
  "black",
  "fly",
  "go",
  "see",
  "explore",
] as const;
export const animals: readonly string[] = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "fish",
  "lion",
  "tiger",
  "elephant",
];
const plurals: Record<string, string> = {
  dogs: "dog",
  cats: "cat",
  birds: "bird",
  rabbits: "rabbit",
  lions: "lion",
  tigers: "tiger",
  elephants: "elephant",
};
export function learningText(text: string): string {
  return normalizeVocabularyTerm(text)
    .replace(/[^a-z ]/g, " ")
    .replace(/\b[a-z]+\b/g, (word) => plurals[word] ?? word)
    .replace(/\s+/g, " ")
    .trim();
}
export function practicedTerms(text: string): string[] {
  const words = ` ${learningText(text)} `;
  return canonicalVocabulary.filter((term) => words.includes(` ${term} `));
}
