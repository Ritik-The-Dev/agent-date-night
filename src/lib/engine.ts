import type { Attachment, Person } from "./people";
import type { CombinedScrape } from "./scraper";
import {
  extractInstagramHandle,
  extractLinkedInHandle,
  scrapeProfile,
} from "./scraper";

// ── PRNG ─────────────────────────────────────────────────────────────────────
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: T[]): T =>
  arr[Math.floor(r() * arr.length)]!;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ── Attachment compatibility matrix ──────────────────────────────────────────
const ATTACH: Record<Attachment, Record<Attachment, number>> = {
  Secure: { Secure: 1, Anxious: 0.75, Avoidant: 0.7, "Fearful-avoidant": 0.6 },
  Anxious: { Secure: 0.75, Anxious: 0.55, Avoidant: 0.3, "Fearful-avoidant": 0.4 },
  Avoidant: { Secure: 0.7, Anxious: 0.3, Avoidant: 0.5, "Fearful-avoidant": 0.35 },
  "Fearful-avoidant": {
    Secure: 0.6,
    Anxious: 0.4,
    Avoidant: 0.35,
    "Fearful-avoidant": 0.3,
  },
};

const shared = (a: Person, b: Person) =>
  a.interests.filter((x) =>
    b.interests.some((y) => y.toLowerCase() === x.toLowerCase()),
  );

// ── Scoring ───────────────────────────────────────────────────────────────────
export function intellectual(a: Person, b: Person) {
  const ov = shared(a, b).length;
  const diff = Math.abs(a.traits.intellect - b.traits.intellect);
  return clamp(
    45 + ov * 14 + (a.traits.intellect + b.traits.intellect) * 1.5 - diff * 6,
  );
}
export function lifestyle(a: Person, b: Person) {
  const t = a.traits, u = b.traits;
  const d =
    Math.abs(t.energy - u.energy) +
    Math.abs(t.adventure - u.adventure) +
    Math.abs(t.ambition - u.ambition);
  return clamp(95 - d * 4.5 + (t.warmth + u.warmth) - 10);
}

// ── Venues ────────────────────────────────────────────────────────────────────
export const VENUES = [
  {
    id: "rooftop",
    name: "Rooftop at Golden Hour",
    desc: "City skyline, amber light, a jazz trio below.",
    gradient: "var(--venue-rooftop)",
    emoji: "🌆",
  },
  {
    id: "speakeasy",
    name: "Candlelit Speakeasy",
    desc: "Velvet booths, smoked old-fashioneds.",
    gradient: "var(--venue-speakeasy)",
    emoji: "🕯️",
  },
  {
    id: "gallery",
    name: "After-hours Gallery",
    desc: "Neon installations and quiet whispers.",
    gradient: "var(--venue-gallery)",
    emoji: "🖼️",
  },
  {
    id: "beach",
    name: "Midnight Beach Walk",
    desc: "Bioluminescent waves, bare feet.",
    gradient: "var(--venue-beach)",
    emoji: "🌊",
  },
  {
    id: "garden",
    name: "Secret Garden Dinner",
    desc: "Fairy lights, wildflowers, soft guitar.",
    gradient: "var(--venue-garden)",
    emoji: "🌿",
  },
  {
    id: "rooftop-bar",
    name: "Neon Rooftop Bar",
    desc: "Cocktails, city bass, purple neon.",
    gradient: "var(--venue-rooftop-bar)",
    emoji: "🍹",
  },
];

// ── Date simulation ───────────────────────────────────────────────────────────
export interface Turn {
  speaker: 0 | 1;
  line: string;
  thought: string;
  delta: number;
  chemistry: number;
  spark?: boolean;
}
export interface DateResult {
  turns: Turn[];
  chemistry: number;
  verdict: string;
  debrief: string[];
  secondDate: boolean;
}

