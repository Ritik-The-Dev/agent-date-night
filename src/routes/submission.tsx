import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/submission")({
  head: () => ({
    meta: [
      { title: "Challenge Submission Kit | Cupid.agent" },
      { name: "description", content: "200-character summary, scraping architecture and the 3-minute demo video storyboard." },
      { property: "og:title", content: "Cupid.agent — Submission Kit" },
      { property: "og:description", content: "Summary, architecture and video storyboard for the agentic dating challenge." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Kit,
});

const SUMMARY = "Cupid.agent turns public LinkedIn + Instagram profiles into dating agents with psych profiles, sends any pair on a live simulated date with inner monologue & chemistry, then ranks best matches.";

const ARCH = [
  ["1. URL intake", "Validate linkedin.com/in/<slug> and instagram.com/<handle>; extract handles; reject private or malformed links."],
  ["2. Public fetch", "Fetch only public metadata (OpenGraph title, description, avatar) via a server worker with polite rate limits, caching and robots.txt respect. No logins, no private data."],
  ["3. Signal extraction", "Headline, role and posts → interests & ambition; captions, emoji and posting cadence → energy, humor, warmth."],
  ["4. Persona synthesis", "An LLM maps signals to a fixed schema: needs, hobbies, interests, attachment style, quirks, dealbreakers, trait vector (0–10)."],
  ["5. Agent runtime", "Each agent gets a system prompt from its card. A date orchestrator alternates turns, each returning {spoken, private_thought, chemistry_delta}."],
  ["6. Scoring", "Intellectual synergy (interest overlap + intellect fit), lifestyle vibe (energy/adventure/ambition distance), chemistry (simulated date), attachment-pair stability."],
];

const STORY = [
  ["0:00–0:20", "Hook", "\"What if your AI went on the first date for you?\" Fast pan across the 25-agent roster."],
  ["0:20–0:50", "Profiles", "Open two cards: needs, attachment style, quirks, dealbreakers, real public links."],
  ["0:50–1:20", "Ingestion", "Paste a LinkedIn + Instagram pair into Add Candidate; watch the 5-step analysis birth a new agent."],
  ["1:20–2:20", "Date Theater", "Pick a pair + venue. Turn-by-turn banter, toggle Agent Brain to reveal private strategy, chemistry meter swings, debrief + verdict."],
  ["2:20–2:45", "Matrix", "Leaderboard of best fits; power couples; jump into a rematch from a row."],
  ["2:45–3:00", "Close", "Architecture slide + summary line. \"Let the agents flirt. You just show up for the second date.\""],
];

function Kit() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-5xl text-foreground">Submission <em className="text-primary">Kit</em></h1>

      <section className="mt-8 rounded-3xl border border-primary/50 bg-card p-6">
        <div className="flex items-center justify-between"><h2 className="font-display text-2xl text-card-foreground">200-character summary</h2><span className="text-sm text-primary">{SUMMARY.length}/200</span></div>
        <p className="mt-3 text-lg text-foreground">{SUMMARY}</p>
        <button onClick={() => navigator.clipboard.writeText(SUMMARY)} className="mt-4 rounded-full border border-border px-4 py-1.5 text-sm text-foreground">Copy</button>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-3xl text-foreground">Scraping & agent architecture</h2>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-secondary p-4 text-xs text-secondary-foreground">{`[LinkedIn URL] + [Instagram URL]
        │ validate + extract handles
        ▼
  Public metadata fetcher (cached, rate-limited)
        ▼
  Signal extractor ──► LLM persona synthesizer ──► Profile card (schema)
                                                       ▼
                         Date orchestrator ◄── Agent A / Agent B
                               ▼
              turns {spoken, thought, Δchemistry} ──► Debrief + Matrix`}</pre>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {ARCH.map(([t, d]) => <div key={t} className="rounded-2xl border border-border bg-card p-4"><p className="font-medium text-primary">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>)}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Prototype note: this build runs a deterministic in-browser persona + date engine so every demo is reproducible; the live LLM step slots in at stages 4–5.</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-3xl text-foreground">3-minute video storyboard</h2>
        <ol className="mt-4 space-y-3">
          {STORY.map(([t, h, d]) => (
            <li key={t} className="grid grid-cols-[110px_1fr] gap-4 rounded-2xl border border-border bg-card p-4">
              <span className="font-display text-lg text-primary">{t}</span>
              <div><p className="font-medium text-card-foreground">{h}</p><p className="text-sm text-muted-foreground">{d}</p></div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
