"use client";
import { CONFIDENCE_META, type ConfidenceTier } from "@/lib/types";

interface Props {
  tier: ConfidenceTier;
  showDot?: boolean;
  size?: "sm" | "md";
}

const DOT_COLORS: Record<ConfidenceTier, string> = {
  confirmed: "bg-confirmed",
  likely: "bg-likely",
  mentioned: "bg-mentioned",
};

const BORDER_COLORS: Record<ConfidenceTier, string> = {
  confirmed: "border-confirmed/30 text-confirmed",
  likely: "border-likely/30 text-likely",
  mentioned: "border-mentioned/30 text-mentioned",
};

export function ConfidenceBadge({ tier, showDot = true, size = "sm" }: Props) {
  const meta = CONFIDENCE_META[tier];
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-sans font-medium ${sizeClass} ${BORDER_COLORS[tier]}`}
      title={meta.description}
    >
      {showDot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${DOT_COLORS[tier]}`}
          aria-hidden="true"
        />
      )}
      {meta.label}
    </span>
  );
}