export function simulateDate(
  a: Person,
  b: Person,
  venueId: string,
): DateResult {
  const r = rng(`${[a.id, b.id].sort().join("|")}|${venueId}`);
  const venue = VENUES.find((v) => v.id === venueId) ?? VENUES[0]!;
  const sh = shared(a, b);
  const base = (intellectual(a, b) + lifestyle(a, b)) / 2;
  const att = ATTACH[a.attachment][b.attachment];
  let chem = 50;
  const p = [a, b];
  const turns: Turn[] = [];
  const first = (x: Person) => x.name.split(" ")[0]!;

  // ── 16 context-aware scripted turns ─────────────────────────────────────
  // Each lambda receives (speaker, other) and uses their real fields.
  const scripts: ((s: Person, o: Person) => [string, string, number])[] = [
    // 1 — Arrival
    (s) => [
      `Okay, ${venue.name.toLowerCase()}. Great choice. I'm ${first(s)} — and yes, I rehearsed this entrance in the Uber.`,
      `Light opener. ${s.traits.humor > 6 ? "Humor is my warmth signal." : "Keep it easy — don't over-perform."}`,
      s.traits.humor > 6 ? 5 : 3,
    ],
    // 2 — Role curiosity
    (s, o) => [
      `So — ${o.title.split(",")[0]}. That's more interesting than it sounds on paper. What does that actually look like on a Tuesday?`,
      `Referencing ${first(o)}'s actual title: "${o.title}". Showing I did my homework without being creepy.`,
      4,
    ],
    // 3 — Hobby reveal
    (s) => [
      `When my calendar is empty I'm usually ${s.hobbies[0]!}. Most people think that's weird. I think it's the only thing that keeps me sane.`,
      `Soft reveal: ${s.hobbies[0]!}. Authentic > impressive at this stage.`,
      s.traits.warmth > 6 ? 6 : 2,
    ],
    // 4 — Shared interest or genuine curiosity bridge
    (s, o) =>
      sh.length
        ? [
            `Wait — you're into ${sh[0]!} too? I was literally talking about ${sh[0]!} yesterday. We need to go deeper on this.`,
            `Shared interest FOUND: ${sh[0]!}. This is where chemistry compounds fast.`,
            10,
          ]
        : [
            `Honest confession — I know almost nothing about ${o.interests[0]!}. Is that a dealbreaker, or will you give me the two-minute version?`,
            `No obvious overlap with ${first(o)}'s interests. Genuine curiosity is my best play.`,
            3,
          ],
    // 5 — Playful provocation
    (s, o) => [
      `Hot take: ${o.hobbies[Math.floor(r() * o.hobbies.length)]!} is a personality, not a hobby. I mean that as a compliment.`,
      `Gentle provocation. Humor score ${s.traits.humor}/10 — ${s.traits.humor > 6 ? "this lands well for me." : "slightly risky."}`,
      s.traits.humor > 6 ? 5 : r() > 0.5 ? 3 : -1,
    ],
    // 6 — Quirk confession
    (s, o) => {
      const clash = o.dealbreakers.some((d) =>
        s.quirks
          .join(" ")
          .toLowerCase()
          .includes((d.split(" ")[0] ?? "").toLowerCase()),
      );
      return clash
        ? [
            `Fair warning: ${s.quirks[0]!.toLowerCase()}. That's either endearing or I've already lost you.`,
            `Red-flag-adjacent. Better to name it now. Attachment: ${s.attachment}.`,
            -6,
          ]
        : [
            `Full disclosure: ${s.quirks[0]!.toLowerCase()}. Take that however you want.`,
            `Quirk signal sent. Watching ${first(o)}'s reaction.`,
            4,
          ];
    },
    // 7 — Dealbreaker probe
    (s, o) => {
      const greenFlag = !s.dealbreakers.some((d) =>
        o.quirks
          .join(" ")
          .toLowerCase()
          .includes((d.split(" ")[0] ?? "").toLowerCase()),
      );
      return greenFlag
        ? [
            `You know what's genuinely attractive? Someone who ${o.quirks[0]!.toLowerCase()}. It's rare.`,
            `Green flag confirmed for ${first(o)}. Affirm authentically.`,
            7,
          ]
        : [
            `I'll be straight — ${s.dealbreakers[0]!.toLowerCase()} is kind of a line for me. Thought you should know.`,
            `Dealbreaker detected. Honesty now > heartbreak later.`,
            -8,
          ];
    },
    // 8 — Depth question
    (s) => [
      `Real question, no filter: what do you actually need from a partner? Not the version you'd put in a bio.`,
      `Going for depth. ${s.attachment} attachment style means ${s.attachment === "Avoidant" ? "I push for depth to avoid small talk." : s.attachment === "Anxious" ? "I need to know the stakes." : "this feels natural."}`,
      4,
    ],
    // 9 — Vulnerable answer
    (s) => [
      `Honest answer: ${s.needs.join(" and ")}. That took me embarrassingly long to figure out.`,
      `Vulnerability play. ${s.attachment === "Avoidant" ? "Uncomfortable, but worth it." : s.attachment === "Anxious" ? "I'm oversharing — keep it measured." : "This is where I'm most myself."}`,
      s.attachment === "Avoidant" ? 4 : s.attachment === "Anxious" ? 3 : 8,
    ],
    // 10 — Shared values test
    (s, o) => {
      const valOverlap = o.interests.some((i) => s.interests.includes(i));
      return valOverlap
        ? [
            `The fact that you genuinely care about ${sh[0] ?? o.interests[0]!} — not just as a talking point — says something. I notice that.`,
            `Values alignment confirmed. This is where slow burns become real ones.`,
            8,
          ]
        : [
            `We see the world pretty differently. I think that's either our biggest problem or our best feature.`,
            `No values overlap with ${first(o)}. Reframe divergence as interesting.`,
            r() > 0.4 ? 3 : -3,
          ];
    },
    // 11 — Energy / pace contrast
    (s, o) => {
      const diff = Math.abs(s.traits.energy - o.traits.energy);
      return diff > 4
        ? [
            `You seem like you run at a different speed than me. Is that exciting or exhausting — still figuring that out.`,
            `Energy gap: my ${s.traits.energy} vs their ${o.traits.energy}. Naming it is better than pretending.`,
            r() > 0.5 ? 2 : -4,
          ]
        : [
            `There's something rare about being around someone who runs at the same pace. I hadn't noticed I was missing it.`,
            `Energy match: ${s.traits.energy} ≈ ${o.traits.energy}. Lean into it.`,
            6,
          ];
    },
    // 12 — Memory question
    (s) => [
      `One question I ask everyone on a first date: if you could re-live one day from your past — any day — what is it?`,
      `Memory question: forces authenticity and plants a positive emotional anchor. Humor ${s.traits.humor}/10.`,
      5,
    ],
    // 13 — Affirm after memory
    (_s, o) => [
      `That story is exactly why the headline version of ${first(o)} doesn't do justice to the actual person.`,
      `High-impact affirmation after vulnerability. This is the peak chemistry moment.`,
      9,
    ],
    // 14 — Future-pacing
    (s, o) => [
      `Hypothetically — if this goes well — I'd take you to ${o.hobbies[0]!}. Your turf. My treat.`,
      `Future-pacing: if ${first(o)} lights up, the second date is already booked in their head. Adventure: ${s.traits.adventure}/10.`,
      s.traits.adventure > 6 ? 7 : 5,
    ],
    // 15 — Genuine close
    (s, o) => [
      `I've done a lot of first dates, ${first(o)}. This one is — unexpectedly — not small talk. I want you to know I notice that.`,
      `Sincere close. ${s.attachment === "Avoidant" ? "Saying this out loud is harder than it looks." : "Natural and warm."} Warmth: ${s.traits.warmth}/10.`,
      s.traits.warmth > 7 ? 8 : 5,
    ],
    // 16 — Exit line
    (s) => [
      `Deal. But I'm picking the playlist — and I already know it's going to change your life a little.`,
      `Playful confident exit. Leave them smiling and wanting the next conversation. Humor: ${s.traits.humor}/10.`,
      s.traits.humor / 2 + 2,
    ],
  ];

  scripts.forEach((fn, i) => {
    const s = p[i % 2]!, o = p[(i + 1) % 2]!;
    const [line, thought, d] = fn(s, o);
    const delta = Math.round(
      (d + (r() - 0.4) * 6) * (0.6 + att * 0.6),
    );
    chem = Math.max(5, Math.min(99, chem + delta + (base - 60) / 10));
    const chemistry = Math.round(chem);
    const spark = delta >= 7 && chemistry >= 65;
    turns.push({
      speaker: (i % 2) as 0 | 1,
      line,
      thought,
      delta,
      chemistry,
      spark,
    });
  });

  const final = Math.round(chem);
  const secondDate = final >= 65;
  const verdict =
    final >= 85
      ? "Electric. Don't overthink it — just text them."
      : final >= 75
        ? "Sparks flew — book the second date."
        : final >= 65
          ? "Promising. A slow burn worth tending."
          : final >= 50
            ? "Friendly, but the spark is missing."
            : final >= 35
              ? "Polite handshake. Not a match."
              : "Different planets. Move on gracefully.";

  const debrief = [
    `${first(a)} rated the night ${Math.round(final / 10)}/10 — "${secondDate ? `${first(b)} has real ${b.needs[0]!}.` : "Great human, wrong frequency."}"`,
    `${first(b)} rated it ${Math.max(1, Math.round((final + (r() - 0.5) * 16) / 10))}/10 — "${sh.length ? `We bonded over ${sh[0]!}.` : "We had to work for common ground."}"`,
    `Attachment dynamic: ${a.attachment} × ${b.attachment} — ${Math.round(att * 100)}% pair stability.`,
    sh.length
      ? `Shared interests that landed: ${sh.slice(0, 3).join(", ")}.`
      : `No shared interests — curiosity bridge had to do the heavy lifting.`,
  ];
  return { turns, chemistry: final, verdict, debrief, secondDate };
}

