import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { addPerson, removePerson, useRoster } from "@/lib/store";
import { ingestLive, ingestSeeded } from "@/lib/engine";
import { extractLinkedInHandle, extractInstagramHandle } from "@/lib/scraper";
import type { Category, Person } from "@/lib/people";
import { PEOPLE } from "@/lib/people";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cupid.agent — 25 AI dating agents of real public figures" },
      {
        name: "description",
        content:
          "Browse psychological profile cards of 25 public figures turned into dating agents, or ingest new ones from LinkedIn + Instagram.",
      },
      { property: "og:title", content: "Cupid.agent — The Agentic Dating Roster" },
      {
        property: "og:description",
        content: "25 dating agents built from public profiles. Add your own from two links.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Roster,
});

const CATS: ("All" | Category)[] = ["All", "Tech", "Design", "Creator", "Media"];

// ── Floating hearts hero background ─────────────────────────────────────────
const HEARTS = ["💘", "❤️", "💕", "✨", "💫", "🔥", "💖", "🌹"];
function FloatingHearts() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${8 + i * 11}%`,
            top: `${10 + ((i * 17) % 60)}%`,
            animation: `float ${3.5 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`,
            opacity: 0.15 + (i % 4) * 0.04,
            fontSize: `${1 + (i % 3) * 0.4}rem`,
          }}
        >
          {h}
        </span>
      ))}
    </div>
  );
}

function Roster() {
  const roster = useRoster();
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Person | null>(null);
  const [drawer, setDrawer] = useState(false);

  const list = roster.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      (search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.interests.some((i) => i.toLowerCase().includes(search.toLowerCase()))),
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        className="relative mb-12 overflow-hidden rounded-3xl border border-border p-8 md:p-12"
        style={{ background: "var(--gradient-hero), var(--card)" }}
      >
        <FloatingHearts />
        <div className="relative z-10 grid gap-8 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <p
              className="mb-3 text-xs uppercase tracking-[0.35em] text-primary animate-fade-in-up"
            >
              Agentic dating · {roster.length} agents online
            </p>
            <h1
              className="font-display text-5xl leading-[1.05] text-foreground md:text-7xl animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              Let their{" "}
              <em className="gradient-text not-italic">agents</em> go on the{" "}
              <em className="gradient-text not-italic">first date.</em>
            </h1>
            <p
              className="mt-4 max-w-md text-muted-foreground animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Every agent is a speculative persona built from public LinkedIn and Instagram signals.
              Pick two, send them to the Date Theater, and watch chemistry happen.
            </p>
            <div
              className="mt-6 flex flex-wrap gap-3 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <button
                onClick={() => setDrawer(true)}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-105 active:scale-95"
              >
                + Add candidate
              </button>
              <Link
                to="/theater"
                className="rounded-full border border-primary/40 px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/10"
              >
                Start a date →
              </Link>
            </div>
          </div>

          {/* Stats cluster */}
          <div
            className="grid grid-cols-2 gap-3 animate-fade-in-up"
            style={{ animationDelay: "0.25s" }}
          >
            {[
              { label: "Agents", value: roster.length, emoji: "🤖" },
              {
                label: "Possible pairs",
                value: Math.round((roster.length * (roster.length - 1)) / 2),
                emoji: "💑",
              },
              { label: "Venues", value: 6, emoji: "🌆" },
              { label: "Turns / date", value: 16, emoji: "💬" },
            ].map(({ label, value, emoji }) => (
              <div key={label} className="glass rounded-2xl p-4 text-center">
                <p className="text-2xl">{emoji}</p>
                <p className="font-display text-3xl text-primary">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured quick-start dates ────────────────────────────── */}
      <section className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Featured matches — start here</p>
          <Link to="/rankings" className="text-xs text-muted-foreground hover:text-primary transition">
            See all rankings →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { a: PEOPLE[0]!, b: PEOPLE[3]! },   // Bill Gates ♥ Reid Hoffman
            { a: PEOPLE[7]!, b: PEOPLE[11]! },   // Whitney Wolfe Herd ♥ Tobias van Schneider
            { a: PEOPLE[14]!, b: PEOPLE[24]! },  // Ali Abdaal ♥ Adam Grant
            { a: PEOPLE[22]!, b: PEOPLE[23]! },  // Simon Sinek ♥ Brené Brown
          ].map(({ a, b }) => (
            <Link
              key={`${a.id}-${b.id}`}
              to="/theater"
              search={{ a: a.id, b: b.id }}
              className="card-hover flex items-center gap-3 rounded-2xl border border-border bg-card p-3 glass"
            >
              <div className="flex items-center -space-x-3">
                <Avatar p={a} className="h-10 w-10 ring-2 ring-background" noHover />
                <Avatar p={b} className="h-10 w-10 ring-2 ring-background" noHover />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {a.name.split(" ")[0]} + {b.name.split(" ")[0]}
                </p>
                <p className="text-xs text-primary">Watch them date →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Filters + search ─────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                cat === c
                  ? "border-primary bg-primary/20 text-primary shadow-[var(--shadow-glow-sm)]"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or interest…"
          className="ml-auto rounded-full border border-input bg-card px-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition min-w-[200px]"
        />
        <p className="text-xs text-muted-foreground">
          {list.length} agent{list.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Agent grid ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
        {list.map((p) => (
          <PersonCard key={p.id} p={p} onClick={() => setOpen(p)} />
        ))}
      </div>

      {list.length === 0 && (
        <div className="py-20 text-center animate-fade-in-up">
          <p className="text-4xl">🕵️</p>
          <p className="mt-3 text-muted-foreground">No agents match that filter.</p>
        </div>
      )}

      {open && <ProfileModal p={open} onClose={() => setOpen(null)} />}
      {drawer && <AddDrawer onClose={() => setDrawer(false)} />}
    </main>
  );
}

// ── Person card ──────────────────────────────────────────────────────────────
function PersonCard({ p, onClick }: { p: Person; onClick: () => void }) {
  return (
    <div
      className="card-hover group rounded-2xl border border-border bg-card p-5 text-left neon-border flex flex-col"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Clickable upper area → modal */}
      <button onClick={onClick} className="flex-1 text-left" aria-label={`Open ${p.name} profile`}>
        <div className="flex items-center gap-3">
          <Avatar p={p} className="h-14 w-14" active={p.traits.energy > 7} />
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl text-card-foreground">{p.name}</h3>
            <p className="truncate text-xs text-muted-foreground">{p.title}</p>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">{p.bio}</p>

        {/* Mini trait bars */}
        <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1">
          {(["intellect", "warmth", "humor"] as const).map((k) => (
            <div key={k}>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{k}</p>
              <div className="mt-0.5 h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full chem-fill"
                  style={{ width: `${p.traits[k] * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary font-medium">
            {p.category}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {p.attachment}
          </span>
          {p.custom && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
              ✦ Ingested
            </span>
          )}
        </div>
      </button>

      {/* Action row */}
      <div className="mt-3 flex gap-2 pt-3 border-t border-border">
        <Link
          to="/profile"
          search={{ id: p.id }}
          className="flex-1 rounded-full border border-border py-1.5 text-center text-xs text-foreground hover:border-primary hover:text-primary transition"
          onClick={(e) => e.stopPropagation()}
        >
          View profile
        </Link>
        <Link
          to="/theater"
          search={{ a: p.id }}
          className="flex-1 rounded-full bg-primary/15 py-1.5 text-center text-xs text-primary hover:bg-primary/25 transition"
          onClick={(e) => e.stopPropagation()}
        >
          Send on date
        </Link>
      </div>
    </div>
  );
}

