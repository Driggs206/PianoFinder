"use client";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import type { PianoResult } from "@/lib/types";

interface Props {
  result: PianoResult;
  isSelected: boolean;
  onClick: () => void;
}

export function PianoCard({ result, isSelected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border rounded-xl p-4 transition-all duration-150 cursor-pointer group
        ${
          isSelected
            ? "border-gold bg-elevated"
            : "border-border hover:border-border-strong hover:bg-elevated/60"
        }`}
      aria-pressed={isSelected}
      aria-label={`View details for ${result.name}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-sans font-medium text-sm text-ink leading-snug flex-1">
          {result.name}
        </h3>
        <ConfidenceBadge tier={result.confidence} />
      </div>

      {(result.address || result.locality) && (
        <p className="text-xs text-ink-muted mb-3 truncate">
          {[result.address, result.locality].filter(Boolean).join(", ")}
        </p>
      )}

      {/* Top evidence item */}
      {result.evidence.length > 0 && (
        <p className="text-xs text-ink-faint leading-relaxed line-clamp-2">
          {result.evidence[0].label}
          {result.evidence[0].detail ? ` — ${result.evidence[0].detail}` : ""}
        </p>
      )}

      {/* Uncertainty warnings */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {result.accessUnknown && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-elevated border border-border text-ink-muted">
            Access unknown
          </span>
        )}
        {result.publiclyPlayable === false && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-elevated border border-mentioned/30 text-mentioned">
            May not be public
          </span>
        )}
        {result.mayNoLongerExist && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-elevated border border-mentioned/30 text-mentioned">
            May be disused
          </span>
        )}
        {result.publiclyPlayable === true && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-elevated border border-confirmed/30 text-confirmed">
            Public access
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-ink-faint">
          OSM #{result.osmId}
        </span>
        <span className="text-[10px] text-gold opacity-0 group-hover:opacity-100 transition-opacity">
          View details →
        </span>
      </div>
    </button>
  );
}
