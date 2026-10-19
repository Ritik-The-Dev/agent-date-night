import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useRoster } from "@/lib/store";
import { rankFor, simulateDate, VENUES } from "@/lib/engine";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Full Rankings — Who fits whom best | Cupid.agent" },
      {
        name: "description",
        content:
          "Complete compatibility rankings for all 25 agents. Every person's best match ranked by intellectual synergy, lifestyle fit and simulated date chemistry.",
      },
      { property: "og:title", content: "Cupid.agent — Full Rankings" },
      { property: "og:description", content: "Every agent ranked against every other agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rankings,
});

// ── Medal colours ────────────────────────────────────────────────────────────
const MEDAL = ["🥇", "🥈", "🥉"];

// ── Chemistry ring mini ──────────────────────────────────────────────────────
function ChemRing({ value }: { value: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const color =
    value >= 75
      ? "oklch(0.77 0.16 140)"
      : value >= 55
        ? "oklch(0.72 0.19 15)"
        : "oklch(0.65 0.2 25)";
  return (
    <svg width="44" height="44" className="-rotate-90" aria-label={`${value}% chemistry`}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="oklch(0.25 0.05 350)" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - value / 100)}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.2,0.64,1)" }}
      />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fill={color}
        className="rotate-90 origin-center"
        style={{ transform: "rotate(90deg)", transformOrigin: "22px 22px" }}
      >
        {value}
      </text>
    </svg>
  );
}

