export function practiceXp(message: string): number {
  return /\p{Script=Latin}/u.test(message.normalize("NFKC")) ? 5 : 0;
}
