import type {
  OverpassElement,
  PianoResult,
  EvidenceItem,
  ConfidenceTier,
} from "@/lib/types";

// ─── Tag-based signal rules ────────────────────────────────────────────────────

const DIRECT_PIANO_TAGS: Record<string, string[]> = {
  amenity: ["piano"],
  leisure: ["piano"],
  musical_instrument: ["piano"],
  instrument: ["piano"],
};

const STRONG_VENUE_TAGS: Record<string, string[]> = {
  amenity: ["music_school", "conservatory"],
  shop: ["musical_instrument"],
};

const MEDIUM_VENUE_TAGS: Record<string, string[]> = {
  amenity: ["community_centre", "library", "arts_centre", "theatre"],
};

const NEGATIVE_TAG_KEYS = ["disused", "abandoned", "demolished"];

const PUBLIC_ACCESS_VALUES = ["yes", "public", "permissive"];
const RESTRICTED_ACCESS_VALUES = ["private", "customers", "no"];

function isDirectPianoTag(tags: Record<string, string>): boolean {
  return Object.entries(DIRECT_PIANO_TAGS).some(
    ([k, vals]) => tags[k] && vals.includes(tags[k])
  );
}

function hasNamePianoMatch(tags: Record<string, string>): boolean {
  const name = (tags.name ?? "").toLowerCase();
  return name.includes("piano") || name.includes("keyboard");
}

function getAccessSignal(
  tags: Record<string, string>
): "public" | "restricted" | "unknown" {
  const access = tags.access ?? tags["access:piano"] ?? "";
  if (PUBLIC_ACCESS_VALUES.includes(access)) return "public";
  if (RESTRICTED_ACCESS_VALUES.includes(access)) return "restricted";
  return "unknown";
}

// ─── Main scoring function ─────────────────────────────────────────────────────

export function scoreElement(element: OverpassElement): PianoResult {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat ?? 0;
  const lon = element.lon ?? element.center?.lon ?? 0;

  const evidence: EvidenceItem[] = [];
  let score = 0;

  // ── Direct piano tag (highest signal) ──
  if (isDirectPianoTag(tags)) {
    score += 60;
    evidence.push({
      type: "osm_direct_tag",
      label: "Directly tagged as piano in OpenStreetMap",
      detail: `Tag: ${Object.entries(DIRECT_PIANO_TAGS).find(([k, v]) => tags[k] && v.includes(tags[k]))?.[0]}=${tags[Object.entries(DIRECT_PIANO_TAGS).find(([k, v]) => tags[k] && v.includes(tags[k]))?.[0] ?? ""]}`,
      signal: "positive",
      osmTagKey: "amenity",
      osmTagValue: tags.amenity,
    });
  }

  // ── Strong venue type ──
  const strongMatch = Object.entries(STRONG_VENUE_TAGS).find(
    ([k, vals]) => tags[k] && vals.includes(tags[k])
  );
  if (strongMatch && !isDirectPianoTag(tags)) {
    score += 35;
    evidence.push({
      type: "venue_type_signal",
      label: `Venue type: ${tags[strongMatch[0]]}`,
      detail: "Music schools and instrument shops frequently have playable pianos",
      signal: "positive",
      osmTagKey: strongMatch[0],
      osmTagValue: tags[strongMatch[0]],
    });
  }

  // ── Medium venue type ──
  const mediumMatch = Object.entries(MEDIUM_VENUE_TAGS).find(
    ([k, vals]) => tags[k] && vals.includes(tags[k])
  );
  if (mediumMatch && !isDirectPianoTag(tags) && !strongMatch) {
    score += 15;
    evidence.push({
      type: "venue_type_signal",
      label: `Venue type: ${tags[mediumMatch[0]]}`,
      detail: "This venue type sometimes has pianos — not guaranteed",
      signal: "neutral",
      osmTagKey: mediumMatch[0],
      osmTagValue: tags[mediumMatch[0]],
    });
  }

  // ── Name match ──
  if (hasNamePianoMatch(tags)) {
    score += 20;
    evidence.push({
      type: "osm_name_match",
      label: `Name mentions "piano"`,
      detail: `Name: "${tags.name}"`,
      signal: "positive",
    });
  }

  // ── Access tag ──
  const accessSignal = getAccessSignal(tags);
  if (accessSignal === "public") {
    score += 15;
    evidence.push({
      type: "access_tag",
      label: "Access tagged as public",
      detail: `access=${tags.access}`,
      signal: "positive",
      osmTagKey: "access",
      osmTagValue: tags.access,
    });
  } else if (accessSignal === "restricted") {
    score -= 20;
    evidence.push({
      type: "access_tag",
      label: "Access may be restricted",
      detail: `access=${tags.access}`,
      signal: "negative",
      osmTagKey: "access",
      osmTagValue: tags.access,
    });
  }

  // ── Negative signals ──
  const hasNegative = NEGATIVE_TAG_KEYS.some((k) => tags[k]);
  if (hasNegative) {
    score -= 40;
    evidence.push({
      type: "negative_signal",
      label: "Marked as disused or abandoned in OSM",
      signal: "negative",
    });
  }

  // ── operator/brand instrument hint ──
  if (tags["instrument"] || tags["musical_instrument"]) {
    const val = tags["instrument"] ?? tags["musical_instrument"];
    if (val && val !== "piano") {
      score -= 5;
    }
    evidence.push({
      type: "osm_instrument_tag",
      label: `Instrument tag: ${val}`,
      signal: val?.toLowerCase().includes("piano") ? "positive" : "neutral",
      osmTagKey: "instrument",
      osmTagValue: val,
    });
  }

  score = Math.max(0, Math.min(100, score));

  // ── Tier assignment ──
  let confidence: ConfidenceTier;
  if (score >= 60 || isDirectPianoTag(tags)) {
    confidence = "confirmed";
  } else if (score >= 30) {
    confidence = "likely";
  } else {
    confidence = "mentioned";
  }

  // ── Uncertainty flags ──
  const publiclyPlayable: boolean | null =
    accessSignal === "public"
      ? true
      : accessSignal === "restricted"
      ? false
      : null;

  const osmLink =
    `https://www.openstreetmap.org/${element.type}/${element.id}`;

  const name =
    tags.name ??
    tags["name:en"] ??
    (isDirectPianoTag(tags) ? "Unnamed Piano" : "Unnamed Venue");

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    lat,
    lon,
    address: [tags["addr:housenumber"], tags["addr:street"]]
      .filter(Boolean)
      .join(" ") || undefined,
    locality:
      tags["addr:city"] ?? tags["addr:suburb"] ?? tags["addr:hamlet"] ?? undefined,
    confidence,
    confidenceScore: score,
    evidence,
    accessNotes:
      tags["note"] ?? tags["description"] ?? tags["opening_hours"] ?? undefined,
    venueType: tags.amenity ?? tags.leisure ?? tags.shop ?? undefined,
    osmId: element.id,
    osmType: element.type,
    tags,
    externalLinks: {
      osm: osmLink,
      googleMaps: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    },
    freshnessDate: new Date().toISOString(),
    sources: [
      {
        source: "overpass",
        fetchedAt: new Date().toISOString(),
        rawId: element.id,
      },
    ],
    pianoExistsConfidence:
      confidence === "confirmed"
        ? "high"
        : confidence === "likely"
        ? "medium"
        : "low",
    publiclyPlayable,
    accessUnknown: accessSignal === "unknown",
    mayBeStale: false,
    mayNoLongerExist: hasNegative,
  };
}