// ── Profile modal ────────────────────────────────────────────────────────────
function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span key={i} className="rounded-full border border-border px-2.5 py-0.5 text-sm text-foreground">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileModal({ p, onClose }: { p: Person; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => { modalRef.current?.focus(); }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Profile of ${p.name}`}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 animate-scale-in focus:outline-none shadow-[var(--shadow-glow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <Avatar p={p} className="h-24 w-24" active />
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-3xl text-card-foreground">{p.name}</h2>
            <p className="text-sm text-muted-foreground">{p.title}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <a
                href={p.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2 hover:text-accent transition"
              >
                in LinkedIn
              </a>
              <a
                href={p.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2 hover:text-accent transition"
              >
                📷 @{p.igHandle}
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border p-1.5 text-muted-foreground hover:border-primary hover:text-primary transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mt-4 text-foreground leading-relaxed">{p.bio}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Row label="Needs" items={p.needs} />
          <Row label="Hobbies" items={p.hobbies} />
          <Row label="Interests" items={p.interests} />
          <Row label="Attachment style" items={[p.attachment]} />
          <Row label="Quirks" items={p.quirks} />
          <Row label="Dealbreakers" items={p.dealbreakers} />
        </div>

        {/* Trait bars */}
        <div className="mt-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Agent trait vector
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {(Object.entries(p.traits) as [string, number][]).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <p className="w-20 text-xs capitalize text-muted-foreground">{k}</p>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full chem-fill animate-bar-grow"
                    style={
                      { "--bar-width": `${v * 10}%`, width: `${v * 10}%` } as React.CSSProperties
                    }
                  />
                </div>
                <span className="w-4 text-right text-xs text-primary font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 text-xs text-muted-foreground italic">
          Speculative persona for entertainment, inferred from public content.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/theater"
            search={{ a: p.id }}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow-sm)] hover:scale-105 transition"
          >
            💘 Send on a date
          </Link>
          <Link
            to="/matrix"
            className="rounded-full border border-border px-5 py-2 text-sm text-foreground hover:border-primary hover:text-primary transition"
          >
            📊 See rankings
          </Link>
          {p.custom && (
            <button
              onClick={() => { removePerson(p.id); onClose(); }}
              className="rounded-full border border-destructive px-5 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Drawer ───────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Validating public URLs", emoji: "🔗" },
  { label: "Fetching profile metadata via CORS proxy", emoji: "📡" },
  { label: "Extracting interests, tone & signals", emoji: "🔍" },
  { label: "Synthesizing attachment style & traits", emoji: "🧠" },
  { label: "Birthing your dating agent", emoji: "💘" },
];

function AddDrawer({ onClose }: { onClose: () => void }) {
  const [li, setLi] = useState("");
  const [ig, setIg] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState<Person | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<"idle" | "live" | "fallback">("idle");

  const run = async () => {
    // Validate handles first
    const liHandle = extractLinkedInHandle(li);
    const igHandle = extractInstagramHandle(ig);
    if (!liHandle) {
      setErr("That doesn't look like a public LinkedIn profile URL (linkedin.com/in/…).");
      return;
    }
    if (!igHandle) {
      setErr("That doesn't look like a public Instagram profile URL (instagram.com/…).");
      return;
    }
    setErr("");
    setDone(null);
    setScrapeStatus("idle");
    setStep(0);

    const result = await ingestLive(li, ig, name || undefined, (s) => {
      setStep(s);
    });

    if (typeof result === "string") {
      // Live scrape failed entirely — try seeded fallback
      setScrapeStatus("fallback");
      const fallback = ingestSeeded(liHandle, igHandle, name || undefined);
      addPerson(fallback);
      setDone(fallback);
      setStep(STEPS.length);
    } else {
      setScrapeStatus(result.photoUrl ? "live" : "fallback");
      addPerson(result);
      setDone(result);
      setStep(STEPS.length);
    }
  };

  const running = step >= 0 && !done;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add candidate"
    >
      <aside
        className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6 animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-3xl text-card-foreground">Add candidate</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-border p-1.5 text-muted-foreground hover:border-primary hover:text-primary transition"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Paste two public links. We scrape their OpenGraph metadata and synthesize a dating agent.
        </p>

        <div className="space-y-4">
          {(
            [
              ["Display name (optional)", name, setName, "Jane Doe", "text"],
              ["LinkedIn URL", li, setLi, "https://www.linkedin.com/in/janedoe", "url"],
              ["Instagram URL", ig, setIg, "https://www.instagram.com/janedoe", "url"],
            ] as [string, string, (v: string) => void, string, string][]
          ).map(([label, value, setter, placeholder, type]) => (
            <label key={label} className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
              <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => setter(e.target.value)}
                disabled={running}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-foreground outline-none focus:border-primary transition placeholder:text-muted-foreground/50 disabled:opacity-50"
              />
            </label>
          ))}

          {err && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </p>
          )}

          <button
            onClick={run}
            disabled={running}
            className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {running ? "Analyzing…" : "Analyze & create agent"}
          </button>
        </div>

        {/* How it works */}
        {step < 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">How it works</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We fetch public OpenGraph metadata from both profiles using a CORS proxy gateway,
              parse OG tags for bio, avatar and headline, then run a keyword-based psychological
              synthesis to infer attachment style, traits, needs and quirks. No login required.
            </p>
          </div>
        )}

        {/* Progress steps */}
        {step >= 0 && (
          <ol className="mt-6 space-y-2.5">
            {STEPS.map((s, i) => {
              const isDone = i < step || !!done;
              const isActive = i === step && !done;
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                    isDone || isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base transition-all ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "bg-primary/30 text-primary animate-pulse"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isDone ? "✓" : s.emoji}
                  </span>
                  <span className="flex-1">{s.label}</span>
                  {isActive && (
                    <span className="flex gap-1">
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {/* Scrape status indicator */}
        {done && scrapeStatus !== "idle" && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
              scrapeStatus === "live"
                ? "border-chart-5/40 bg-chart-5/10 text-chart-5"
                : "border-accent/40 bg-accent/10 text-accent"
            }`}
          >
            {scrapeStatus === "live"
              ? "✓ Live scrape succeeded — real avatar and bio extracted."
              : "⚡ CORS proxy rate-limited — using synthesized persona from handle signals."}
          </div>
        )}

        {/* Success card */}
        {done && (
          <div className="mt-4 rounded-2xl border border-primary/50 bg-primary/5 p-4 animate-scale-in">
            <p className="mb-3 text-xs uppercase tracking-widest text-primary">Agent created ✓</p>
            <div className="flex items-center gap-3">
              <Avatar p={done} className="h-16 w-16" active />
              <div>
                <p className="font-display text-xl text-foreground">{done.name}</p>
                <p className="text-xs text-muted-foreground">{done.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {done.attachment} · {done.interests.slice(0, 3).join(", ")}
                </p>
              </div>
            </div>

            {/* Mini trait preview */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["intellect", "warmth", "humor"] as const).map((k) => (
                <div key={k} className="rounded-lg bg-secondary px-2 py-1.5 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{k}</p>
                  <p className="font-display text-lg text-primary">{done.traits[k]}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                to="/theater"
                search={{ a: done.id }}
                className="flex-1 rounded-full bg-primary py-2 text-center text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow-sm)]"
              >
                💘 Send on a date
              </Link>
              <button
                onClick={onClose}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:border-primary transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
