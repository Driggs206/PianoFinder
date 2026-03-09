// ─── Confidence Tiers ─────────────────────────────────────────────────────────

export type ConfidenceTier = "confirmed" | "likely" | "mentioned";

export const CONFIDENCE_META: Record<
  ConfidenceTier,
  { label: string; description: string; cssColor: string }
> = {
  confirmed: {
    label: "Confirmed",
    cssColor: "#4ade80",
    description:
      "A piano is directly tagged in OpenStreetMap, or has been recently confirmed by a contributor. High probability it exists and is physically present.",
  },
  likely: {
    label: "Likely",
    cssColor: "#facc15",
    description:
      "Strong indirect evidence — e.g. a music school, arts centre, or venue explicitly associated with piano performance in OSM tags.",
  },
  mentioned: {
    label: "Mentioned",
    cssColor: "#f97316",
    description:
      "The venue type or name suggests a piano may be present. Treat as a tip to investigate in person, not a guarantee.",
  },
};

// ─── Evidence ─────────────────────────────────────────────────────────────────

export type EvidenceSignal = "positive" | "negative" | "neutral";

export type EvidenceType =
  | "osm_direct_tag"
  | "osm_name_match"
  | "osm_instrument_tag"
  | "venue_type_signal"
  | "access_tag"
  | "negative_signal";

export interface EvidenceItem {
  type: EvidenceType;
  label: string;
  detail?: string;
  signal: EvidenceSignal;
  osmTagKey?: string;
  osmTagValue?: string;
}

// ─── Source Record ─────────────────────────────────────────────────────────────

export type DataSource = "overpass" | "google_places" | "community";

export interface SourceRecord {
  source: DataSource;
  fetchedAt: string; // ISO date
  rawId?: string | number;
}

// ─── Piano Result ─────────────────────────────────────────────────────────────

export interface PianoResult {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  locality?: string;
  confidence: ConfidenceTier;
  confidenceScore: number; // 0–100
  evidence: EvidenceItem[];
  accessNotes?: string;
  venueType?: string;
  osmId?: string | number;
  osmType?: "node" | "way" | "relation";
  tags: Record<string, string>;
  externalLinks: {
    osm?: string;
    googleMaps?: string;
  };
  freshnessDate?: string;
  dedupeClusterId?: string;
  sources: SourceRecord[];
  // Uncertainty flags
  pianoExistsConfidence: "high" | "medium" | "low";
  publiclyPlayable: boolean | null; // null = unknown
  accessUnknown: boolean;
  mayBeStale: boolean;
  mayNoLongerExist: boolean;
}

// ─── API Contracts ─────────────────────────────────────────────────────────────

export interface SearchRequest {
  locationText: string;
  radiusKm: number;
}

export interface GeoPoint {
  lat: number;
  lon: number;
  displayName: string;
}

export interface SearchResponse {
  results: PianoResult[];
  geocoded: GeoPoint;
  radiusKm: number;
  totalCount: number;
  fromCache: boolean;
  fetchedAt: string;
  warnings?: string[];
}

export interface SearchError {
  error: string;
  code: "GEOCODE_FAILED" | "OVERPASS_FAILED" | "INVALID_INPUT" | "SERVER_ERROR";
  details?: string;
}

export interface HealthResponse {
  status: "ok";
  timestamp: string;
  db: "connected" | "error";
  version: string;
}

// ─── Overpass Raw ─────────────────────────────────────────────────────────────

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}
