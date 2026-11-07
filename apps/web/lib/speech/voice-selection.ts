export function selectVoice(
  voices: SpeechSynthesisVoice[],
  locale: "en" | "es",
  avatar: string,
): SpeechSynthesisVoice | undefined {
  const matching = voices.filter(
    (voice) => voice.localService && voice.lang.toLowerCase().split(/[-_]/)[0] === locale,
  );
  const preferred = matching.filter(
    (voice) => voice.lang.toLowerCase() === (locale === "en" ? "en-us" : "es-es"),
  );
  const candidates = (preferred.length ? preferred : matching).sort((a, b) =>
    `${a.voiceURI}:${a.name}`.localeCompare(`${b.voiceURI}:${b.name}`),
  );
  return candidates.length ? candidates[(avatar === "max" ? 1 : 0) % candidates.length] : undefined;
}
