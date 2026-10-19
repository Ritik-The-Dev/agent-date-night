import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useRoster } from "@/lib/store";
import { rankFor } from "@/lib/engine";

export const Route = createFileRoute("/matrix")({
  head: () => ({
    meta: [
      { title: "Compatibility Matrix & Rankings | Cupid.agent" },
      { name: "description", content: "Leaderboards of who fits whom best by intellectual synergy, lifestyle vibe and simulated date chemistry." },
      { property: "og:title", content: "Compatibility Matrix & Rankings" },
      { property: "og:description", content: "See every agent's best matches, ranked." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Matrix,
});

function Matrix() {
  const roster = useRoster();
  const [id, setId] = useState(roster[0]!.id);
  const p = roster.find((x) => x.id === id) ?? roster[0]!;
  const ranks = useMemo(() => rankFor(p, roster), [p, roster]);
  const best = useMemo(() => roster.map((x) => ({ p: x, top: rankFor(x, roster)[0]! })).sort((m, n) => n.top.total - m.top.total).slice(0, 5), [roster]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-5xl text-foreground">Compatibility <em className="text-primary">Matrix</em></h1>
      <p className="mt-2 text-muted-foreground">Total = 35% intellectual synergy + 30% lifestyle vibe + 35% simulated date chemistry.</p>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">Power couples of the roster</p>
        <div className="grid gap-3 md:grid-cols-5">
          {best.map(({ p: x, top }) => (
            <div key={x.id} className="flex items-center gap-2 rounded-2xl bg-secondary p-3">
              <Avatar p={x} className="h-9 w-9" /><span className="text-primary">♥</span><Avatar p={top.other} className="h-9 w-9" />
              <span className="ml-auto font-display text-xl text-secondary-foreground">{top.total}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="max-h-[70vh] space-y-1 overflow-y-auto">
          {roster.map((x) => (
            <button key={x.id} onClick={() => setId(x.id)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${x.id === id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
              <Avatar p={x} className="h-7 w-7" />{x.name}
            </button>
          ))}
        </aside>
        <section className="overflow-x-auto rounded-3xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border p-4"><Avatar p={p} className="h-12 w-12" /><div><p className="font-display text-2xl text-card-foreground">Best fits for {p.name}</p><p className="text-xs text-muted-foreground">{p.attachment} · needs {p.needs.join(", ")}</p></div></div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="p-3">#</th><th>Match</th><th>Intellectual</th><th>Lifestyle</th><th>Chemistry</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {ranks.map((r, i) => (
                <tr key={r.other.id} className="border-t border-border text-foreground">
                  <td className="p-3 font-display text-lg text-primary">{i + 1}</td>
                  <td><div className="flex items-center gap-2"><Avatar p={r.other} className="h-8 w-8" />{r.other.name}</div></td>
                  {[r.intellectual, r.lifestyle, r.chemistry].map((n, k) => (
                    <td key={k}><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${n}%` }} /></div>{n}</div></td>
                  ))}
                  <td className="font-display text-lg">{r.total}</td>
                  <td className="pr-3"><Link to="/theater" search={{ a: p.id, b: r.other.id }} className="text-primary underline">Date</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
