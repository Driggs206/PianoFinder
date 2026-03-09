import type { OverpassElement, OverpassResponse } from "@/lib/types";

const ENDPOINTS = [
  process.env.OVERPASS_ENDPOINT,
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
].filter(Boolean) as string[];

// For large radii we use a tighter query (only direct piano tags + music venues)
// to avoid Overpass timeouts. At small radii we can afford more query breadth.
function buildQuery(lat: number, lon: number, radiusM: number): string {
  const serverTimeout = radiusM > 10000 ? 55 : 25;
  
  // Core high-value tags — always included, fast (exact tag lookups)
  const core = `
  node["amenity"="piano"](around:${radiusM},${lat},${lon});
  way["amenity"="piano"](around:${radiusM},${lat},${lon});
  node["leisure"="piano"](around:${radiusM},${lat},${lon});
  node["musical_instrument"="piano"](around:${radiusM},${lat},${lon});
  node["instrument"="piano"](around:${radiusM},${lat},${lon});
  node["amenity"="music_school"](around:${radiusM},${lat},${lon});
  way["amenity"="music_school"](around:${radiusM},${lat},${lon});
  node["amenity"="conservatory"](around:${radiusM},${lat},${lon});
  way["amenity"="conservatory"](around:${radiusM},${lat},${lon});
  node["shop"="musical_instrument"](around:${radiusM},${lat},${lon});
  way["shop"="musical_instrument"](around:${radiusM},${lat},${lon});`;

  // Broader tags — only for smaller radii where volume is manageable
  const broader = radiusM <= 10000 ? `
  node["amenity"="library"](around:${radiusM},${lat},${lon});
  way["amenity"="library"](around:${radiusM},${lat},${lon});
  node["amenity"="community_centre"](around:${radiusM},${lat},${lon});
  way["amenity"="community_centre"](around:${radiusM},${lat},${lon});
  node["amenity"="arts_centre"](around:${radiusM},${lat},${lon});
  way["amenity"="arts_centre"](around:${radiusM},${lat},${lon});` : "";

  return `[out:json][timeout:${serverTimeout}];
(${core}${broader}
);
out center;`.trim();
}

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

async function tryEndpoint(
  endpoint: string,
  query: string,
  radiusM: number
): Promise<OverpassResponse> {
  console.log(`[Overpass] Trying ${endpoint} (radius=${radiusM}m)`);
  // Fetch timeout = server timeout + 10s buffer for network
  const fetchTimeoutMs = radiusM > 10000 ? 65_000 : 35_000;

  const res = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    },
    fetchTimeoutMs
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as OverpassResponse;
  console.log(`[Overpass] Success — ${json.elements?.length ?? 0} elements`);
  return json;
}

export async function queryOverpass(
  lat: number,
  lon: number,
  radiusKm: number
): Promise<OverpassElement[]> {
  const radiusM = Math.round(radiusKm * 1000);
  const query = buildQuery(lat, lon, radiusM);

  let lastError: Error | null = null;

  for (const endpoint of ENDPOINTS) {
    try {
      const response = await tryEndpoint(endpoint, query, radiusM);
      return response.elements ?? [];
    } catch (err) {
      console.warn(`[Overpass] ${endpoint} failed:`, (err as Error).message);
      lastError = err instanceof Error ? err : new Error(String(err));
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  throw lastError ?? new Error("All Overpass endpoints failed");
}
