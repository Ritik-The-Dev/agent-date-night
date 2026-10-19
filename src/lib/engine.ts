import type { Attachment, Person } from "./people";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)]!;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const ATTACH: Record<Attachment, Record<Attachment, number>> = {
  Secure: { Secure: 1, Anxious: 0.75, Avoidant: 0.7, "Fearful-avoidant": 0.6 },
  Anxious: { Secure: 0.75, Anxious: 0.55, Avoidant: 0.3, "Fearful-avoidant": 0.4 },
  Avoidant: { Secure: 0.7, Anxious: 0.3, Avoidant: 0.5, "Fearful-avoidant": 0.35 },
  "Fearful-avoidant": { Secure: 0.6, Anxious: 0.4, Avoidant: 0.35, "Fearful-avoidant": 0.3 },
};

const shared = (a: Person, b: Person) =>
  a.interests.filter((x) => b.interests.some((y) => y.toLowerCase() === x.toLowerCase()));

export function intellectual(a: Person, b: Person) {
  const ov = shared(a, b).length;
  const diff = Math.abs(a.traits.intellect - b.traits.intellect);
  return clamp(45 + ov * 14 + (a.traits.intellect + b.traits.intellect) * 1.5 - diff * 6);
}
export function lifestyle(a: Person, b: Person) {
  const t = a.traits, u = b.traits;
  const d = Math.abs(t.energy - u.energy) + Math.abs(t.adventure - u.adventure) + Math.abs(t.ambition - u.ambition);
  return clamp(95 - d * 4.5 + (t.warmth + u.warmth) - 10);
}

export const VENUES = [
  { id: "rooftop", name: "Rooftop at Golden Hour", desc: "City skyline, amber light, a jazz trio below.", gradient: "var(--venue-rooftop)" },
  { id: "speakeasy", name: "Candlelit Speakeasy", desc: "Velvet booths, smoked old-fashioneds.", gradient: "var(--venue-speakeasy)" },
  { id: "gallery", name: "After-hours Gallery", desc: "Neon installations and quiet whispers.", gradient: "var(--venue-gallery)" },
  { id: "beach", name: "Midnight Beach Walk", desc: "Bioluminescent waves, bare feet.", gradient: "var(--venue-beach)" },
];

export interface Turn { speaker: 0 | 1; line: string; thought: string; delta: number; chemistry: number }
export interface DateResult { turns: Turn[]; chemistry: number; verdict: string; debrief: string[]; secondDate: boolean }

export function simulateDate(a: Person, b: Person, venueId: string): DateResult {
  const r = rng(`${[a.id, b.id].sort().join("|")}|${venueId}`);
  const venue = VENUES.find((v) => v.id === venueId) ?? VENUES[0]!;
  const sh = shared(a, b);
  const base = (intellectual(a, b) + lifestyle(a, b)) / 2;
  const att = ATTACH[a.attachment][b.attachment];
  let chem = 50;
  const p = [a, b];
  const turns: Turn[] = [];
  const first = (x: Person) => x.name.split(" ")[0];

  const scripts: ((s: Person, o: Person) => [string, string, number])[] = [
    (s, o) => [`So — ${venue.name.toLowerCase()}. Bold choice. I'm ${first(s)}, but you probably already stalked my Instagram.`, `Open light. Gauge if ${first(o)} has humor before going deep.`, s.traits.humor / 2],
    (s, o) => [`Guilty. Honestly I'm curious — what's the thing you'd do even if nobody paid you?`, `Skip small talk. ${s.needs[0]!} matters to me; test for it.`, 3],
    (s) => [`Probably ${s.hobbies[0]!}. Nobody believes me, but it keeps me sane.`, `Revealing a soft spot. Risky but authentic.`, 4],
    (s, o) => sh.length
      ? [`Wait, you're into ${sh[0]!} too? Okay, now we have to talk about it properly.`, `Shared interest detected: ${sh[0]!}. Lean in hard.`, 9]
      : [`I'll admit I know nothing about ${o.interests[0]!}. Teach me one thing?`, `No overlap. Curiosity is my best play here.`, 2],
    (s, o) => [`Full disclosure: ${s.quirks[0]!.toLowerCase()}.`, `Quirk reveal. If ${first(o)} flinches, that's data.`, s.traits.warmth > 7 ? 5 : 1],
    (s, o) => {
      const clash = o.dealbreakers.some((d) => s.quirks.join(" ").toLowerCase().includes(d.split(" ")[0].toLowerCase()));
      return clash || r() < 0.25
        ? [`Hmm. I have to be honest, ${o.dealbreakers[0]!.toLowerCase()} is kind of a line for me.`, `Red flag adjacent. Say it now rather than later.`, -8]
        : [`That's oddly charming. I'd rather that than ${s.dealbreakers[0]!.toLowerCase()} any day.`, `Green flag. Signal approval without overplaying.`, 6];
    },
    (s) => [`What do you actually need from a partner? Not the LinkedIn answer.`, `Going for depth. Attachment style: ${s.attachment}.`, 4],
    (s) => [`Honestly? ${s.needs.join(" and ")}. Took me years to say that out loud.`, `Vulnerability play. ${s.attachment === "Avoidant" ? "Uncomfortable, but worth it." : "Feels natural."}`, s.attachment === "Avoidant" ? 3 : 7],
    (s, o) => [`If this goes well, next time we do ${o.hobbies[0]!} — your turf.`, `Future-pacing. Watch for hesitation.`, 5],
    (s) => [`Deal. But I'm picking the playlist.`, `Close warm. Leave them wanting more.`, s.traits.humor / 2],
  ];

  scripts.forEach((fn, i) => {
    const s = p[i % 2]!, o = p[(i + 1) % 2]!;
    const [line, thought, d] = fn(s, o);
    const delta = Math.round((d + (r() - 0.4) * 6) * (0.6 + att * 0.6));
    chem = Math.max(5, Math.min(99, chem + delta + (base - 60) / 10));
    turns.push({ speaker: (i % 2) as 0 | 1, line, thought, delta, chemistry: Math.round(chem) });
  });

  const final = Math.round(chem);
  const secondDate = final >= 65;
  const verdict = final >= 80 ? "Sparks flew — book the second date." : final >= 65 ? "Promising. A slow burn worth tending." : final >= 45 ? "Friendly, but the spark is missing." : "Polite handshake. Not a match.";
  const debrief = [
    `${first(a)} rated the night ${Math.round(final / 10)}/10: "${secondDate ? `${first(b)} has real ${b.needs[0]}.` : "Great person, wrong frequency."}"`,
    `${first(b)} rated it ${Math.max(1, Math.round((final + (r() - 0.5) * 16) / 10))}/10: "${sh.length ? `We bonded over ${sh[0]}.` : "We had to work for common ground."}"`,
    `Attachment dynamic: ${a.attachment} × ${b.attachment} (${Math.round(att * 100)}% stability).`,
  ];
  return { turns, chemistry: final, verdict, debrief, secondDate };
}

