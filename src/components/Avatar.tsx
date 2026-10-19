import { useEffect, useRef, useState } from "react";
import type { Person } from "@/lib/people";
import { cn } from "@/lib/utils";

export function Avatar({ p, className }: { p: Person; className?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  const initials = p.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className={cn("relative overflow-hidden rounded-full bg-secondary ring-2 ring-primary/40", className)}>
      {!failed ? (
        <img
          ref={ref}
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
