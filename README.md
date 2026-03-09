# 🎹 Public Piano Finder

A production-quality web app for finding publicly playable pianos near any location, built entirely on **free, open data** — no paid APIs required.

**Live cost: ~$0/month** — all data comes from OpenStreetMap via the free Overpass API.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Map | Leaflet + Carto dark tiles (free) |
| Geocoding | Nominatim (OpenStreetMap, free) |
| Piano data | Overpass API (OpenStreetMap, free) |
| Caching | SQLite via Prisma |
| Hosting | Vercel free tier |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — default SQLite path works out of the box

# 3. Create the database
npx prisma db push

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
app/
  page.tsx                  # Landing page
  results/page.tsx          # Split map + list results
  about/page.tsx            # Methodology page
  api/
    search/route.ts         # POST /api/search — main orchestrator
    health/route.ts         # GET /api/health

components/
  piano/
    SearchForm.tsx          # Location + radius input
    PianoCard.tsx           # Result card
    PianoDetailDrawer.tsx   # Slide-out detail panel
  map/
    PianoMap.tsx            # Leaflet map (client-only, dynamic import)
  ui/
    ConfidenceBadge.tsx     # Confirmed / Likely / Mentioned badge
    Skeleton.tsx            # Loading placeholders

lib/
  types.ts                  # All TypeScript interfaces
  prisma.ts                 # Prisma singleton
  services/
    geocoding.ts            # Nominatim with cache + rate limiting
    overpass.ts             # Overpass QL queries with retry/backoff
    scoring.ts              # Rule-based confidence scoring
    dedup.ts                # Geo deduplication + cache keys
    cache.ts                # SQLite search result caching

prisma/
  schema.prisma             # GeoCache + SearchCache tables
```

---

## Confidence Tiers

| Tier | Score | Meaning |
|---|---|---|
| ✅ Confirmed | ≥60 | Direct OSM piano tag |
| 🟡 Likely | 30–59 | Music school, instrument shop, or named venue |
| 🟠 Mentioned | <30 | Venue type that sometimes has pianos |

Scores are deterministic and rule-based — no AI involved.

---

## Data Sources & Attribution

- Map data © [OpenStreetMap](https://www.openstreetmap.org) contributors (ODbL)
- Geocoding by [Nominatim](https://nominatim.org)
- Map tiles © [CARTO](https://carto.com/attributions)

---

## Deployment (Vercel)

```bash
# Add DATABASE_URL to Vercel environment variables
# For production, consider upgrading to Postgres (Neon free tier works)

vercel --prod
```

For Postgres: change `prisma/schema.prisma` provider to `postgresql` and update `DATABASE_URL`.

---

## Improving Results

The best way to improve coverage is to add pianos to OpenStreetMap with the tag `amenity=piano`. Edits are picked up on the next search (after cache expires, default 24h).

---

## Future Work (Post-MVP)

- Community confirmation submissions
- "Piano trail" walking route generator  
- Saved searches / email alerts
- Admin cache management UI
- Google Places as optional enrichment (feature-flagged)
