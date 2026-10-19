import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useRoster } from "@/lib/store";
import { simulateDate, VENUES } from "@/lib/engine";

export const Route = createFileRoute("/theater")({
  validateSearch: (s: Record<string, unknown>): { a?: string | undefined; b?: string | undefined } => ({ a: typeof s["a"] === "string" ? s["a"] : undefined, b: typeof s["b"] === "string" ? s["b"] : undefined }),
  head: () => ({
    meta: [
      { title: "Date Theater — Watch two AI agents go on a date | Cupid.agent" },
      { name: "description", content: "A live, turn-by-turn date simulation with inner monologue, chemistry meter and post-date verdict." },
      { property: "og:title", content: "The Date Theater" },
      { property: "og:description", content: "Watch two dating agents banter, think privately and decide on a second date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Theater,
});

function Theater() {
  const roster = useRoster();
  const search = Route.useSearch();
  const [aId, setA] = useState(search.a ?? roster[0]!.id);
  const [bId, setB] = useState(search.b ?? roster[7]!.id);
  const [venue, setVenue] = useState(VENUES[0]!.id);
  const [shown, setShown] = useState(-1);
  const [brain, setBrain] = useState(true);
  const a = (roster.find((p) => p.id === aId) ?? roster[0])!;
  const b = (roster.find((p) => p.id === bId) ?? roster[1])!;
  const res = useMemo(() => simulateDate(a, b, venue), [a, b, venue]);
  const v = VENUES.find((x) => x.id === venue)!;
  const playing = shown >= 0 && shown < res.turns.length;
  const finished = shown >= res.turns.length;

  useEffect(() => { setShown(-1); }, [aId, bId, venue]);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setShown((s) => s + 1), 1800);
    return () => clearTimeout(t);
  }, [shown, playing]);

  const chem = shown < 0 ? 50 : res.turns[Math.min(shown, res.turns.length - 1)]!.chemistry;
  const select = "w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-5xl text-foreground">The Date <em className="text-primary">Theater</em></h1>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <select className={select} value={aId} onChange={(e) => setA(e.target.value)}>{roster.map((p) => <option key={p.id} value={p.id} disabled={p.id === bId}>{p.name}</option>)}</select>
        <select className={select} value={bId} onChange={(e) => setB(e.target.value)}>{roster.map((p) => <option key={p.id} value={p.id} disabled={p.id === aId}>{p.name}</option>)}</select>
        <select className={select} value={venue} onChange={(e) => setVenue(e.target.value)}>{VENUES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <button onClick={() => setShown(0)} className="rounded-xl bg-primary py-2 font-medium text-primary-foreground">{finished ? "Replay date" : playing ? "On the date…" : "Start the date"}</button>
      </div>

      <section className="relative mt-6 overflow-hidden rounded-3xl border border-border" style={{ background: v.gradient }}>
        <div className="pointer-events-none absolute inset-0 animate-pulse opacity-30" style={{ background: "radial-gradient(circle at 50% 120%, var(--primary), transparent 60%)" }} />
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-xs uppercase tracking-[0.3em] text-primary">Tonight's venue</p><p className="font-display text-2xl text-foreground">{v.name}</p><p className="text-sm text-muted-foreground">{v.desc}</p></div>
            <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={brain} onChange={(e) => setBrain(e.target.checked)} /> Agent Brain</label>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground"><span>Chemistry</span><span className="text-primary">{chem}%</span></div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-background/50"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${chem}%`, background: "var(--gradient-primary)" }} /></div>
          </div>

          <div className="mt-6 grid grid-cols-[auto_1fr_auto] gap-4">
            {[a, b].map((p, idx) => (
              <div key={p.id} className={`flex flex-col items-center gap-2 ${idx === 1 ? "col-start-3" : ""} row-start-1`}>
                <Avatar p={p} className={`h-20 w-20 transition ${playing && res.turns[shown]?.speaker === idx ? "scale-110 ring-4" : ""}`} />
                <p className="max-w-24 text-center text-sm text-foreground">{p.name.split(" ")[0]}</p>
              </div>
            ))}
            <div className="col-start-2 row-start-1 min-h-[420px] space-y-3">
              {shown < 0 && <p className="pt-20 text-center text-muted-foreground">Press start. The agents are fixing their hair.</p>}
              {res.turns.slice(0, Math.max(0, shown + 1)).map((t, i) => (
                <div key={i} className={`flex animate-in fade-in slide-in-from-bottom-2 flex-col duration-500 ${t.speaker === 1 ? "items-end" : "items-start"}`}>
                  <div className={`max-w-md rounded-2xl px-4 py-2 ${t.speaker === 0 ? "bg-card text-card-foreground" : "bg-primary text-primary-foreground"}`}>{t.line}</div>
                  {brain && (
                    <p className="mt-1 max-w-md text-xs italic text-muted-foreground">
                      🧠 {t.thought} <span className={t.delta >= 0 ? "text-primary" : "text-destructive"}>({t.delta >= 0 ? "+" : ""}{t.delta})</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {finished && (
        <section className="mt-6 rounded-3xl border border-primary/50 bg-card p-6 animate-in fade-in">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Post-date debrief</p>
          <h2 className="mt-1 font-display text-4xl text-card-foreground">{res.chemistry}% — {res.verdict}</h2>
          <ul className="mt-4 space-y-2 text-foreground">{res.debrief.map((d) => <li key={d}>• {d}</li>)}</ul>
          <p className="mt-4 font-medium text-primary">{res.secondDate ? "✓ Second date: YES" : "✕ Second date: no"}</p>
        </section>
      )}
    </main>
  );
}
