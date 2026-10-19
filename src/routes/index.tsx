import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { addPerson, removePerson, useRoster } from "@/lib/store";
import { ingest } from "@/lib/engine";
import type { Category, Person } from "@/lib/people";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cupid.agent — 25 AI dating agents of real public figures" },
      { name: "description", content: "Browse psychological profile cards of 25 public figures turned into dating agents, or ingest new ones from LinkedIn + Instagram." },
      { property: "og:title", content: "Cupid.agent — The Agentic Dating Roster" },
      { property: "og:description", content: "25 dating agents built from public profiles. Add your own from two links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Roster,
});

const CATS: ("All" | Category)[] = ["All", "Tech", "Design", "Creator", "Media"];

function Roster() {
  const roster = useRoster();
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [open, setOpen] = useState<Person | null>(null);
  const [drawer, setDrawer] = useState(false);
  const list = roster.filter((p) => cat === "All" || p.category === cat);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-10 grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">Agentic dating · {roster.length} agents</p>
          <h1 className="font-display text-5xl leading-[1.05] text-foreground md:text-7xl">
            Let their <em className="text-primary">agents</em> go on the first date.
          </h1>
        </div>
        <div className="space-y-4">
          <p className="text-muted-foreground">Every agent is a speculative persona built from public LinkedIn and Instagram signals. Pick two, send them to the Date Theater, and watch chemistry happen.</p>
          <div className="flex gap-2">
            <button onClick={() => setDrawer(true)} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)]">+ Add candidate</button>
            <Link to="/theater" className="rounded-full border border-border px-5 py-2.5 text-sm text-foreground">Start a date →</Link>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1 text-sm ${cat === c ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>{c}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((p) => (
          <button key={p.id} onClick={() => setOpen(p)} className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-1 hover:border-primary/60">
            <div className="flex items-center gap-3">
              <Avatar p={p} className="h-14 w-14" />
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl text-card-foreground">{p.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{p.title}</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{p.category}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{p.attachment}</span>
              {p.custom && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">Ingested</span>}
            </div>
          </button>
        ))}
      </div>

      {open && <ProfileModal p={open} onClose={() => setOpen(null)} />}
      {drawer && <AddDrawer onClose={() => setDrawer(false)} />}
    </main>
  );
}

function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">{items.map((i) => <span key={i} className="rounded-full border border-border px-2.5 py-0.5 text-sm text-foreground">{i}</span>)}</div>
    </div>
  );
}

function ProfileModal({ p, onClose }: { p: Person; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <Avatar p={p} className="h-24 w-24" />
          <div className="flex-1">
            <h2 className="font-display text-3xl text-card-foreground">{p.name}</h2>
            <p className="text-sm text-muted-foreground">{p.title}</p>
            <div className="mt-2 flex gap-3 text-sm">
              <a href={p.linkedin} target="_blank" rel="noreferrer" className="text-primary underline">LinkedIn</a>
              <a href={p.instagram} target="_blank" rel="noreferrer" className="text-primary underline">Instagram</a>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground" aria-label="Close">✕</button>
        </div>
        <p className="mt-4 text-foreground">{p.bio}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Row label="Needs" items={p.needs} />
          <Row label="Hobbies" items={p.hobbies} />
          <Row label="Interests" items={p.interests} />
          <Row label="Attachment style" items={[p.attachment]} />
          <Row label="Quirks" items={p.quirks} />
          <Row label="Dealbreakers" items={p.dealbreakers} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {Object.entries(p.traits).map(([k, v]) => (
            <div key={k}>
              <p className="text-xs capitalize text-muted-foreground">{k}</p>
              <div className="h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${v * 10}%` }} /></div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Speculative persona for entertainment, inferred from public content.</p>
        <div className="mt-4 flex gap-2">
          <Link to="/theater" search={{ a: p.id }} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Send on a date</Link>
          {p.custom && <button onClick={() => { removePerson(p.id); onClose(); }} className="rounded-full border border-destructive px-4 py-2 text-sm text-destructive">Remove</button>}
        </div>
      </div>
    </div>
  );
}

const STEPS = ["Validating public URLs", "Fetching profile metadata", "Extracting interests & tone", "Inferring attachment style", "Birthing dating agent"];

function AddDrawer({ onClose }: { onClose: () => void }) {
  const [li, setLi] = useState("");
  const [ig, setIg] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState<Person | null>(null);

  const run = () => {
    const res = ingest(li, ig, name);
    if (typeof res === "string") return setErr(res);
    setErr("");
    let i = 0;
    setStep(0);
    const t = setInterval(() => {
      i++;
      if (i >= STEPS.length) { clearInterval(t); addPerson(res); setDone(res); }
      else setStep(i);
    }, 550);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-card-foreground">Add candidate</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground">✕</button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Paste two public links. We analyze them and birth a new dating agent.</p>
        <div className="mt-6 space-y-3">
          {[["Display name (optional)", name, setName, "Jane Doe"], ["LinkedIn URL", li, setLi, "https://www.linkedin.com/in/janedoe"], ["Instagram URL", ig, setIg, "https://www.instagram.com/janedoe"]].map(([l, v, s, ph]) => (
            <label key={l as string} className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{l as string}</span>
              <input value={v as string} placeholder={ph as string} onChange={(e) => (s as (x: string) => void)(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
            </label>
          ))}
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button onClick={run} disabled={step >= 0 && !done} className="w-full rounded-full bg-primary py-2.5 text-primary-foreground disabled:opacity-50">Analyze & create agent</button>
        </div>
        {step >= 0 && (
          <ol className="mt-6 space-y-2">
            {STEPS.map((s, i) => (
              <li key={s} className={`flex items-center gap-2 text-sm ${i <= step || done ? "text-foreground" : "text-muted-foreground"}`}>
                <span className={`h-2 w-2 rounded-full ${i < step || done ? "bg-primary" : i === step ? "animate-pulse bg-primary" : "bg-secondary"}`} />{s}
              </li>
            ))}
          </ol>
        )}
        {done && (
          <div className="mt-6 rounded-2xl border border-primary/50 p-4">
            <div className="flex items-center gap-3"><Avatar p={done} className="h-12 w-12" /><div><p className="font-display text-xl text-foreground">{done.name}</p><p className="text-xs text-muted-foreground">{done.attachment} · {done.interests.join(", ")}</p></div></div>
            <Link to="/theater" search={{ a: done.id }} className="mt-3 inline-block text-sm text-primary underline">Send them on a date →</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