// ── Rankings ──────────────────────────────────────────────────────────────────
export interface Score {
  other: Person;
  intellectual: number;
  lifestyle: number;
  chemistry: number;
  total: number;
}
export function rankFor(p: Person, all: Person[]): Score[] {
  return all
    .filter((o) => o.id !== p.id)
    .map((o) => {
      const i = intellectual(p, o),
        l = lifestyle(p, o),
        c = simulateDate(p, o, "rooftop").chemistry;
      return {
        other: o,
        intellectual: i,
        lifestyle: l,
        chemistry: c,
        total: Math.round(i * 0.35 + l * 0.3 + c * 0.35),
      };
    })
    .sort((x, y) => y.total - x.total);
}

// ── Bio/keyword → psychological synthesis ─────────────────────────────────────
/**
 * Deterministically synthesizes attachment style, needs, hobbies, quirks,
 * and dealbreakers from scraped bio + headline text.
 *
 * No RNG involved — same input → same output every time.
 */
export function synthesizePersona(
  bioText: string,
  headline: string,
  igHandle: string,
): {
  attachment: Attachment;
  needs: string[];
  hobbies: string[];
  interests: string[];
  quirks: string[];
  dealbreakers: string[];
  traits: Person["traits"];
} {
  const text = (bioText + " " + headline + " " + igHandle).toLowerCase();

  // ── Attachment style ─────────────────────────────────────────────────────
  const avoidantWords = [
    "independent", "solo", "freedom", "nomad", "hustle", "ceo", "founder",
    "building", "launch", "solo", "remote", "distributed",
  ];
  const anxiousWords = [
    "dm", "reply", "waiting", "anxious", "worrying", "overthink",
    "available", "always on", "24/7", "responsive",
  ];
  const fearfulWords = ["afraid", "scared", "hide", "fear", "trauma", "broken"];
  const secureWords = [
    "team", "community", "family", "love", "together", "collaborate",
    "open", "share", "kind", "empath",
  ];

  const score = (words: string[]) =>
    words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);

  const scores = {
    Avoidant: score(avoidantWords),
    Anxious: score(anxiousWords),
    "Fearful-avoidant": score(fearfulWords),
    Secure: score(secureWords),
  };
  const attachment = (
    Object.entries(scores).sort((a, b) => b[1] - a[1])[0]![0] as Attachment
  );

  // ── Interests (keyword match against known topics) ───────────────────────
  const topicMap: Record<string, string[]> = {
    AI: ["ai", "machine learning", "gpt", "llm", "artificial intelligence", "ml"],
    design: ["design", "ux", "ui", "visual", "creative", "figma", "brand"],
    startups: ["startup", "founder", "venture", "seed", "yc", "accelerator", "build"],
    books: ["book", "read", "author", "writing", "publish", "story"],
    travel: ["travel", "explore", "adventure", "nomad", "world", "journey"],
    music: ["music", "guitar", "piano", "song", "band", "spotify", "playlist"],
    wellness: ["yoga", "meditat", "wellness", "mindful", "health", "sleep"],
    psychology: ["psycholog", "mental health", "behavior", "mindset", "emotion"],
    sports: ["sport", "athletic", "run", "crossfit", "marathon", "gym", "fitness"],
    film: ["film", "cinema", "movie", "director", "camera", "video"],
    tech: ["tech", "software", "engineer", "code", "developer", "saas", "product"],
    business: ["business", "revenue", "sales", "market", "roi", "profit", "invest"],
    photography: ["photo", "camera", "shoot", "portrait", "lens", "instagram"],
    food: ["food", "chef", "cook", "restaurant", "recipe", "culinary", "coffee"],
    sustainability: ["sustain", "climate", "green", "environment", "carbon", "eco"],
    philosophy: ["philosoph", "stoic", "meaning", "existential", "wisdom", "ethics"],
  };
  const interests = Object.entries(topicMap)
    .filter(([, kws]) => kws.some((k) => text.includes(k)))
    .map(([topic]) => topic)
    .slice(0, 5);
  if (interests.length < 2) interests.push("startups", "design");

  // ── Hobbies ──────────────────────────────────────────────────────────────
  const hobbyMap: Record<string, string[]> = {
    running: ["run", "marathon", "5k", "jogger"],
    yoga: ["yoga", "pilates", "stretch"],
    cooking: ["cook", "recipe", "chef", "bake", "foodie"],
    photography: ["photo", "camera", "shoot"],
    reading: ["read", "book", "library", "kindle"],
    travel: ["travel", "backpack", "nomad", "visit"],
    gaming: ["game", "gamer", "esport", "play"],
    cycling: ["cycl", "bike", "bicycle"],
    hiking: ["hike", "trail", "mountain", "climb"],
    music: ["guitar", "piano", "drums", "music"],
    writing: ["write", "blog", "essay", "newsletter"],
    meditation: ["meditat", "mindful", "breathe"],
  };
  const hobbies = Object.entries(hobbyMap)
    .filter(([, kws]) => kws.some((k) => text.includes(k)))
    .map(([h]) => h)
    .slice(0, 3);
  if (hobbies.length < 2) hobbies.push("reading", "travel");

  // ── Needs (from attachment + headline signals) ──────────────────────────
  const needsMap: Record<Attachment, string[]> = {
    Secure: ["deep conversation", "mutual respect", "shared growth"],
    Anxious: ["emotional availability", "clear communication", "consistency"],
    Avoidant: ["personal space", "independence", "low pressure"],
    "Fearful-avoidant": ["patience", "trust-building", "emotional safety"],
  };
  const needs = needsMap[attachment].slice(0, 2);

  // ── Quirks ───────────────────────────────────────────────────────────────
  const quirkKeywords: [string, string][] = [
    ["morning", "Up before 6am by habit"],
    ["coffee", "Orders the same coffee every single day"],
    ["notion", "Has a Notion for everything"],
    ["twitter", "Thinks out loud on social media"],
    ["podcast", "Has a podcast or is about to launch one"],
    ["newsletter", "Writes a newsletter nobody asked for"],
    ["book", "Always reading three books simultaneously"],
    ["travel", "Has a carry-on bag permanently packed"],
    ["gym", "Gym session is non-negotiable"],
    ["data", "Cites a stat in every conversation"],
  ];
  const quirks = quirkKeywords
    .filter(([k]) => text.includes(k))
    .map(([, q]) => q)
    .slice(0, 2);
  if (quirks.length < 1) quirks.push("Talks about work on every first date");

  // ── Dealbreakers ─────────────────────────────────────────────────────────
  const dbMap: Record<Attachment, string[]> = {
    Secure: ["Dishonesty", "Disrespect"],
    Anxious: ["Ghosting", "Inconsistency"],
    Avoidant: ["Clinginess", "Over-communication"],
    "Fearful-avoidant": ["Unpredictability", "Pressure"],
  };
  const dealbreakers = dbMap[attachment];

  // ── Trait vector (heuristic from keyword density) ────────────────────────
  const traitScore = (words: string[]) =>
    Math.min(10, Math.max(1, 4 + score(words)));

  const traits: Person["traits"] = {
    intellect: traitScore(["research", "data", "analys", "study", "science", "academic", "phd"]),
    energy: traitScore(["hustle", "fast", "launch", "build", "grow", "daily", "every day"]),
    ambition: traitScore(["goal", "mission", "vision", "scale", "billion", "exit", "founder"]),
    humor: traitScore(["funny", "lol", "joke", "humor", "laugh", "meme", "wit"]),
    warmth: traitScore(["love", "care", "kind", "family", "friend", "support", "together"]),
    adventure: traitScore(["travel", "explore", "risk", "adventure", "unknown", "nomad"]),
  };

  return { attachment, needs, hobbies, interests, quirks, dealbreakers, traits };
}

