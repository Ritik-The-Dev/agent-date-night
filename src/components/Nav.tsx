import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Roster" },
  { to: "/theater", label: "Date Theater" },
  { to: "/matrix", label: "Matrix" },
  { to: "/submission", label: "Submission Kit" },
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="font-display text-2xl italic text-foreground">
          Cupid<span className="text-primary">.agent</span>
        </Link>
        <nav className="flex flex-wrap gap-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: true }}
              className="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:text-primary-foreground" }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
