import type { PianoResult } from "@/lib/types";

const DEDUPE_DISTANCE_M = 80; // metres

function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(the|a|an|of|at|in)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Simple greedy clustering: if two results are within DEDUPE_DISTANCE_M
// AND have similar names, merge them into one, keeping the higher-confidence one
export function deduplicateResults(results: PianoResult[]): PianoResult[] {
  const clusters: PianoResult[][] = [];

  for (const result of results) {
    let placed = false;
    for (const cluster of clusters) {
      const rep = cluster[0];
      const dist = haversineM(result.lat, result.lon, rep.lat, rep.lon);
      const sameArea = dist < DEDUPE_DISTANCE_M;
      const sameName =
        normaliseName(result.name) === normaliseName(rep.name) ||
        normaliseName(result.name).includes(normaliseName(rep.name)) ||
        normaliseName(rep.name).includes(normaliseName(result.name));

      if (sameArea && (sameName || dist < 20)) {
        cluster.push(result);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([result]);
  }

  // From each cluster, keep the highest-confidence member, merge evidence
  return clusters.map((cluster) => {
    const best = cluster.reduce((a, b) =>
      b.confidenceScore > a.confidenceScore ? b : a
    );
    const clusterSources = cluster.flatMap((r) => r.sources);
    const clusterEvidence = cluster.flatMap((r) => r.evidence);

    // Dedup evidence by label
    const uniqueEvidence = clusterEvidence.filter(
      (e, i, arr) => arr.findIndex((x) => x.label === e.label) === i
    );

    return {
      ...best,
      sources: clusterSources,
      evidence: uniqueEvidence,
      dedupeClusterId: `cluster-${best.id}`,
    };
  });
}

// Round lat/lon to ~1km grid for cache key
export function roundedCacheKey(
  lat: number,
  lon: number,
  radiusKm: number
): string {
  const precision = 2; // ~1km
  const rlat = lat.toFixed(precision);
  const rlon = lon.toFixed(precision);
  return `piano:${rlat},${rlon}:r${radiusKm}`;
}