// ── Score bar ────────────────────────────────────────────────────────────────
function Bar({
  value,
  color = "primary",
}: {
  value: number;
  color?: "primary" | "accent" | "chart-5";
}) {
  const stroke =
    color === "accent"
      ? "oklch(0.82 0.13 75)"
      : color === "chart-5"
        ? "oklch(0.77 0.16 140)"
        : "oklch(0.72 0.19 15)";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full animate-bar-grow"
          style={{
            width: `${value}%`,
            background: stroke,
            "--bar-width": `${value}%`,
          } as React.CSSProperties}
        />
      </div>
      <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

function Rankings() {
  const roster = useRoster();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "topScore" | "category">("topScore");

  // Compute top match + score for every person
  const rows = useMemo(() => {
    return roster.map((p) => {
      const ranks = rankFor(p, roster);
      const top = ranks[0];
      return {
        person: p,
        ranks,
        top,
      };
    });
  }, [roster]);

  const sorted = useMemo(() => {
    if (sortBy === "name")
      return [...rows].sort((a, b) => a.person.name.localeCompare(b.person.name));
    if (sortBy === "category")
      return [...rows].sort((a, b) => a.person.category.localeCompare(b.person.category));
    // topScore default
    return [...rows].sort((a, b) => (b.top?.total ?? 0) - (a.top?.total ?? 0));
  }, [rows, sortBy]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">Every person · every match</p>
        <h1 className="mt-1 font-display text-5xl text-foreground md:text-6xl">
          Full <em className="gradient-text not-italic">Rankings</em>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          For every one of the 25 agents, here is who fits them best — ranked by intellectual
          synergy (35%), lifestyle vibe (30%) and simulated date chemistry (35%). Click any row
          to expand the top-5 matches.
        </p>
      </div>

      {/* Summary stats strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 stagger-children">
        {[
          { label: "Total agents", value: roster.length, emoji: "🤖" },
          {
            label: "Pairs ranked",
            value: Math.round((roster.length * (roster.length - 1)) / 2),
            emoji: "💑",
          },
          {
            label: "Avg top score",
            value: Math.round(rows.reduce((s, r) => s + (r.top?.total ?? 0), 0) / rows.length),
            emoji: "📊",
          },
          {
            label: "Second dates",
            value: rows.filter((r) => r.top && r.top.chemistry >= 65).length,
            emoji: "💘",
          },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl">{emoji}</p>
            <p className="font-display text-3xl text-primary">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Sort controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Sort by</p>
        {(["topScore", "name", "category"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`rounded-full border px-4 py-1 text-sm transition ${
              sortBy === s
                ? "border-primary bg-primary/20 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "topScore" ? "Top score" : s === "name" ? "Name A–Z" : "Category"}
          </button>
        ))}
        <p className="ml-auto text-xs text-muted-foreground">{sorted.length} agents</p>
      </div>

      {/* Main table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-3 text-xs uppercase tracking-widest text-muted-foreground w-8">#</th>
              <th className="p-3 text-xs uppercase tracking-widest text-muted-foreground">Agent</th>
              <th className="p-3 text-xs uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                Category
              </th>
              <th className="p-3 text-xs uppercase tracking-widest text-primary">Best match</th>
              <th className="p-3 text-xs uppercase tracking-widest text-primary hidden lg:table-cell">
                Intellectual
              </th>
              <th className="p-3 text-xs uppercase tracking-widest text-accent hidden lg:table-cell">
                Lifestyle
              </th>
              <th className="p-3 text-xs uppercase tracking-widest text-chart-5 hidden lg:table-cell">
                Chemistry
              </th>
              <th className="p-3 text-xs uppercase tracking-widest text-foreground">Score</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ person, ranks, top }, globalIdx) => {
              const isOpen = expanded === person.id;
              return (
                <React.Fragment key={person.id}>
                  <tr
                    className={`border-t border-border transition-colors cursor-pointer ${
                      isOpen ? "bg-primary/5" : "hover:bg-secondary/30"
                    } ${globalIdx === 0 && sortBy === "topScore" ? "bg-primary/5" : ""}`}
                    onClick={() => setExpanded(isOpen ? null : person.id)}
                  >
                    {/* Rank # */}
                    <td className="p-3">
                      <span className="font-display text-base text-muted-foreground">
                        {sortBy === "topScore" && globalIdx < 3
                          ? MEDAL[globalIdx]
                          : globalIdx + 1}
                      </span>
                    </td>

                    {/* Agent */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar p={person} className="h-9 w-9" noHover />
                        <div>
                          <p className="font-medium text-foreground leading-tight">{person.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {person.title.split(",")[0]}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3 hidden md:table-cell">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {person.category}
                      </span>
                    </td>

                    {/* Best match */}
                    <td className="p-3">
                      {top ? (
                        <div className="flex items-center gap-2">
                          <Avatar p={top.other} className="h-8 w-8" noHover />
                          <div>
                            <p className="text-foreground leading-tight">{top.other.name}</p>
                            <p className="text-xs text-muted-foreground">{top.other.attachment}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Scores */}
                    <td className="p-3 hidden lg:table-cell">
                      {top && <Bar value={top.intellectual} color="primary" />}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {top && <Bar value={top.lifestyle} color="accent" />}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {top && <ChemRing value={top.chemistry} />}
                    </td>

                    {/* Total */}
                    <td className="p-3">
                      {top && (
                        <span className="font-display text-xl text-primary">{top.total}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {top && (
                          <Link
                            to="/theater"
                            search={{ a: person.id, b: top.other.id }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-full border border-primary/40 px-3 py-1 text-xs text-primary hover:bg-primary/10 transition whitespace-nowrap"
                          >
                            Date →
                          </Link>
                        )}
                        <span
                          className={`text-muted-foreground transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        >
                          ▾
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded top-5 row */}
                  {isOpen && (
                    <tr className="border-t border-primary/20">
                      <td colSpan={9} className="p-0">
                        <div className="bg-primary/5 px-4 py-4 animate-in fade-in duration-300">
                          <p className="mb-3 text-xs uppercase tracking-widest text-primary">
                            Top 5 matches for {person.name}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                            {ranks.slice(0, 5).map((r, i) => (
                              <Link
                                key={r.other.id}
                                to="/theater"
                                search={{ a: person.id, b: r.other.id }}
                                className="flex items-center gap-2 rounded-xl bg-card p-3 border border-border hover:border-primary/50 transition card-hover"
                              >
                                <span className="font-display text-lg text-primary w-5">
                                  {i === 0 ? "👑" : `${i + 1}`}
                                </span>
                                <Avatar p={r.other} className="h-8 w-8" noHover />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {r.other.name.split(" ")[0]}
                                  </p>
                                  <p className="text-xs text-primary">{r.total}/100</p>
                                </div>
                              </Link>
                            ))}
                          </div>

                          {/* Profile + LinkedIn + Instagram links */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              to="/profile"
                              search={{ id: person.id }}
                              className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary hover:text-primary transition"
                            >
                              View profile →
                            </Link>
                            <a
                              href={person.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-primary transition"
                            >
                              in LinkedIn
                            </a>
                            <a
                              href={person.instagram}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-primary transition"
                            >
                              📷 @{person.igHandle}
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
