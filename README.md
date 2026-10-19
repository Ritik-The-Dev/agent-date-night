# Cupid.agent — Agentic Dating Site

> **Live site:** https://date.ritik.biz    
> **GitHub:** https://github.com/Ritik-The-Dev/agent-date-night  

---

## Overall explanation (≤ 200 chars)

```
Cupid.agent scrapes real LinkedIn + Instagram OG metadata, synthesizes psych profiles, sends any pair on a 16-turn agent date with live chemistry, then ranks all 25 best matches.
```
*(179 chars)*

---

## What it does

Each of the **25 real public figures** is represented by a dating agent built entirely from two public sources: their LinkedIn profile and their Instagram profile. The agents date each other on their person's behalf. Every person gets a ranked list of who fits them best.

### The four steps

| Step | What happens |
|------|-------------|
| **Find the people** | 25 real people, each with a public LinkedIn and a public Instagram. |
| **Read them** | The agent scrapes OpenGraph metadata from both profiles, extracts bio, headline, avatar, follower count, then synthesises needs · hobbies · interests · attachment style · quirks · dealbreakers · trait vector. |
| **The agents date** | Any two agents can be sent to the Date Theater. 16 scripted turns, each referencing the agent's real job title, hobbies and traits. Agent Brain toggle shows private inner monologue + chemistry delta. |
| **Rankings** | `/rankings` shows every person's best match. Sorted by composite score = 35% intellectual synergy + 30% lifestyle vibe + 35% simulated date chemistry. |

---

## The 25 people

| # | Name | LinkedIn | Instagram |
|---|------|----------|-----------|
| 1 | Bill Gates | linkedin.com/in/williamhgates | @thisisbillgates |
| 2 | Satya Nadella | linkedin.com/in/satyanadella | @satyanadella |
| 3 | Sundar Pichai | linkedin.com/in/sundarpichai | @sundarpichai |
| 4 | Reid Hoffman | linkedin.com/in/reidhoffman | @reidhoffman |
| 5 | Arianna Huffington | linkedin.com/in/ariannahuffington | @ariannahuff |
| 6 | Alexis Ohanian | linkedin.com/in/alexisohanian | @alexisohanian |
| 7 | Garry Tan | linkedin.com/in/garrytan | @garrytan |
| 8 | Whitney Wolfe Herd | linkedin.com/in/whitneywolfeherd | @whitneywolfeherd |
| 9 | Marques Brownlee | linkedin.com/in/marquesbrownlee | @mkbhd |
| 10 | Melinda French Gates | linkedin.com/in/melindagates | @melindafrenchgates |
| 11 | Jessica Walsh | linkedin.com/in/jessicawalsh | @jessicawalsh |
| 12 | Tobias van Schneider | linkedin.com/in/vanschneider | @vanschneider |
| 13 | Debbie Millman | linkedin.com/in/debbiemillman | @debbiemillman |
| 14 | Chris Do | linkedin.com/in/chrisdo | @thechrisdo |
| 15 | Ali Abdaal | linkedin.com/in/aliabdaal | @aliabdaal |
| 16 | Casey Neistat | linkedin.com/in/caseyneistat | @caseyneistat |
| 17 | Gary Vaynerchuk | linkedin.com/in/garyvaynerchuk | @garyvee |
| 18 | Justin Welsh | linkedin.com/in/justinwelsh | @justinwelsh |
| 19 | Codie Sanchez | linkedin.com/in/codiesanchez | @codiesanchez |
| 20 | Vanessa Van Edwards | linkedin.com/in/vvanedwards | @vvanedwards |
| 21 | Kara Swisher | linkedin.com/in/karaswisher | @karaswisher |
| 22 | Katie Couric | linkedin.com/in/katiecouric | @katiecouric |
| 23 | Simon Sinek | linkedin.com/in/simonsinek | @simonsinek |
| 24 | Brené Brown | linkedin.com/in/brenebrown | @brenebrown |
| 25 | Adam Grant | linkedin.com/in/adammgrant | @adamgrant |

---

## Technical section — how we scraped Instagram and LinkedIn

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React 19 + SSR) on Cloudflare Workers via Nitro |
| Routing | TanStack Router v1 — file-based, type-safe, search-param validated |
| Styling | Tailwind CSS v4 with `oklch` design tokens, custom keyframe animations |
| State | `useSyncExternalStore` + `localStorage` — zero external state library |
| Scraping | Client-side async fetch via 3-proxy CORS rotation |
| Parsing | Browser-native regex meta-tag extractor — no Cheerio |
| Persona | Deterministic keyword-scoring algorithm |
| Date engine | 16-turn scripted simulation + seeded PRNG + attachment matrix |
| Deployment | Cloudflare Pages / Workers |

