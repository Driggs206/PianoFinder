import { prisma } from "@/lib/prisma";
import type { GeoPoint } from "@/lib/types";

let lastNominatimCall = 0;

function normaliseQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastNominatimCall;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastNominatimCall = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PublicPianoFinder/0.1",
        Accept: "application/json",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function geocode(locationText: string): Promise<GeoPoint | null> {
  const norm = normaliseQuery(locationText);
  console.log(`[geocode] query="${norm}"`);

  // 1. Check DB cache — non-fatal if DB not initialized
  try {
    const cached = await prisma.geoCache.findUnique({ where: { queryNorm: norm } });
    if (cached) {
      console.log(`[geocode] cache hit`);
      return { lat: cached.lat, lon: cached.lon, displayName: cached.displayName };
    }
  } catch (e) {
    console.warn(`[geocode] DB unavailable (run: npx prisma db push). Error:`, e);
  }

  // 2. Nominatim live fetch
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(norm)}&format=json&limit=1`;
  console.log(`[geocode] fetching Nominatim...`);

  let res: Response;
  try {
    res = await rateLimitedFetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[geocode] fetch error:`, msg);
    throw new Error(`Nominatim unreachable: ${msg}`);
  }

  if (!res.ok) {
    console.error(`[geocode] HTTP ${res.status}`);
    throw new Error(`Nominatim HTTP ${res.status}`);
  }

  let data: unknown[];
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`Nominatim returned invalid JSON: ${e}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[geocode] no results for "${norm}"`);
    return null;
  }

  const hit = data[0] as Record<string, string>;
  const point: GeoPoint = {
    lat: parseFloat(hit.lat),
    lon: parseFloat(hit.lon),
    displayName: hit.display_name,
  };
  console.log(`[geocode] resolved to lat=${point.lat} lon=${point.lon}`);

  // 3. Cache result — non-fatal
  try {
    await prisma.geoCache.upsert({
      where: { queryNorm: norm },
      create: { queryNorm: norm, lat: point.lat, lon: point.lon, displayName: point.displayName },
      update: { lat: point.lat, lon: point.lon, displayName: point.displayName, cachedAt: new Date() },
    });
  } catch {
    // Non-fatal
  }

  return point;
}