// ── URL handle parsers (re-exported from scraper for convenience) ─────────────
export { extractLinkedInHandle as parseLinkedIn, extractInstagramHandle as parseInstagram };

// ── Pools for seeded fallback ────────────────────────────────────────────────
const POOL = {
  needs: [
    "adventure", "deep conversation", "loyalty", "creative freedom",
    "stability", "laughter", "growth", "honesty", "playfulness",
  ],
  hobbies: [
    "running", "photography", "cooking", "travel", "climbing",
    "reading", "music", "yoga", "gaming", "cycling",
  ],
  interests: [
    "startups", "design", "AI", "books", "travel", "music",
    "psychology", "film", "wellness", "sustainability", "philosophy",
  ],
  quirks: [
    "Has strong opinions about fonts",
    "Never replies before coffee",
    "Keeps a dream journal",
    "Takes 400 photos of every meal",
    "Reorganizes playlists on bad days",
    "Narrates life in third person when stressed",
  ],
  dealbreakers: [
    "Rudeness to waiters",
    "Ghosting",
    "Incuriosity",
    "Phones at dinner",
    "Chronic lateness",
    "Unsolicited advice",
  ],
  att: ["Secure", "Anxious", "Avoidant", "Fearful-avoidant"] as Attachment[],
};

// ── Live ingest: scrape → synthesize → Person ─────────────────────────────────
export async function ingestLive(
  linkedinUrl: string,
  instagramUrl: string,
  nameHint?: string,
  onProgress?: (step: number) => void,
): Promise<Person | string> {
  const liHandle = extractLinkedInHandle(linkedinUrl);
  const igHandle = extractInstagramHandle(instagramUrl);
  if (!liHandle) return "That doesn't look like a public LinkedIn profile URL (linkedin.com/in/…).";
  if (!igHandle) return "That doesn't look like a public Instagram profile URL (instagram.com/…).";

  onProgress?.(0); // step: validating

  let scrape: CombinedScrape;
  try {
    onProgress?.(1); // step: fetching
    scrape = await scrapeProfile(linkedinUrl, instagramUrl);
    onProgress?.(2); // step: extracting
  } catch {
    // If scraping fully fails, fall back to seeded persona
    return ingestSeeded(liHandle, igHandle, nameHint);
  }

  onProgress?.(3); // step: synthesizing

  const bioText = scrape.mergedBio || (scrape.li.ok ? scrape.li.bio : "");
  const headline = scrape.headline || "";

  const persona = synthesizePersona(bioText, headline, igHandle);

  const name = nameHint?.trim() || scrape.displayName || formatHandle(liHandle);

  onProgress?.(4); // step: birthing agent

  const categories = ["Tech", "Design", "Creator", "Media"] as const;
  const r = rng(liHandle + igHandle);

  return {
    id: `custom-${igHandle}`,
    name,
    title: headline || "Ingested from public profiles",
    category: pick(r, categories),
    linkedin: `https://www.linkedin.com/in/${liHandle}/`,
    instagram: `https://www.instagram.com/${igHandle}/`,
    igHandle,
    bio:
      scrape.mergedBio ||
      `Agent synthesized from public signals at @${igHandle} and linkedin.com/in/${liHandle}.`,
    photoUrl: scrape.avatarUrl || undefined,
    ...persona,
    custom: true,
  };
}

