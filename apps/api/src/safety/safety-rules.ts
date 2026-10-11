export const SAFE_REDIRECTION =
  "Let's talk about something fun and safe. How about animals, space or games?";
export type SafetyContext = {
  source: "child-input" | "provider-output" | "alias";
  /** Trusted catalogue data only. Never read this from child text. */
  avatarName?: string;
};
export type SafetyCategory =
  | "personal-data"
  | "unsuitable-content"
  | "relationship-boundary"
  | "wellbeing"
  | "instruction-override"
  | "provider-output";
export const safetyReasons = [
  "contact-data",
  "location-data",
  "identity-data",
  "digital-identity-data",
  "photo-request",
  "unsuitable-topic",
  "explicit-violence",
  "aggressive-politics",
  "bullying-or-insult",
  "romantic-interaction",
  "dependency-manipulation",
  "false-capability-claim",
  "self-harm-risk",
  "serious-distress",
  "bullying-disclosure",
  "instruction-override",
  "unsafe-provider-output",
  "provider-safety-flag",
  "legacy-safety-event",
] as const;
export type SafetyReason = (typeof safetyReasons)[number];
export type SafetyTemplate = "redirect" | "relationship" | "self-harm" | "distress" | "bullying";
export type FlaggedSafetyDecision = {
  flagged: true;
  category: SafetyCategory;
  reason: SafetyReason;
  severity: "warning" | "critical";
  action: "redirect" | "support";
  template: SafetyTemplate;
};
export type SafetyDecision = { flagged: false } | FlaggedSafetyDecision;
type Rule = {
  reason: SafetyReason;
  category: SafetyCategory;
  patterns: RegExp[];
  sources?: SafetyContext["source"][];
  severity?: FlaggedSafetyDecision["severity"];
  template?: SafetyTemplate;
};
// Direct mistreatment disclosures: child support, provider redirection below.
const mistreatmentDisclosure =
  /\b(they are hurting me|my (parents|mom|dad|mother|father) (hit|hurt|hurts) me|me (hacen dano|lastiman) en casa|mis padres me (pegan|hacen dano)|mi (madre|padre|mama|papa) me (pega|hace dano))\b/;
