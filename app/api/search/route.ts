import { NextRequest, NextResponse } from "next/server";
import { geocode } from "@/lib/services/geocoding";
import { queryOverpass } from "@/lib/services/overpass";
import { scoreElement } from "@/lib/services/scoring";
import { deduplicateResults, roundedCacheKey } from "@/lib/services/dedup";
import { getCachedResults, setCachedResults } from "@/lib/services/cache";
import type {
  SearchRequest,
  SearchResponse,
  SearchError,
} from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: SearchRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json<SearchError>(
      { error: "Invalid JSON body", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  const { locationText, radiusKm } = body;
  console.log(`[search] Request: "${locationText}" radius=${radiusKm}`);

  // ── Validate input ──
  if (
    !locationText ||
    typeof locationText !== "string" ||
    locationText.trim().length < 2
  ) {
    return NextResponse.json<SearchError>(
      { error: "locationText is required (min 2 chars)", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  const radius = Number(radiusKm);
  if (!radius || radius < 0.5 || radius > 50) {
    return NextResponse.json<SearchError>(
      { error: "radiusKm must be between 0.5 and 50", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  // ── Geocode ──
  console.log(`[search] Geocoding "${locationText}"...`);
  let geo;
  try {
    geo = await geocode(locationText);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[search] Geocoding failed:`, msg);
    return NextResponse.json<SearchError>(
      {
        error: `Geocoding failed: ${msg}`,
        code: "GEOCODE_FAILED",
        details: msg,
      },
      { status: 502 }
    );
  }

  if (!geo) {
    console.warn(`[search] No geocoding result for "${locationText}"`);
    return NextResponse.json<SearchError>(
      {
        error: `Could not find a location for "${locationText}". Try a city name like "Toronto" or "London".`,
        code: "GEOCODE_FAILED",
      },
      { status: 404 }
    );
  }

  console.log(`[search] Geocoded to lat=${geo.lat} lon=${geo.lon}`);

  // ── Cache check (non-fatal if DB unavailable) ──
  const cacheKey = roundedCacheKey(geo.lat, geo.lon, radius);
  const cached = await getCachedResults(cacheKey);

  if (cached) {
    console.log(`[search] Cache hit — returning ${cached.length} results`);
    const response: SearchResponse = {
      results: cached,
      geocoded: geo,
      radiusKm: radius,
      totalCount: cached.length,
      fromCache: true,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(response);
  }

  // ── Fresh Overpass fetch ──
  console.log(`[search] Querying Overpass (radius=${radius}km)...`);
  let elements;
  try {
    elements = await queryOverpass(geo.lat, geo.lon, radius);
    console.log(`[search] Overpass returned ${elements.length} elements`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[search] Overpass failed:`, msg);
    return NextResponse.json<SearchError>(
      {
        error: `OpenStreetMap data service unreachable: ${msg}. Please try again in a moment.`,
        code: "OVERPASS_FAILED",
        details: msg,
      },
      { status: 502 }
    );
  }

  // ── Score and deduplicate ──
  const scored = elements.map(scoreElement);
  const results = deduplicateResults(scored).sort(
    (a, b) => b.confidenceScore - a.confidenceScore
  );
  console.log(`[search] Scored ${results.length} results after dedup`);

  // ── Cache results (non-fatal) ──
  await setCachedResults(cacheKey, results);

  const warnings: string[] = [];
  if (results.length === 0) {
    warnings.push(
      "No piano-related features found in this area. OSM coverage varies — try a larger radius or a different location."
    );
  }

  const response: SearchResponse = {
    results,
    geocoded: geo,
    radiusKm: radius,
    totalCount: results.length,
    fromCache: false,
    fetchedAt: new Date().toISOString(),
    warnings,
  };

  return NextResponse.json(response);
}
