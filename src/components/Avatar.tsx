import { useState } from "react";
import type { Person } from "@/lib/people";
import { cn } from "@/lib/utils";

export function Avatar({ p, className }: { p: Person; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = p.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className={cn("relative overflow-hidden rounded-full bg-secondary ring-2 ring-primary/40", className)}>
      {!failed ? (
        <img
          src={`https://unavatar.io/instagram/${p.igHandle}?fallback=false`}
          alt={p.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-primary" style={{ background: "var(--gradient-primary)" }}>
          <span className="text-primary-foreground">{initials}</span>
        </div>
      )}
    </div>
  );
}
