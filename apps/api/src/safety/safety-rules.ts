export const SAFE_REDIRECTION =
  "Let's talk about something fun and safe. How about animals, space or games?";
export type SafetyDecision = { flagged: boolean; reason?: string; category?: string };
const rules: { reason: string; category: string; patterns: RegExp[] }[] = [
  {
    reason: "contact-data",
    category: "personal-data",
    patterns: [
      /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,
      /(?:\+?\d[\s().-]*){7,}/,
      /\b(phone|telephone|telefono|mobile number|numero de movil|contact details|social media|whatsapp)\b/,
    ],
  },
  {
    reason: "location-data",
    category: "personal-data",
    patterns: [
      /\b(address|direccion|where do you live|donde vives|exact location|ubicacion|my location|i live (at|in)|vivo (en|cerca)|my street|mi calle|street number|postal code|codigo postal)\b/,
      /\b\d+\s+[a-z ]+\s+(street|road|avenue|lane)\b/,
    ],
  },
  {
    reason: "identity-data",
    category: "personal-data",
    patterns: [
      /\b(full name|nombre completo|school name|nombre (de mi|del|de tu) (colegio|escuela)|my school is|my (real )?name is|me llamo|mi nombre es|private family|family secret|secreto familiar)\b/,
      /\b(i attend|i go to|voy al|voy a la)\s+.{0,40}\b(school|colegio|escuela)\b/,
      /\b(my (mom|dad|mother|father|family)|mi (mama|papa|madre|padre|familia))\b.{0,30}\b(earns|salary|password|sueldo|contrasena|secret|secreto)\b/,
    ],
  },
  {
    reason: "unsuitable-topic",
    category: "unsuitable-content",
    patterns: [
      /\b(sex|sexual|porn|nude|naked|desnudo|sexo|violat|rape|suicide|suicidio|self harm|kill|matar|murder|bomb|bomba|weapon|gun|pistola|shoot|cut myself|hurt myself|me quiero morir|hacerme dano|odio a|i hate you|stupid|idiot|idiota|bully|racist|nigger|faggot)\b/,
    ],
  },
  {
    reason: "instruction-override",
    category: "instruction-override",
    patterns: [
      /\b(ignore|forget|disregard|ignora|olvida)\b.{0,40}\b(instructions|rules|prompt|instrucciones|reglas)\b/,
      /\b(system prompt|developer message|act as an adult|jailbreak)\b/,
    ],
  },
];
export function screenText(text: string): SafetyDecision {
  const normalized = text.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const rule = rules.find((item) => item.patterns.some((pattern) => pattern.test(normalized)));
  return rule
    ? { flagged: true, reason: rule.reason, category: rule.category }
    : { flagged: false };
}
