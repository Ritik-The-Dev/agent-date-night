import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useRoster } from "@/lib/store";
import { rankFor } from "@/lib/engine";
import type { Person } from "@/lib/people";

export const Route = createFileRoute("/matrix")({
  head: () => ({
    meta: [
      { title: "Compatibility Matrix & Rankings | Cupid.agent" },
      {
        name: "description",
        content:
          "Leaderboards of who fits whom best by intellectual synergy, lifestyle vibe and simulated date chemistry.",
      },
      { property: "og:title", content: "Compatibility Matrix & Rankings" },
      { property: "og:description", content: "See every agent's best matches, ranked." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Matrix,
});

// ── Spider / Radar chart (pure SVG) ────────────────────────────────────────
function RadarChart({ a, b }: { a: Person; b: Person }) {
  const labels = ["intellect", "energy", "ambition", "humor", "warmth", "adventure"] as const;
  const n = labels.length;
  const cx = 120, cy = 120, r = 90;

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (val: number, i: number) => {
    const angle = angleOf(i);
    const d = (val / 10) * r;
    return { x: cx + d * Math.cos(angle), y: cy + d * Math.sin(angle) };
  };
  const poly = (traits: Record<string, number>) =>
    labels.map((l, i) => pt(traits[l]!, i)).map(({ x, y }) => `${x},${y}`).join(" ");

  // Grid rings
  const rings = [2, 4, 6, 8, 10];

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[220px]" aria-label="Trait radar chart">
      {/* Grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={labels.map((_, i) => pt(ring, i)).map(({ x, y }) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="oklch(0.30 0.055 350)"
          strokeWidth="0.8"
          opacity="0.6"
        />
      ))}
      {/* Axis lines */}
      {labels.map((_, i) => {
        const { x, y } = pt(10, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(0.30 0.055 350)" strokeWidth="0.8" opacity="0.5" />;
      })}
      {/* Person A polygon */}
      <polygon
        points={poly(a.traits)}
        fill="oklch(0.72 0.19 15 / 0.2)"
        stroke="oklch(0.72 0.19 15)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Person B polygon */}
      <polygon
        points={poly(b.traits)}
        fill="oklch(0.82 0.13 75 / 0.15)"
        stroke="oklch(0.82 0.13 75)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Labels */}
      {labels.map((label, i) => {
        const { x, y } = pt(11.5, i);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="oklch(0.70 0.03 20)"
            className="capitalize"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Animated score bar ──────────────────────────────────────────────────────
function ScoreBar({ value, color = "primary" }: { value: number; color?: "primary" | "accent" | "chart-5" }) {
  const bg = color === "accent" ? "oklch(0.82 0.13 75)" : color === "chart-5" ? "oklch(0.77 0.16 140)" : "oklch(0.72 0.19 15)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full animate-bar-grow"
          style={{ width: `${value}%`, background: bg, "--bar-width": `${value}%` } as React.CSSProperties}
        />
      </div>
      <span className="text-xs tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function Matrix() {
  const roster = useRoster();
  const [id, setId] = useState(roster[0]!.id);
  const [compareId, setCompareId] = useState<string | null>(null);

  const p = roster.find((x) => x.id === id) ?? roster[0]!;
  const compare = compareId ? (roster.find((x) => x.id === compareId) ?? null) : null;

  const ranks = useMemo(() => rankFor(p, roster), [p, roster]);
  const best = useMemo(
    () =>
      roster
        .map((x) => ({ p: x, top: rankFor(x, roster)[0]! }))
        .sort((m, n) => n.top.total - m.top.total)
        .slice(0, 5),
    [roster],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-5xl text-foreground">
        Compatibility <em className="gradient-text not-italic">Matrix</em>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Total = <span className="text-primary">35%</span> intellectual synergy +{" "}
        <span className="text-accent">30%</span> lifestyle vibe +{" "}
        <span className="text-chart-5">35%</span> simulated date chemistry.
      </p>

      {/* Power couples */}
      <section className="mt-6 rounded-3xl border border-border bg-card p-5">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">
          ⚡ Power couples of the roster
        </p>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 stagger-children">
          {best.map(({ p: x, top }, i) => (
            <button
              key={x.id}
              onClick={() => { setId(x.id); setCompareId(top.other.id); }}
              className="card-hover relative flex items-center gap-2 rounded-2xl bg-secondary p-3 border border-transparent"
            >
              {i === 0 && <span className="absolute -top-3 left-2 text-sm">👑</span>}
              <Avatar p={x} className="h-9 w-9" />
              <span className="text-primary animate-heartbeat">♥</span>
              <Avatar p={top.other} className="h-9 w-9" />
              <span className="ml-auto font-display text-xl text-primary">{top.total}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Person selector sidebar */}
        <aside className="max-h-[72vh] space-y-1 overflow-y-auto rounded-2xl border border-border bg-card p-2">
          <p className="px-2 py-1 text-xs uppercase tracking-widest text-muted-foreground">Select agent</p>
          {roster.map((x) => (
            <button
              key={x.id}
              onClick={() => { setId(x.id); setCompareId(null); }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                x.id === id
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-sm)]"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              <Avatar p={x} className="h-7 w-7" noHover />
              <span className="truncate">{x.name}</span>
            </button>
          ))}
        </aside>

        {/* Main panel */}
        <div className="space-y-6">
          {/* Compare panel */}
          {compare && (
            <section className="rounded-3xl border border-primary/40 bg-card p-5 animate-scale-in">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <p className="text-xs uppercase tracking-widest text-primary">Trait comparison</p>
                <button onClick={() => setCompareId(null)} className="text-xs text-muted-foreground hover:text-foreground">
                  ✕ close
                </button>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <RadarChart a={p} b={compare} />
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-primary shrink-0" />
                    <Avatar p={p} className="h-8 w-8" noHover />
                    <span className="text-sm text-foreground">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-accent shrink-0" />
                    <Avatar p={compare} className="h-8 w-8" noHover />
                    <span className="text-sm text-foreground">{compare.name}</span>
                  </div>
                  <div className="mt-4 rounded-xl bg-secondary p-3">
                    <p className="text-xs text-muted-foreground mb-1">Shared interests</p>
                    {p.interests.filter((i) => compare.interests.includes(i)).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.interests
                          .filter((i) => compare.interests.includes(i))
                          .map((i) => (
                            <span key={i} className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                              {i}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No shared interests — opposites attracting.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Rankings table */}
          <section className="overflow-x-auto rounded-3xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border p-4 flex-wrap">
              <Avatar p={p} className="h-12 w-12" active />
              <div>
                <p className="font-display text-2xl text-card-foreground">Best fits for {p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.attachment} · needs {p.needs.join(", ")}
                </p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b border-border">
                  <th className="p-3 text-xs uppercase tracking-widest text-muted-foreground">#</th>
                  <th className="p-3 text-xs uppercase tracking-widest text-muted-foreground">Match</th>
                  <th className="p-3 text-xs uppercase tracking-widest text-primary">Intellectual</th>
                  <th className="p-3 text-xs uppercase tracking-widest text-accent">Lifestyle</th>
                  <th className="p-3 text-xs uppercase tracking-widest text-chart-5">Chemistry</th>
                  <th className="p-3 text-xs uppercase tracking-widest text-muted-foreground">Total</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {ranks.map((r, i) => (
                  <tr
                    key={r.other.id}
                    className={`border-t border-border text-foreground transition hover:bg-secondary/40 ${
                      i === 0 ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-3">
                      <span className={`font-display text-lg ${i === 0 ? "text-accent" : "text-primary"}`}>
                        {i === 0 ? "👑" : `${i + 1}`}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setCompareId(r.other.id)}
                        className="flex items-center gap-2 hover:text-primary transition"
                      >
                        <Avatar p={r.other} className="h-8 w-8" noHover />
                        <span>{r.other.name}</span>
                      </button>
                    </td>
                    <td className="p-3">
                      <ScoreBar value={r.intellectual} color="primary" />
                    </td>
                    <td className="p-3">
                      <ScoreBar value={r.lifestyle} color="accent" />
                    </td>
                    <td className="p-3">
                      <ScoreBar value={r.chemistry} color="chart-5" />
                    </td>
                    <td className="p-3">
                      <span className="font-display text-lg text-foreground">{r.total}</span>
                    </td>
                    <td className="pr-3">
                      <Link
                        to="/theater"
                        search={{ a: p.id, b: r.other.id }}
                        className="rounded-full border border-primary/40 px-3 py-1 text-xs text-primary hover:bg-primary/10 transition"
                      >
                        Date →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </main>
  );
}
