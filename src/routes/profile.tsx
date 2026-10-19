import { createFileRoute, Link } from "@tanstack/react-router";
import { Avatar } from "@/components/Avatar";
import { useRoster } from "@/lib/store";
import { rankFor, VENUES, simulateDate } from "@/lib/engine";
import { useMemo } from "react";

export const Route = createFileRoute("/profile")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Agent Profile | Cupid.agent" },
      { name: "description", content: "Deep profile page for a dating agent." },
    ],
  }),
  component: ProfilePage,
});

// ── Radar SVG ────────────────────────────────────────────────────────────────
function RadarChart({ traits }: { traits: Record<string, number> }) {
  const labels = ["intellect", "energy", "ambition", "humor", "warmth", "adventure"] as const;
  const n = labels.length;
  const cx = 140, cy = 140, maxR = 110;
  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (val: number, i: number) => {
    const angle = angleOf(i);
    const d = (val / 10) * maxR;
    return { x: cx + d * Math.cos(angle), y: cy + d * Math.sin(angle) };
  };
  const rings = [2, 4, 6, 8, 10];
  const polyPts = labels.map((l, i) => pt(traits[l]!, i)).map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-xs mx-auto" aria-label="Trait radar chart">
      {/* Grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={labels.map((_, i) => pt(ring, i)).map(({ x, y }) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="oklch(0.30 0.055 350)"
          strokeWidth="1"
          opacity="0.7"
        />
      ))}
      {/* Axis lines */}
      {labels.map((_, i) => {
        const { x, y } = pt(10, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(0.30 0.055 350)" strokeWidth="1" opacity="0.5" />;
      })}
      {/* Filled polygon */}
      <polygon
        points={polyPts}
        fill="oklch(0.72 0.19 15 / 0.25)"
        stroke="oklch(0.72 0.19 15)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Dots on vertices */}
      {labels.map((l, i) => {
        const { x, y } = pt(traits[l]!, i);
        return <circle key={l} cx={x} cy={y} r="4" fill="oklch(0.72 0.19 15)" />;
      })}
      {/* Labels */}
      {labels.map((label, i) => {
        const { x, y } = pt(12.5, i);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="oklch(0.70 0.03 20)"
            className="capitalize"
          >
            {label}
          </text>
        );
      })}
      {/* Center score */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="oklch(0.72 0.19 15)" fontWeight="bold">
        {Math.round(Object.values(traits).reduce((a, b) => a + b, 0) / Object.keys(traits).length * 10)}%
      </text>
    </svg>
  );
}

function Tag({ children, variant = "default" }: { children: string; variant?: "default" | "primary" | "accent" | "destructive" }) {
  const cls = {
    default: "border-border text-foreground",
    primary: "border-primary/40 bg-primary/15 text-primary",
    accent: "border-accent/40 bg-accent/10 text-accent",
    destructive: "border-destructive/40 bg-destructive/10 text-destructive",
  }[variant];
  return (
    <span className={`rounded-full border px-3 py-1 text-sm ${cls}`}>{children}</span>
  );
}

function ProfilePage() {
  const roster = useRoster();
  const { id } = Route.useSearch();
  const person = id ? roster.find((p) => p.id === id) : null;

  if (!person) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-6xl">💔</p>
        <h1 className="mt-4 font-display text-3xl text-foreground">Agent not found</h1>
        <p className="mt-2 text-muted-foreground">This agent might not exist or hasn't been created yet.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
          Back to roster
        </Link>
      </main>
    );
  }

  const top5 = useMemo(() => rankFor(person, roster).slice(0, 5), [person, roster]);
  const sampleDate = useMemo(
    () => top5.length > 0 ? simulateDate(person, top5[0]!.other, VENUES[0]!.id) : null,
    [person, top5],
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary transition">Roster</Link>
        <span>›</span>
        <span className="text-foreground">{person.name}</span>
      </nav>

      {/* Hero card */}
      <section
        className="relative overflow-hidden rounded-3xl border border-border p-8"
        style={{ background: "var(--gradient-hero), var(--card)" }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
          <Avatar p={person} className="h-28 w-28 sm:h-32 sm:w-32 shrink-0" active />
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-display text-4xl text-foreground">{person.name}</h1>
                <p className="text-muted-foreground mt-0.5">{person.title}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary transition"
                >
                  in LinkedIn
                </a>
                <a
                  href={person.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary transition"
                >
                  📷 @{person.igHandle}
                </a>
              </div>
            </div>
            <p className="mt-4 text-foreground leading-relaxed">{person.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag variant="primary">{person.category}</Tag>
              <Tag variant="accent">{person.attachment}</Tag>
              {person.custom && <Tag variant="default">✦ Ingested</Tag>}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Profile sections */}
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl text-card-foreground mb-5">Dating profile</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { label: "Needs", items: person.needs, variant: "primary" as const },
                { label: "Hobbies", items: person.hobbies, variant: "default" as const },
                { label: "Interests", items: person.interests, variant: "accent" as const },
                { label: "Quirks", items: person.quirks, variant: "default" as const },
                { label: "Dealbreakers", items: person.dealbreakers, variant: "destructive" as const },
              ].map(({ label, items, variant }) => (
                <div key={label}>
                  <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <Tag key={item} variant={variant}>{item}</Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sample date transcript */}
          {top5.length > 0 && sampleDate && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="font-display text-2xl text-card-foreground">Sample date preview</h2>
                <p className="text-sm text-muted-foreground">
                  vs {top5[0]!.other.name} · {sampleDate.chemistry}% chemistry
                </p>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {sampleDate.turns.slice(0, 6).map((t, i) => (
                  <div key={i} className={`flex flex-col ${t.speaker === 1 ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-sm rounded-2xl px-4 py-2 text-sm ${
                        t.speaker === 0
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary/20 text-foreground"
                      }`}
                    >
                      {t.line}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link
                  to="/theater"
                  search={{ a: person.id, b: top5[0]!.other.id }}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow-sm)] hover:scale-105 transition inline-block"
                >
                  Watch full date →
                </Link>
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Radar chart */}
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl text-card-foreground mb-4">Trait vector</h2>
            <RadarChart traits={person.traits} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(Object.entries(person.traits) as [string, number][]).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-1.5">
                  <span className="text-xs capitalize text-muted-foreground">{k}</span>
                  <span className="font-display text-lg text-primary">{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Top matches */}
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl text-card-foreground mb-3">Top matches</h2>
            <div className="space-y-2 stagger-children">
              {top5.map((s, i) => (
                <Link
                  key={s.other.id}
                  to="/theater"
                  search={{ a: person.id, b: s.other.id }}
                  className="flex items-center gap-3 rounded-xl bg-secondary p-2.5 hover:bg-primary/10 transition card-hover"
                >
                  <span className="font-display text-lg text-primary w-5 text-center">
                    {i === 0 ? "👑" : `${i + 1}`}
                  </span>
                  <Avatar p={s.other} className="h-9 w-9" noHover />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{s.other.name}</p>
                    <p className="text-xs text-muted-foreground">{s.total}/100 match</p>
                  </div>
                  <span className="text-xs text-primary">Date →</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