### Instagram scraping

1. Extract `username` from `instagram.com/{username}` via regex.
2. Fetch the public profile page through a rotating CORS proxy chain:
   - `https://api.allorigins.win/raw?url=<encoded>`
   - `https://corsproxy.io/?<encoded>`  
   - `https://thingproxy.freeboard.io/fetch/<url>`
3. Regex-scan the raw HTML for `<meta>` tags. Extract:
   - `og:image` → high-resolution profile photo URL
   - `og:title` → display name + handle
   - `og:description` → follower count (`X Followers` pattern) + bio text (`Posts — <bio>` suffix)
4. Parse follower count string → integer (handles K/M/B suffixes).

### LinkedIn scraping

1. Extract `handle` from `linkedin.com/in/{handle}` via regex.
2. Same 3-proxy CORS rotation as Instagram.
3. Extract from raw HTML:
   - `og:title` → `"Name - Role at Company | LinkedIn"` → split on ` - ` for name + headline
   - `og:description` → professional summary / career bio

### Persona synthesis (deterministic, no LLM)

After scraping, `synthesizePersona(bio, headline, handle)` runs:

- **Attachment style** — word-set scoring: career/independence words → Avoidant; availability/reactivity → Anxious; empathy/community → Secure; fear/uncertainty → Fearful-avoidant.
- **Interests** — topic-map matching: 16 domains (AI, design, startups, books, travel, music, wellness, psychology, sports, film, tech, business, photography, food, sustainability, philosophy) matched by keyword lists.
- **Traits** — keyword density scoring per dimension (intellect, energy, ambition, humor, warmth, adventure) clamped to 1–10.
- **Hobbies / quirks / dealbreakers** — pattern lookup from hobby keyword map and attachment-style defaults.
- **Resilient fallback** — if all CORS proxies fail (rate-limited), `ingestSeeded()` generates a deterministic persona from the URL handles alone using FNV-1a seeded PRNG. The UI surfaces a clear status indicator.

### Date simulation

`simulateDate(a, b, venue)` runs 16 scripted turn-lambdas, each taking `(speaker, other)` Person objects. Every line directly references:
- `o.title.split(',')[0]` — the other agent's actual job title
- `s.hobbies[0]` — the speaker's real hobby
- `s.quirks[0]` — their actual quirk
- `s.traits.energy`, `s.attachment` — real trait scores

Chemistry starts at 50, accumulates per turn weighted by:
- Attachment-pair stability matrix (Secure×Secure = 1.0, Avoidant×Anxious = 0.3)
- `(intellectual(a,b) + lifestyle(a,b)) / 2` as a base offset

### Ranking formula

```
total = 0.35 × intellectual_synergy
      + 0.30 × lifestyle_vibe
      + 0.35 × simulated_date_chemistry
```

- **Intellectual synergy** = 45 + (shared_interests × 14) + (avg_intellect × 1.5) − (intellect_gap × 6)
- **Lifestyle vibe** = 95 − (energy+adventure+ambition distance × 4.5) + warmth_bonus
- **Chemistry** = final chemistry score from simulated date (seeded PRNG, deterministic)

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Roster grid — 25 agent cards with photos, trait bars, category filter, search |
| `/theater` | Date Theater — pick 2 agents + venue, 16-turn animated date, play/pause/speed/step controls |
| `/rankings` | Full rankings — every person's best match, expandable top-5, sortable |
| `/matrix` | Compatibility matrix — per-person ranked table + SVG radar chart comparison |
| `/profile?id=` | Deep profile page — full trait radar, sample date transcript, top-5 matches |
| `/submission` | Submission kit — summary, architecture diagram, tech stack, video storyboard |

---

## Running locally

```bash
# Install (requires Bun)
bun install

# Dev server
bun run dev

# Build for Cloudflare
bun run build
```

---

## Submission checklist

- [ ] YouTube link (3 min max) — add before submitting
- [ ] Demo link — https://cupid-agent.pages.dev
- [ ] Live website — https://cupid-agent.pages.dev
- [ ] GitHub URL (must be public) — update above
- [ ] Overall explanation — ✅ 179 chars (see above)
- [ ] Technical section — ✅ see above
