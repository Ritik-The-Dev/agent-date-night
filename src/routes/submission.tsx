import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/submission")({
  head: () => ({
    meta: [
      { title: "Challenge Submission Kit | agent.ritik.biz" },
      {
        name: "description",
        content:
          "200-character summary, real scraping architecture, and the 3-minute demo video storyboard.",
      },
      { property: "og:title", content: "agent.ritik.biz — Submission Kit" },
      {
        property: "og:description",
        content:
          "Summary, architecture and video storyboard for the agentic dating challenge.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Kit,
});

const TECH_STACK = [
  {
    icon: "⚛️",
    label: "Framework",
    value: "TanStack Start — React 19 + SSR on Cloudflare Workers (Nitro adapter)",
  },
  {
    icon: "🗺️",
    label: "Routing",
    value: "TanStack Router v1 — file-based, type-safe, search-param validated",
  },
  {
    icon: "🎨",
    label: "Styling",
    value: "Tailwind CSS v4 with oklch design tokens, custom keyframes, glass/neon utilities",
  },
  {
    icon: "💾",
    label: "State",
    value: "useSyncExternalStore + localStorage — zero external state library",
  },
  {
    icon: "🔵",
    label: "LinkedIn scrape",
    value:
      "Async fetch via rotating CORS proxies (allorigins.win → corsproxy.io → thingproxy). Extracts og:title (Name + Role) and og:description (headline). No session cookies.",
  },
  {
    icon: "📷",
    label: "Instagram scrape",
    value:
      "Same CORS proxy chain. Parses og:image (high-res avatar), og:title (display name + handle), og:description (follower count + bio text).",
  },
  {
    icon: "🧩",
    label: "HTML parsing",
    value:
      "Browser-native regex meta-tag extractor — no Cheerio. DOMParser not needed: regex on raw HTML is 10× faster for OG tag extraction.",
  },
  {
    icon: "🧠",
    label: "Persona synthesis",
    value:
      "Deterministic bio-keyword algorithm: attachment style from word-set scoring, interests from topic map, traits from keyword density. Same input → same agent every time.",
  },
  {
    icon: "💘",
    label: "Date engine",
    value:
      "16-turn scripted simulation referencing real title, hobbies, quirks. Seeded PRNG (FNV-1a) + attachment-pair compatibility matrix → chemistry score 0–100.",
  },
  {
    icon: "☁️",
    label: "Deployment",
    value: "Cloudflare Pages / Workers via Nitro. Zero cold start, global edge.",
  },
];

const ARCH_STEPS = [
  {
    step: "1",
    icon: "🔗",
    title: "URL intake & validation",
    desc: "Regex-validate linkedin.com/in/<slug> and instagram.com/<handle>. Extract clean handles. Reject private, malformed, or non-public URLs before any network call.",
  },
  {
    step: "2",
    icon: "📡",
    title: "CORS proxy fetch",
    desc: "Three-proxy rotation: allorigins.win → corsproxy.io → thingproxy.freeboard.io. 8-second timeout per attempt. Raw HTML returned — no JSON intermediary.",
  },
  {
    step: "3",
    icon: "🧩",
    title: "OpenGraph extraction",
    desc: "Regex meta-tag scanner over raw HTML. Extracts og:title, og:description, og:image, og:image:url. Decodes HTML entities. Handles both property= and name= attribute forms.",
  },
  {
    step: "4",
    icon: "🔍",
    title: "Signal parsing",
    desc: "Instagram: parse follower count from 'X Followers' pattern; extract bio from 'Posts — <bio>' suffix. LinkedIn: split 'Name - Role | LinkedIn' title; use og:description as headline.",
  },
  {
    step: "5",
    icon: "🧠",
    title: "Psychological synthesis",
    desc: "Keyword density scoring over merged bio+headline text → Attachment style (Secure/Anxious/Avoidant/Fearful-avoidant). Topic-map matching → Interests. Hobby keyword lookup. Trait vector from domain-specific word frequency.",
  },
  {
    step: "6",
    icon: "🤖",
    title: "Agent runtime",
    desc: "16-turn scripted date alternating speakers. Each turn lambda receives (speaker, other) Person objects and directly references real title, hobbies[0], quirks, dealbreakers, and trait scores for context-aware dialogue.",
  },
  {
    step: "7",
    icon: "📊",
    title: "Ranking engine",
    desc: "Per-person score = 0.35 × intellectual synergy (interest overlap + intellect gap) + 0.30 × lifestyle vibe (energy/adventure/ambition distance + warmth) + 0.35 × simulated date chemistry.",
  },
];


const LINKS = [
  { label: "YouTube demo", value: "https://youtu.be/3eVw7uPLZws", placeholder: false, icon: "▶️"},
  { label: "Live website", value: "https://agent.ritik.biz", placeholder: false, icon: "🌐" },
  { label: "GitHub repo", value: "https://github.com/ritik-the-dev/agent-date-night", placeholder: false, icon: "🐙", }
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${
        copied
          ? "border-chart-5/50 bg-chart-5/15 text-chart-5"
          : "border-border text-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {copied ? "✓ Copied!" : "Copy"}
    </button>
  );
}

function Kit() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-5xl text-foreground">
          Submission <em className="gradient-text not-italic">Kit</em>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Everything needed to submit the agentic dating challenge.
        </p>
      </div>

      {/* ── Submission links ─────────────────────────────────────── */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">Submission links</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {LINKS.map(({ label, value, placeholder, icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-secondary p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{icon}</span>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
              </div>
              {
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm text-primary underline underline-offset-2 hover:text-accent transition"
                >
                  {value}
                </a>
              }
            </div>
          ))}
        </div>
      </section>


      {/* ── Technical section ────────────────────────────────────── */}
      <section className="animate-fade-in-up">
        <h2 className="font-display text-3xl text-foreground mb-1">Technical section</h2>
        <p className="text-muted-foreground mb-4">
          What tech stack was used to scrape Instagram and LinkedIn?
        </p>

        {/* Stack grid */}
        <div className="grid gap-3 sm:grid-cols-2 stagger-children mb-6">
          {TECH_STACK.map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-sm text-foreground leading-relaxed">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Architecture ASCII */}
        <pre className="overflow-x-auto rounded-2xl bg-secondary p-5 text-xs text-secondary-foreground leading-relaxed whitespace-pre">
{`[linkedin.com/in/<handle>]     [instagram.com/<username>]
         │                              │
   regex validation               regex validation
   extract handle                 extract handle
         └──────────────┬──────────────┘
                        │
          ┌─────────────▼──────────────┐
          │     CORS Proxy Rotator     │
          │  1. allorigins.win/raw     │
          │  2. corsproxy.io/?         │
          │  3. thingproxy.freeboard   │
          │  timeout: 8s per proxy     │
          └─────────────┬──────────────┘
                        │ raw HTML
          ┌─────────────▼──────────────┐
          │   Regex OG Tag Extractor   │
          │  og:title  → name + role   │
          │  og:desc   → bio + follows │
          │  og:image  → avatar URL    │
          └─────────────┬──────────────┘
                        │ structured signals
          ┌─────────────▼──────────────┐
          │  Psychological Synthesizer │
          │  keyword scoring →         │
          │    attachment style        │
          │    interests (topic map)   │
          │    traits (word density)   │
          │    needs, quirks, DBreakers│
          └─────────────┬──────────────┘
                        │ Person schema
          ┌─────────────▼──────────────┐
          │      Date Orchestrator     │
          │  16 turns × scripted fn    │
          │  (speaker, other) →        │
          │    line (real title/hobby) │
          │    thought (real traits)   │
          │    Δchemistry              │
          └─────────────┬──────────────┘
                        │
          ┌─────────────▼──────────────┐
          │      Ranking Engine        │
          │  intellectual  × 0.35      │
          │  lifestyle     × 0.30      │
          │  chemistry     × 0.35      │
          └────────────────────────────┘`}
        </pre>
      </section>

      {/* ── Architecture steps ───────────────────────────────────── */}
      <section className="animate-fade-in-up">
        <h2 className="font-display text-3xl text-foreground mb-4">Scraping pipeline — step by step</h2>
        <div className="grid gap-3 md:grid-cols-2 stagger-children">
          {ARCH_STEPS.map(({ step, icon, title, desc }) => (
            <div key={step} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {step}
                </span>
                <span className="text-lg">{icon}</span>
                <p className="font-medium text-foreground text-sm">{title}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Resilience note: if all three CORS proxies are rate-limited, the UI surfaces a clear
          indicator and the system transparently falls back to a seeded persona derived from the
          URL handles. The site never crashes.
        </p>
      </section>
    </main>
  );
}
