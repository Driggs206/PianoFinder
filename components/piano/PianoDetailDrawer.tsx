"use client";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { CONFIDENCE_META, type PianoResult } from "@/lib/types";

interface Props {
  result: PianoResult | null;
  onClose: () => void;
}

const EVIDENCE_ICONS: Record<string, string> = {
  osm_direct_tag: "🎹",
  osm_name_match: "🏷️",
  osm_instrument_tag: "🎵",
  venue_type_signal: "🏛️",
  access_tag: "🔓",
  negative_signal: "⚠️",
};

export function PianoDetailDrawer({ result, onClose }: Props) {
  if (!result) return null;

  const meta = CONFIDENCE_META[result.confidence];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 1000 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${result.name}`}
        className="fixed bottom-0 right-0 h-full w-full max-w-md bg-surface border-l border-border overflow-y-auto flex flex-col md:top-0 max-md:top-auto max-md:h-[85vh] max-md:rounded-t-2xl" style={{ zIndex: 1001 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur border-b border-border p-5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <ConfidenceBadge tier={result.confidence} size="sm" />
            <h2 className="font-display text-xl text-ink mt-2 leading-snug">
              {result.name}
            </h2>
            {(result.address || result.locality) && (
              <p className="text-sm text-ink-muted mt-1">
                {[result.address, result.locality].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-elevated transition-colors"
            aria-label="Close details"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-5 space-y-6">
          {/* Uncertainty block */}
          <div className="rounded-lg bg-elevated border border-border p-4 text-sm space-y-2">
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-3">
              Confidence
            </p>
            <p className="text-ink leading-relaxed">{meta.description}</p>
            <div className="pt-2 space-y-1.5">
              <UncertaintyRow
                label="Piano exists"
                value={
                  result.pianoExistsConfidence === "high"
                    ? "High confidence"
                    : result.pianoExistsConfidence === "medium"
                    ? "Medium confidence"
                    : "Low confidence"
                }
                ok={result.pianoExistsConfidence !== "low"}
              />
              <UncertaintyRow
                label="Publicly playable"
                value={
                  result.publiclyPlayable === true
                    ? "Yes — tagged as public"
                    : result.publiclyPlayable === false
                    ? "Restricted access"
                    : "Unknown — verify in person"
                }
                ok={result.publiclyPlayable === true}
                warn={result.publiclyPlayable === null}
              />
              <UncertaintyRow
                label="Still present"
                value={result.mayNoLongerExist ? "May be disused or removed" : "No removal signals in OSM"}
                ok={!result.mayNoLongerExist}
                warn={result.mayNoLongerExist}
              />
            </div>
          </div>

          {/* Evidence */}
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-3">
              Evidence ({result.evidence.length} signals)
            </p>
            <ul className="space-y-2">
              {result.evidence.map((item, i) => (
                <li
                  key={i}
                  className={`rounded-lg p-3 text-sm border
                    ${
                      item.signal === "positive"
                        ? "bg-confirmed/5 border-confirmed/20"
                        : item.signal === "negative"
                        ? "bg-mentioned/5 border-mentioned/20"
                        : "bg-elevated border-border"
                    }`}
                >
                  <span className="mr-2">
                    {EVIDENCE_ICONS[item.type] ?? "•"}
                  </span>
                  <span className="text-ink">{item.label}</span>
                  {item.detail && (
                    <p className="text-xs text-ink-muted mt-1 ml-6">
                      {item.detail}
                    </p>
                  )}
                  {item.osmTagKey && (
                    <p className="text-[10px] font-mono text-ink-faint mt-1 ml-6">
                      {item.osmTagKey}={item.osmTagValue}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* OSM Tags */}
          {Object.keys(result.tags).length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-3">
                Raw OSM Tags
              </p>
              <div className="rounded-lg bg-elevated border border-border overflow-hidden">
                {Object.entries(result.tags).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex gap-3 px-3 py-2 border-b border-border last:border-0 text-xs"
                  >
                    <span className="font-mono text-ink-muted shrink-0">{k}</span>
                    <span className="font-mono text-ink break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Access notes */}
          {result.accessNotes && (
            <div>
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                Notes
              </p>
              <p className="text-sm text-ink leading-relaxed bg-elevated border border-border rounded-lg p-3">
                {result.accessNotes}
              </p>
            </div>
          )}

          {/* Links */}
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-3">
              External Links
            </p>
            <div className="flex flex-wrap gap-2">
              {result.externalLinks.osm && (
                <a
                  href={result.externalLinks.osm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-gold border border-gold/30 px-3 py-1.5 rounded-lg hover:bg-gold/10 transition-colors"
                >
                  View on OpenStreetMap ↗
                </a>
              )}
              {result.externalLinks.googleMaps && (
                <a
                  href={result.externalLinks.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-ink-muted border border-border px-3 py-1.5 rounded-lg hover:bg-elevated transition-colors"
                >
                  Open in Google Maps ↗
                </a>
              )}
            </div>
          </div>

          {/* Source metadata */}
          <div className="text-xs text-ink-faint border-t border-border pt-4">
            <p>
              Source: OpenStreetMap contributors (ODbL)
            </p>
            {result.freshnessDate && (
              <p className="mt-1">
                Data fetched:{" "}
                {new Date(result.freshnessDate).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            <p className="mt-1">OSM ID: {result.osmType}/{result.osmId}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function UncertaintyRow({
  label,
  value,
  ok,
  warn,
}: {
  label: string;
  value: string;
  ok?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-ink-muted">{label}</span>
      <span
        className={
          ok ? "text-confirmed" : warn ? "text-likely" : "text-mentioned"
        }
      >
        {value}
      </span>
    </div>
  );
}
