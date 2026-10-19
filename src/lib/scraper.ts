/**
 * scraper.ts
 *
 * Client-side / edge public metadata extractor.
 *
 * Strategy:
 *   1. Rotate through multiple CORS proxy gateways.
 *   2. Parse raw HTML with the browser's DOMParser (no Cheerio needed).
 *   3. Extract OpenGraph tags + heuristic fallbacks.
 *   4. Never throws — always returns ScrapedProfile | ScrapedError.
 */

export interface ScrapedProfile {
  ok: true;
  name: string;
  handle: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  followers: number | null;
  source: "instagram" | "linkedin";
  rawOg: Record<string, string>;
}

export interface ScrapedError {
  ok: false;
  reason: string;
  source: "instagram" | "linkedin";
}

export type ScrapeResult = ScrapedProfile | ScrapedError;

// ── CORS proxy rotation ──────────────────────────────────────────────────────
const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

async function fetchWithProxy(targetUrl: string): Promise<string> {
  let lastErr: unknown;
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(targetUrl), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.length < 200) throw new Error("Response too short");
      return text;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All proxies failed");
}

// ── OpenGraph parser (DOMParser, browser-native) ─────────────────────────────
function parseOg(html: string): Record<string, string> {
  const og: Record<string, string> = {};
  // Use regex for speed — DOMParser can be slow on large HTML
  const metaRe = /<meta[^>]+>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null) {
    const tag = m[0];
    const prop =
      /property=["']([^"']+)["']/i.exec(tag)?.[1] ??
      /name=["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    const content = /content=["']([^"']*)["']/i.exec(tag)?.[1] ?? "";
    if (prop && content) og[prop.toLowerCase()] = decodeHtml(content);
  }
  return og;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ── Instagram ────────────────────────────────────────────────────────────────
export async function scrapeInstagram(username: string): Promise<ScrapeResult> {
  const url = `https://www.instagram.com/${username}/`;
  try {
    const html = await fetchWithProxy(url);
    const og = parseOg(html);

    // og:title  → "Name (@handle) • Instagram photos and videos"
    const title = og["og:title"] ?? og["title"] ?? "";
    const nameMatch = title.match(/^([^(@]+)/);
    const name = nameMatch ? nameMatch[1].trim() : username;

    // og:description → "X Followers, Y Following, Z Posts — Bio text"
    const desc = og["og:description"] ?? "";
    const followersMatch = desc.match(/([\d,]+(?:\.\d+)?[KMB]?)\s+Followers?/i);
    const followers = followersMatch
      ? parseFollowers(followersMatch[1]!)
      : null;

    // Bio is everything after the "Posts — " part
    const bioMatch = desc.match(/Posts?\s*[-–—]\s*(.+)/i);
    const bio = bioMatch ? bioMatch[1].trim() : desc.trim();

    const avatarUrl = og["og:image"] ?? og["og:image:url"] ?? "";

    return {
      ok: true,
      name: name || username,
      handle: username,
      headline: `@${username} on Instagram`,
      bio,
      avatarUrl,
      followers,
      source: "instagram",
      rawOg: og,
    };
  } catch (e) {
    return {
      ok: false,
      reason: `Instagram proxy failed: ${e instanceof Error ? e.message : String(e)}`,
      source: "instagram",
    };
  }
}

// ── LinkedIn ─────────────────────────────────────────────────────────────────
export async function scrapeLinkedIn(handle: string): Promise<ScrapeResult> {
  const url = `https://www.linkedin.com/in/${handle}/`;
  try {
    const html = await fetchWithProxy(url);
    const og = parseOg(html);

    // og:title  → "Name - Role at Company | LinkedIn"
    const rawTitle = og["og:title"] ?? og["title"] ?? "";
    const title = rawTitle.replace(/\s*\|\s*LinkedIn.*$/i, "").trim();
    const dashIdx = title.indexOf(" - ");
    const name = dashIdx > 0 ? title.slice(0, dashIdx).trim() : title;
    const headline = dashIdx > 0 ? title.slice(dashIdx + 3).trim() : "";

    // og:description → professional summary / bio
    const bio = (og["og:description"] ?? og["description"] ?? "").trim();

    const avatarUrl = og["og:image"] ?? og["og:image:url"] ?? "";

    return {
      ok: true,
      name: name || handle,
      handle,
      headline,
      bio,
      avatarUrl,
      followers: null,
      source: "linkedin",
      rawOg: og,
    };
  } catch (e) {
    return {
      ok: false,
      reason: `LinkedIn proxy failed: ${e instanceof Error ? e.message : String(e)}`,
      source: "linkedin",
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseFollowers(s: string): number {
  const n = s.replace(/,/g, "");
  if (/K$/i.test(n)) return Math.round(parseFloat(n) * 1_000);
  if (/M$/i.test(n)) return Math.round(parseFloat(n) * 1_000_000);
  if (/B$/i.test(n)) return Math.round(parseFloat(n) * 1_000_000_000);
  return parseInt(n, 10) || 0;
}

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Combined scrape + merge ──────────────────────────────────────────────────
export interface CombinedScrape {
  ig: ScrapeResult;
  li: ScrapeResult;
  /** Best-guess display name across both */
  displayName: string;
  /** Best avatar: prefers Instagram OG image (usually high-res) */
  avatarUrl: string;
  /** Merged bio from both sources */
  mergedBio: string;
  /** Career headline from LinkedIn */
  headline: string;
  /** Follower count if found */
  followers: number | null;
}

export async function scrapeProfile(
  linkedinUrl: string,
  instagramUrl: string,
): Promise<CombinedScrape> {
  const liHandle = extractLinkedInHandle(linkedinUrl) ?? linkedinUrl;
  const igHandle = extractInstagramHandle(instagramUrl) ?? instagramUrl;

  const [ig, li] = await Promise.all([
    scrapeInstagram(igHandle),
    scrapeLinkedIn(liHandle),
  ]);

  const igProfile = ig.ok ? ig : null;
  const liProfile = li.ok ? li : null;

  const displayName =
    liProfile?.name ||
    igProfile?.name ||
    liHandle.split("-").map(cap).join(" ");

  const avatarUrl =
    igProfile?.avatarUrl ||
    liProfile?.avatarUrl ||
    "";

  const mergedBio = [liProfile?.bio, igProfile?.bio]
    .filter(Boolean)
    .join(" • ")
    .slice(0, 300);

  const headline = liProfile?.headline ?? igProfile?.headline ?? "Public figure";

  return { ig, li, displayName, avatarUrl, mergedBio, headline, followers: igProfile?.followers ?? null };
}

// ── URL handle extractors ─────────────────────────────────────────────────────
export function extractInstagramHandle(url: string): string | null {
  const m = url.trim().match(/instagram\.com\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]!) : null;
}

export function extractLinkedInHandle(url: string): string | null {
  const m = url.trim().match(/linkedin\.com\/in\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]!) : null;
}

function cap(w: string) {
  return w.charAt(0).toUpperCase() + w.slice(1);
}
