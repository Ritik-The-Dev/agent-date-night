import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Avatar } from "@/components/Avatar";
import { useRoster } from "@/lib/store";
import { simulateDate, VENUES } from "@/lib/engine";

export const Route = createFileRoute("/theater")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { a?: string; b?: string } => ({
    a: typeof s["a"] === "string" ? s["a"] : undefined,
    b: typeof s["b"] === "string" ? s["b"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Date Theater — Watch two AI agents go on a date | Cupid.agent" },
      {
        name: "description",
        content:
          "A live, turn-by-turn date simulation with inner monologue, chemistry meter and post-date verdict.",
      },
      { property: "og:title", content: "The Date Theater" },
      {
        property: "og:description",
        content: "Watch two dating agents banter, think privately and decide on a second date.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Theater,
});

// ── Confetti ─────────────────────────────────────────────────────────────────
interface ConfettiPiece {
  id: number; left: string; color: string; size: number;
  fallDur: string; swayDur: string; delay: string; shape: string;
}
function useConfetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const burst = useCallback(() => {
    const colors = ["#e85d4a", "#f4a261", "#e9c46a", "#52b788", "#a8dadc", "#cdb4db"];
    const shapes = ["▲", "●", "■", "♥", "★", "◆"];
    const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      size: 8 + Math.floor(Math.random() * 10),
      fallDur: `${2.5 + Math.random() * 2}s`,
      swayDur: `${1.5 + Math.random() * 1.5}s`,
      delay: `${Math.random() * 0.8}s`,
      shape: shapes[Math.floor(Math.random() * shapes.length)]!,
    }));
    setPieces(newPieces);
    setTimeout(() => setPieces([]), 5500);
  }, []);
  return { pieces, burst };
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ speaker }: { speaker: 0 | 1 }) {
  return (
    <div className={`flex ${speaker === 1 ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-center gap-1.5 rounded-2xl px-4 py-3 ${
        speaker === 0 ? "bg-card/90" : "bg-primary/40"
      }`}>
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}

// ── Spark burst ───────────────────────────────────────────────────────────────
function SparkBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20" aria-hidden>
      {["✨", "💫", "⚡", "🔥", "💥"].map((e, i) => (
        <span
          key={i}
          className="absolute text-2xl animate-sparkle"
          style={{
            animationDelay: `${i * 0.15}s`,
            left: `${25 + i * 12}%`,
            top: `${38 + (i % 2) * 18}%`,
          }}
        >
          {e}
        </span>
      ))}
    </div>
  );
}

// ── Speed options ─────────────────────────────────────────────────────────────
const SPEEDS: { label: string; ms: number }[] = [
  { label: "0.5×", ms: 3200 },
  { label: "1×",   ms: 1600 },
  { label: "2×",   ms: 800  },
  { label: "3×",   ms: 400  },
];

