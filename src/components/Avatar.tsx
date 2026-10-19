import { useEffect, useRef, useState } from "react";
import type { Person } from "@/lib/people";
import { cn } from "@/lib/utils";

interface AvatarProps {
  p: Person;
  className?: string;
  /** Show animated online/active ring */
  active?: boolean;
  /** Small text badge shown below the avatar */
  badge?: string;
  /** Disable hover scale */
  noHover?: boolean;
}

/**
 * Fallback chain:
 *   1. p.photoUrl  — real scraped/Wikimedia portrait
 *   2. unavatar.io — tries to resolve Instagram handle
 *   3. Gradient initials
 */
export function Avatar({ p, className, active = false, badge, noHover = false }: AvatarProps) {
  // Track which sources have failed
  const [photoFailed, setPhotoFailed] = useState(false);
  const [unavatarFailed, setUnavatarFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset failure states whenever the person changes
  useEffect(() => {
    setPhotoFailed(false);
    setUnavatarFailed(false);
  }, [p.id]);

  // Catch already-cached broken images on mount
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      if (!photoFailed) setPhotoFailed(true);
      else setUnavatarFailed(true);
    }
  });

  const initials = p.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Determine current src
  const usePhoto = !!p.photoUrl && !photoFailed;
  const useUnavatar = !usePhoto && !unavatarFailed;
  const useInitials = !usePhoto && !useUnavatar;

  const currentSrc = usePhoto
    ? p.photoUrl!
    : `https://unavatar.io/instagram/${p.igHandle}?fallback=false`;

  const handleError = () => {
    if (!photoFailed && p.photoUrl) {
      setPhotoFailed(true);
    } else {
      setUnavatarFailed(true);
    }
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      {/* Glow halo */}
      {active && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full animate-glow-pulse"
          aria-hidden
        />
      )}

      {/* Avatar circle */}
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-secondary ring-2 ring-primary/40",
          "h-full w-full",
          !noHover && "transition-transform duration-300 hover:scale-105",
          active && "ring-primary ring-[3px] animate-glow-ring",
        )}
      >
        {!useInitials ? (
          <img
            ref={imgRef}
            src={currentSrc}
            alt={p.name}
            loading="lazy"
            onError={handleError}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-display font-semibold"
            style={{ background: "var(--gradient-primary)" }}
            aria-label={initials}
          >
            <span
              className="text-primary-foreground leading-none"
              style={{ fontSize: "38%" }}
            >
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* Active / online dot */}
      {active && (
        <span
          className="absolute bottom-0 right-0 h-[22%] w-[22%] rounded-full border-2 border-background bg-chart-5 animate-pulse"
          aria-hidden
        />
      )}

      {/* Optional text badge */}
      {badge && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/40 bg-background px-1.5 py-0.5 text-[9px] font-medium leading-none text-primary shadow">
          {badge}
        </span>
      )}
    </div>
  );
}
