"use client";
import { useState, type FormEvent } from "react";

interface Props {
  onSearch: (location: string, radius: number) => void;
  loading: boolean;
  initialLocation?: string;
  initialRadius?: number;
  compact?: boolean;
}

const RADIUS_OPTIONS = [
  { value: 1, label: "1 km" },
  { value: 2, label: "2 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" },
];

export function SearchForm({
  onSearch,
  loading,
  initialLocation = "",
  initialRadius = 5,
  compact = false,
}: Props) {
  const [location, setLocation] = useState(initialLocation);
  const [radius, setRadius] = useState(initialRadius);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = location.trim();
    if (!trimmed) return;
    onSearch(trimmed, radius);
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location…"
          aria-label="Location"
          className="flex-1 min-w-0 bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-gold/60 focus:outline-none transition-colors"
        />
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          aria-label="Search radius"
          className="bg-elevated border border-border rounded-lg px-2 py-2 text-sm text-ink focus:border-gold/60 focus:outline-none transition-colors"
        >
          {RADIUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || !location.trim()}
          className="px-4 py-2 rounded-lg bg-gold text-ebony text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="location" className="block text-sm font-medium text-ink-muted">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Toronto, ON · Paris, France · Union Station"
          aria-label="Search location"
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3.5 text-ink placeholder:text-ink-faint focus:border-gold/60 focus:outline-none transition-colors text-base"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="radius" className="block text-sm font-medium text-ink-muted">
          Search radius
        </label>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Radius options">
          {RADIUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setRadius(o.value)}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                radius === o.value
                  ? "bg-gold/15 border-gold/50 text-gold"
                  : "bg-elevated border-border text-ink-muted hover:border-border-strong hover:text-ink"
              }`}
              aria-pressed={radius === o.value}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !location.trim()}
        className="w-full py-3.5 rounded-xl bg-gold text-ebony font-medium text-base hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Searching…
          </span>
        ) : (
          "Find Pianos"
        )}
      </button>
    </form>
  );
}
