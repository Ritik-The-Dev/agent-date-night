import { Link } from "@tanstack/react-router";
import { useState } from "react";

const links = [
  { to: "/", label: "Roster", exact: true },
  { to: "/theater", label: "Date Theater", exact: false },
  { to: "/rankings", label: "Rankings", exact: false },
  { to: "/matrix", label: "Matrix", exact: false },
  { to: "/submission", label: "Submission Kit", exact: false },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
          onClick={() => setOpen(false)}
        >
          <span className="text-xl leading-none animate-heartbeat" aria-hidden>💘</span>
          <span className="font-display text-2xl italic text-foreground">
            Cupid<span className="text-primary">.agent</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex flex-wrap gap-1" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact }}
              className="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary/60"
              activeProps={{
                className:
                  "text-primary-foreground bg-primary hover:text-primary-foreground hover:bg-primary shadow-[var(--shadow-glow-sm)]",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex md:hidden flex-col gap-[5px] p-2 rounded-xl border border-border bg-card"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span
            className={`block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 origin-center ${
              open ? "rotate-45 translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 rounded-full bg-foreground transition-all duration-200 ${
              open ? "opacity-0 scale-x-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 origin-center ${
              open ? "-rotate-45 -translate-y-[7px]" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl px-4 py-3 space-y-1 animate-slide-down">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact }}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-primary/20 text-primary border border-primary/30" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