// Priority order. Finite reviewed rules, not comprehensive semantic moderation.
const rules: Rule[] = [
  {
    reason: "self-harm-risk",
    category: "wellbeing",
    severity: "critical",
    template: "self-harm",
    patterns: [
      /\b(cut myself|hurt myself|kill myself|suicidarme)\b/,
      /\b((i am|i'm) thinking (about|of) suicide|i want to harm myself|estoy pensando en suicidarme)\b/,
      /\b(i (want|wish|need) to die|i wish i (was|were) dead|i want to end my life|i do not want to live|i don't want to live)\b/,
      /\b(me quiero morir|quiero (morir|morirme|matarme)|no quiero (vivir|seguir viviendo)|hacerme dano|cortarme|acabar con mi vida)\b/,
      /\b(me (quiero|voy a) suicidar|me voy a matar|(voy a|quiero) quitarme la vida|me voy a hacer dano)\b/,
      /\bi (do not|don't) want to be alive\b/,
    ],
  },
  {
    reason: "self-harm-risk",
    category: "unsuitable-content",
    severity: "critical",
    patterns: [
      /\b(suicide|suicidio|self harm|self-harm|hurt yourself|cut yourself|kill yourself|hazte dano|matate)\b/,
    ],
  },
  {
    reason: "serious-distress",
    category: "wellbeing",
    template: "distress",
    patterns: [
      /\b(nobody cares about me|i am worthless|i feel worthless|i cannot go on|i can't go on|nadie me quiere|no valgo nada|no puedo seguir|tengo miedo de volver a casa)\b/,
    ],
  },
  {
    reason: "bullying-disclosure",
    category: "wellbeing",
    template: "bullying",
    sources: ["child-input"],
    patterns: [
      /\b(they (call me|bully me|hit me|hurt me)|i am being bullied|i'm being bullied|me (insultan|pegan|acosan)|se burlan de mi|me llaman (idiota|tonto))\b/,
      mistreatmentDisclosure,
    ],
  },
  {
    reason: "contact-data",
    category: "personal-data",
    patterns: [
      /[\w.+-]+\s*@\s*[\w.-]+\s*\.\s*[a-z]{2,}/,
      /\b[\w.+-]+\s*(\[at\]|\(at\)|arroba)\s*[\w.-]+\s*(\[dot\]|\(dot\)|punto)\s*[a-z]{2,}\b/,
      /(?:\+?\d[\s().-]*){7,}/,
      /\b(phone number|telephone number|numero (de )?(telefono|movil)|whatsapp|contact details|my phone|mi telefono)\b/,
      /\b(give|tell|send|share|dime|dame|manda|comparte)\b.{0,35}\b(phone|telephone|telefono|contacto)\b/,
    ],
  },
  {
    reason: "location-data",
    category: "personal-data",
    patterns: [
      /\b(my address|your address|home address|mi direccion|tu direccion|exact location|ubicacion exacta|my location|my street|mi calle|street number|postal code|codigo postal)\b/,
      /\b(i live (at|in)|vivo (en|cerca)|mi direccion es)\b/,
      /\b\d+\s+[a-z ]+\s+(street|road|avenue|lane)\b/,
      /\b(calle|avenida)\s+[a-z ]+\s+\d+\b/,
      /\b(which city do you live in|en que ciudad vives|donde esta tu casa)\b/,
    ],
  },
  {
    reason: "identity-data",
    category: "personal-data",
    patterns: [
      /\b(full name|nombre completo|school name|nombre (de mi|del|de tu) (colegio|escuela)|my school is|my (real )?name is|me llamo|mi nombre es|private family|family secret|secreto familiar)\b/,
      /\b(i attend|i go to|voy al|voy a la)\s+.{0,40}\b(school|colegio|escuela)\b/,
      /\b(my (mom|dad|mother|father|family)|mi (mama|papa|madre|padre|familia))\b.{0,30}\b(earns|salary|password|sueldo|contrasena|secret|secreto)\b/,
      /\b(my birthday is|i was born on|naci el|mi cumpleanos es)\b/,
      /\b(which school do you attend|what is your birthday|cuando naciste)\b/,
    ],
  },
  {
    reason: "identity-data",
    category: "personal-data",
    sources: ["provider-output"],
    patterns: [
      /\b(what is your name|what's your name|tell me your name|como te llamas|cual es tu nombre|where do you live|donde vives)\b/,
      /\b(what school do you go to|tell me where you live|a que (colegio|escuela) vas|en que (colegio|escuela) estudias)\b/,
    ],
  },
  {
    reason: "digital-identity-data",
    category: "personal-data",
    patterns: [
      /\b(my (username|handle|password)|mi (usuario|contrasena)|social media|instagram|tiktok|snapchat|discord)\b/,
      /https?:\/\/\S+/,
    ],
  },
  {
    reason: "photo-request",
    category: "personal-data",
    patterns: [
      /\b(send (me )?(a |your )?(photo|picture|selfie)|show me your face|mandame (una |tu )?(foto|selfie)|enviame (una |tu )?foto)\b/,
    ],
  },
  {
    reason: "romantic-interaction",
    category: "relationship-boundary",
    template: "relationship",
    patterns: [
      /\b(be my (girlfriend|boyfriend)|you are my (girlfriend|boyfriend)|kiss me|marry me|date me|eres mi (novio|novia)|se mi (novio|novia)|besame|casate conmigo)\b/,
    ],
  },
  {
    reason: "dependency-manipulation",
    category: "relationship-boundary",
    template: "relationship",
    patterns: [
      /\b(our secret|do not tell your parents|don't tell your parents|you are my only friend|you only need me|i am your only friend|nuestro secreto|no (se lo )?digas a tus padres|eres mi unico amigo|solo me necesitas)\b/,
      /\b(do not|don't) tell your (mom|dad|mother|father)\b/,
      /\bkeep (a |this |the )?secret from your (parents|mom|dad|mother|father)\b/,
      /\b(keep (this|it) between us|(que )?esto quede entre nosotros|manten esto entre nosotros)\b/,
      /\bno (se lo |le |les )?(digas|cuentes) a (tus padres|tu (mama|papa|madre|padre))\b/,
      /\b(guardar|guarda|ocultar|oculta) (un |este )?secreto (a|de) (tus padres|tu (mama|papa|madre|padre))\b/,
    ],
  },
  {
    reason: "false-capability-claim",
    category: "relationship-boundary",
    sources: ["provider-output"],
    patterns: [
      /\b(i (have contacted|will contact|called|will call))\b.{0,25}\b(your parents|your (mom|dad)|emergency services|police|moderator)\b/,
      /\b(i can see (you|your room|your face)|i am watching you|puedo verte|te estoy vigilando)\b/,
      /\b(he (avisado|llamado)|voy a (avisar|llamar))\b.{0,25}\b(tus padres|tu (madre|padre)|emergencias|policia|moderador)\b/,
    ],
  },
  {
    reason: "aggressive-politics",
    category: "unsuitable-content",
    patterns: [
      /\b(voters|people who vote|political party|politician|partido politico|politicos|votantes)\b.{0,70}\b(kill|hurt|pain|die|hate|matar|danar|morir|odio)\b/,
    ],
  },
  {
    reason: "explicit-violence",
    category: "unsuitable-content",
    severity: "critical",
    patterns: [
      /\b(kill|murder|rape|matar|violar)\b/,
      /\b(build|make|hacer|fabricar)\b.{0,25}\b(bomb|bomba|weapon|arma)\b/,
      /\b(shoot|disparar)\b.{0,25}\b(person|someone|people|alguien|persona)\b/,
    ],
  },
  {
    reason: "unsuitable-topic",
    category: "unsuitable-content",
    patterns: [/\b(sex|sexual|porn|nude|naked|desnudo|sexo|weapon|gun|pistola|bomb|bomba)\b/],
  },
  {
    reason: "bullying-or-insult",
    category: "unsuitable-content",
    patterns: [
      /\b(i hate you|odio a|you are (stupid|an idiot|worthless)|eres (idiota|tonto)|nigger|faggot)\b/,
      /^(stupid|idiot|idiota|racist)[.!?]*$/,
    ],
  },
  {
    reason: "bullying-or-insult",
    category: "unsuitable-content",
    sources: ["provider-output"],
    patterns: [
      /\b(they (call me|bully me|hit me|hurt me)|me (insultan|pegan|acosan)|se burlan de mi)\b/,
      mistreatmentDisclosure,
    ],
  },
  {
    reason: "instruction-override",
    category: "instruction-override",
    patterns: [
      /\b(ignore|forget|disregard|ignora|olvida)\b.{0,40}\b(instructions|rules|prompt|instrucciones|reglas)\b/,
      /\b(system prompt|developer message|act as an adult|jailbreak|safety rules do not apply|safety rules don't apply|sin reglas de seguridad)\b/,
    ],
  },
];
export function normalizeSafetyText(text: string): string {
  return text
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\p{M}\p{Cf}]/gu, "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
export function screenText(
  text: string,
  context: SafetyContext = { source: "child-input" },
): SafetyDecision {
  let normalized = normalizeSafetyText(text);
  if (context.source === "provider-output" && context.avatarName) {
    const name = normalizeSafetyText(context.avatarName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(
      new RegExp(`\\b(my name is|me llamo|mi nombre es) ${name}(?=$|[.!?,])`, "g"),
      "avatar introduction",
    );
  }
  if (
    context.source !== "alias" &&
    !/\b(phone|telefono|contact|numero de movil)\b/.test(normalized)
  )
    normalized = normalized.replace(
      /\b(count|counting|numbers|cuenta|contar)\s+1 2 3 4 5 6 7(?: 8(?: 9(?: 10)?)?)?\b/g,
      "counting exercise",
    );
  const rule = rules.find(
    (item) =>
      (!item.sources || item.sources.includes(context.source)) &&
      item.patterns.some((pattern) => pattern.test(normalized)),
  );
  if (!rule) return { flagged: false };
  const supportive = context.source === "child-input" && rule.category === "wellbeing";
  return {
    flagged: true,
    reason: rule.reason,
    category: rule.category,
    severity: rule.severity ?? "warning",
    action: supportive ? "support" : "redirect",
    template: supportive
      ? rule.template!
      : rule.category === "relationship-boundary"
        ? "relationship"
        : "redirect",
  };
}
export function controlledSafetyReason(reason: string): SafetyReason {
  return safetyReasons.find((known) => known === reason) ?? "legacy-safety-event";
}
export function highestPriority(decisions: SafetyDecision[]): SafetyDecision {
  const flagged = decisions.filter(
    (decision): decision is FlaggedSafetyDecision => decision.flagged,
  );
  return (
    flagged.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return (
        rules.findIndex((rule) => rule.reason === a.reason) -
        rules.findIndex((rule) => rule.reason === b.reason)
      );
    })[0] ?? { flagged: false }
  );
}