export interface Score { other: Person; intellectual: number; lifestyle: number; chemistry: number; total: number }
export function rankFor(p: Person, all: Person[]): Score[] {
  return all.filter((o) => o.id !== p.id).map((o) => {
    const i = intellectual(p, o), l = lifestyle(p, o), c = simulateDate(p, o, "rooftop").chemistry;
    return { other: o, intellectual: i, lifestyle: l, chemistry: c, total: Math.round(i * 0.35 + l * 0.3 + c * 0.35) };
  }).sort((x, y) => y.total - x.total);
}

// ---- Public link ingestion ----
const POOL = {
  needs: ["adventure", "deep conversation", "loyalty", "creative freedom", "stability", "laughter", "growth"],
  hobbies: ["running", "photography", "cooking", "travel", "climbing", "reading", "music"],
  interests: ["startups", "design", "AI", "books", "travel", "music", "psychology", "film", "wellness"],
  quirks: ["Has strong opinions about fonts", "Never replies before coffee", "Keeps a dream journal", "Takes 400 photos of every meal"],
  dealbreakers: ["Rudeness to waiters", "Ghosting", "Incuriosity", "Phones at dinner"],
  att: ["Secure", "Anxious", "Avoidant", "Fearful-avoidant"] as Attachment[],
};
export function parseHandle(url: string, kind: "linkedin" | "instagram") {
  const re = kind === "linkedin" ? /linkedin\.com\/in\/([^/?#]+)/i : /instagram\.com\/([^/?#]+)/i;
  const m = url.trim().match(re);
  return m ? decodeURIComponent(m[1] ?? "") : null;
}
export function ingest(linkedin: string, instagram: string, nameHint?: string): Person | string {
  const l = parseHandle(linkedin, "linkedin"), i = parseHandle(instagram, "instagram");
  if (!l) return "That doesn't look like a public LinkedIn profile URL (linkedin.com/in/…).";
  if (!i) return "That doesn't look like a public Instagram profile URL (instagram.com/…).";
  const r = rng(l + i);
  const name = nameHint?.trim() || l.replace(/-[a-z0-9]{5,}$/i, "").split(/[-_.]/).map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
  const n = (k: number) => Math.round(3 + r() * 7 * k);
  const take = (arr: string[], c: number) => [...arr].sort(() => r() - 0.5).slice(0, c);
  return {
    id: `custom-${i}`, name, title: "Ingested from public profiles", category: "Creator",
    linkedin: `https://www.linkedin.com/in/${l}/`, instagram: `https://www.instagram.com/${i}/`, igHandle: i,
    bio: `Agent synthesized from public signals at @${i} and /in/${l}.`,
    needs: take(POOL.needs, 2), hobbies: take(POOL.hobbies, 3), interests: take(POOL.interests, 4),
    attachment: pick(r, POOL.att), quirks: take(POOL.quirks, 2), dealbreakers: take(POOL.dealbreakers, 2),
    traits: { intellect: n(1), energy: n(1), ambition: n(1), humor: n(1), warmth: n(1), adventure: n(1) },
    custom: true,
  };
}