function Theater() {
  const roster = useRoster();
  const searchParams = Route.useSearch();
  const [aId, setA] = useState(searchParams.a ?? roster[0]!.id);
  const [bId, setB] = useState(searchParams.b ?? roster[7]!.id);
  const [venue, setVenue] = useState(VENUES[0]!.id);

  // Playback state
  const [shown, setShown] = useState(-1);           // index of last revealed turn
  const [paused, setPaused] = useState(false);
  const [typing, setTyping] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);      // default 1× = 1600ms
  const speed = SPEEDS[speedIdx]!.ms;

  const [showSpark, setShowSpark] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { pieces, burst } = useConfetti();

  const [brain, setBrain] = useState(true);

  const a = (roster.find((p) => p.id === aId) ?? roster[0])!;
  const b = (roster.find((p) => p.id === bId) ?? roster[1])!;
  const res = useMemo(() => simulateDate(a, b, venue), [a, b, venue]);
  const v = VENUES.find((x) => x.id === venue)!;

  const playing  = shown >= 0 && shown < res.turns.length && !paused;
  const started  = shown >= 0;
  const finished = shown >= res.turns.length;

  // Reset on pair/venue change
  useEffect(() => {
    setShown(-1);
    setPaused(false);
    setTyping(false);
  }, [aId, bId, venue]);

  // Auto-advance with typing indicator
  useEffect(() => {
    if (!playing) return;
    setTyping(true);
    const typingMs = Math.min(speed * 0.5, 800);
    const t1 = setTimeout(() => {
      setTyping(false);
      const turn = res.turns[shown];
      if (turn?.spark) {
        setShowSpark(true);
        setTimeout(() => setShowSpark(false), 1200);
      }
      setShown((s) => s + 1);
    }, typingMs + speed * 0.5);
    return () => clearTimeout(t1);
  }, [shown, playing, speed, res.turns]);

  // Confetti on high chemistry finish
  useEffect(() => {
    if (finished && res.chemistry >= 75) burst();
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [shown, typing]);

  const chem = shown < 0 ? 50
    : res.turns[Math.min(shown, res.turns.length - 1)]!.chemistry;
  const chemColor = chem >= 75 ? "text-chart-5" : chem >= 50 ? "text-primary" : "text-destructive";

  const select =
    "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-foreground focus:border-primary outline-none transition";

  // Step-by-step: reveal one turn manually
  const stepForward = () => {
    if (finished) return;
    if (!started) { setShown(0); return; }
    setPaused(true);
    setTyping(false);
    setShown((s) => Math.min(s + 1, res.turns.length));
  };

  const stepBack = () => {
    setTyping(false);
    setShown((s) => Math.max(-1, s - 1));
  };

  const restart = () => {
    setShown(0);
    setPaused(false);
    setTyping(false);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Confetti */}
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left, top: "-20px",
            color: p.color, fontSize: `${p.size}px`,
            "--fall-dur": p.fallDur, "--sway-dur": p.swayDur, "--fall-delay": p.delay,
            zIndex: 9999,
          } as React.CSSProperties}
          aria-hidden
        >
          {p.shape}
        </div>
      ))}

      <h1 className="font-display text-5xl text-foreground">
        The Date <em className="gradient-text not-italic">Theater</em>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Pick two agents and a venue. Watch chemistry unfold in real time.
      </p>

      {/* ── Controls row ─────────────────────────────────────────── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Agent A</p>
          <select
            className={select}
            value={aId}
            onChange={(e) => setA(e.target.value)}
          >
            {roster.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === bId}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Agent B</p>
          <select
            className={select}
            value={bId}
            onChange={(e) => setB(e.target.value)}
          >
            {roster.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === aId}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Venue</p>
          <select
            className={select}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          >
            {VENUES.map((x) => (
              <option key={x.id} value={x.id}>{x.emoji} {x.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          {!started || finished ? (
            <button
              onClick={restart}
              className="rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.02]"
            >
              {finished ? "🔄 Replay" : "💘 Start the date"}
            </button>
          ) : (
            <button
              onClick={() => setPaused((p) => !p)}
              className="rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.02]"
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
          )}
        </div>
      </div>

      {/* ── Playback toolbar ─────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Speed toggle */}
        <div className="flex rounded-xl border border-border overflow-hidden">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSpeedIdx(i)}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                speedIdx === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Step controls */}
        <button
          onClick={stepBack}
          disabled={!started}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary transition disabled:opacity-40"
          title="Step back one turn"
        >
          ◀ Step
        </button>
        <button
          onClick={stepForward}
          disabled={finished}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary transition disabled:opacity-40"
          title="Step forward one turn"
        >
          Step ▶
        </button>

        {/* Turn counter */}
        <span className="text-xs text-muted-foreground ml-1">
          {started
            ? `Turn ${Math.min(shown, res.turns.length)} / ${res.turns.length}`
            : "Not started"}
        </span>

        {/* Brain toggle */}
        <label className="ml-auto flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background/30 px-4 py-1.5 text-sm text-foreground backdrop-blur select-none">
          <input
            type="checkbox"
            checked={brain}
            onChange={(e) => setBrain(e.target.checked)}
            className="accent-primary"
          />
          🧠 Agent Brain
        </label>
      </div>

      {/* ── Venue stage ──────────────────────────────────────────── */}
      <section
        className="relative mt-4 overflow-hidden rounded-3xl border border-border"
        style={{ background: v.gradient }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background: "radial-gradient(circle at 50% 120%, oklch(0.72 0.19 15), transparent 55%)",
            animation: playing ? "glow-pulse 2.5s ease-in-out infinite" : "none",
          }}
          aria-hidden
        />
        <SparkBurst active={showSpark} />

        <div className="relative p-6">
          {/* Venue header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Tonight's venue</p>
              <p className="font-display text-2xl text-foreground">{v.emoji} {v.name}</p>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </div>
          </div>

          {/* Chemistry meter */}
          <div className="mt-5">
            <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground mb-1">
              <span>Chemistry</span>
              <span className={`font-bold ${chemColor}`}>{chem}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-background/50">
              <div className="h-full rounded-full chem-fill" style={{ width: `${chem}%` }} />
            </div>
            {chem >= 75 && finished && (
              <p className="mt-1 text-xs text-chart-5 animate-fade-in-up">
                🔥 High chemistry detected!
              </p>
            )}
          </div>

          {/* Agents + chat */}
          <div className="mt-6 grid grid-cols-[64px_1fr_64px] gap-4">
            {/* Agent A */}
            <div className="flex flex-col items-center gap-2">
              <Avatar
                p={a}
                className={`h-16 w-16 transition-all duration-500 ${
                  playing && res.turns[shown]?.speaker === 0
                    ? "scale-110"
                    : "scale-95 opacity-70"
                }`}
                active={playing && res.turns[shown]?.speaker === 0}
              />
              <p className="text-center text-xs text-foreground font-medium">
                {a.name.split(" ")[0]}
              </p>
            </div>

            {/* Chat */}
            <div
              ref={chatRef}
              className="min-h-[500px] max-h-[560px] overflow-y-auto space-y-3 pr-1"
            >
              {!started && (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
                  <p className="text-5xl animate-float">💘</p>
                  <p className="text-muted-foreground">
                    Press start. The agents are fixing their hair.
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Use speed controls to adjust pace, or step through turn by turn.
                  </p>
                </div>
              )}

              {res.turns.slice(0, Math.max(0, shown + 1)).map((t, i) => (
                <div
                  key={i}
                  className={`flex animate-in fade-in slide-in-from-bottom-2 flex-col duration-500 ${
                    t.speaker === 1 ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                      t.speaker === 0
                        ? "bg-card/90 text-card-foreground rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    } ${t.spark ? "ring-2 ring-accent/60 shadow-[var(--shadow-accent)]" : ""}`}
                  >
                    {t.spark && <span className="mr-1">✨</span>}
                    {t.line}
                  </div>
                  {brain && (
                    <p className="mt-1 max-w-xs text-xs italic text-muted-foreground leading-relaxed">
                      🧠 {t.thought}{" "}
                      <span
                        className={`font-medium ${
                          t.delta >= 0 ? "text-chart-5" : "text-destructive"
                        }`}
                      >
                        ({t.delta >= 0 ? "+" : ""}{t.delta})
                      </span>
                    </p>
                  )}
                </div>
              ))}

              {typing && started && (
                <TypingIndicator speaker={(shown % 2) as 0 | 1} />
              )}
            </div>

            {/* Agent B */}
            <div className="flex flex-col items-center gap-2">
              <Avatar
                p={b}
                className={`h-16 w-16 transition-all duration-500 ${
                  playing && res.turns[shown]?.speaker === 1
                    ? "scale-110"
                    : "scale-95 opacity-70"
                }`}
                active={playing && res.turns[shown]?.speaker === 1}
              />
              <p className="text-center text-xs text-foreground font-medium">
                {b.name.split(" ")[0]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Post-date debrief ─────────────────────────────────────── */}
      {finished && (
        <section className="mt-6 rounded-3xl border border-primary/40 bg-card p-6 animate-scale-in shadow-[var(--shadow-glow)]">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Post-date debrief</p>
          <div className="mt-2 flex items-baseline gap-4">
            <h2 className="font-display text-4xl text-card-foreground">{res.chemistry}%</h2>
            <p className="text-lg text-foreground">{res.verdict}</p>
          </div>

          {/* Chemistry ring */}
          <div className="mt-4 flex items-center gap-6 flex-wrap">
            <div className="relative h-20 w-20 shrink-0">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke="oklch(0.25 0.05 350)"
                  strokeWidth="8"
                />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke="oklch(0.72 0.19 15)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - res.chemistry / 100)}`}
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.2,0.64,1)" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-lg text-primary">
                {res.chemistry}
              </span>
            </div>
            <ul className="space-y-1.5 text-sm text-foreground stagger-children">
              {res.debrief.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span> {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                res.secondDate
                  ? "bg-chart-5/20 text-chart-5 border border-chart-5/40"
                  : "bg-destructive/15 text-destructive border border-destructive/30"
              }`}
            >
              {res.secondDate ? "✓ Second date: YES" : "✕ Second date: no"}
            </span>
            <button
              onClick={restart}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary transition"
            >
              🔄 Replay
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