/** Seeded (offline) fallback — deterministic, no network */
export function ingestSeeded(
  liHandle: string,
  igHandle: string,
  nameHint?: string,
): Person {
  const r = rng(liHandle + igHandle);
  const name = nameHint?.trim() || formatHandle(liHandle);
  const take = (arr: string[], c: number) => [...arr].sort(() => r() - 0.5).slice(0, c);
  const categories = ["Tech", "Design", "Creator", "Media"] as const;
  return {
    id: `custom-${igHandle}`,
    name,
    title: "Ingested from public profiles",
    category: pick(r, categories),
    linkedin: `https://www.linkedin.com/in/${liHandle}/`,
    instagram: `https://www.instagram.com/${igHandle}/`,
    igHandle,
    bio: `Agent synthesized from public signals at @${igHandle} and linkedin.com/in/${liHandle}.`,
    needs: take(POOL.needs, 2),
    hobbies: take(POOL.hobbies, 3),
    interests: take(POOL.interests, 4),
    attachment: pick(r, POOL.att),
    quirks: take(POOL.quirks, 2),
    dealbreakers: take(POOL.dealbreakers, 2),
    traits: {
      intellect: Math.round(3 + r() * 7),
      energy: Math.round(3 + r() * 7),
      ambition: Math.round(3 + r() * 7),
      humor: Math.round(3 + r() * 7),
      warmth: Math.round(3 + r() * 7),
      adventure: Math.round(3 + r() * 7),
    },
    custom: true,
  };
}

function formatHandle(h: string) {
  return h
    .replace(/-[a-z0-9]{5,}$/i, "")
    .split(/[-_.]/)
    .map((w) => (w[0]?.toUpperCase() ?? "") + w.slice(1))
    .join(" ");
}

/** Synchronous ingest (used for the non-async path) */
export function ingest(
  linkedin: string,
  instagram: string,
  nameHint?: string,
): Person | string {
  const l = extractLinkedInHandle(linkedin);
  const i = extractInstagramHandle(instagram);
  if (!l) return "That doesn't look like a public LinkedIn profile URL (linkedin.com/in/…).";
  if (!i) return "That doesn't look like a public Instagram profile URL (instagram.com/…).";
  return ingestSeeded(l, i, nameHint);
}
