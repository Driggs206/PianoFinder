"use client";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SearchForm } from "@/components/piano/SearchForm";
import { PianoCard } from "@/components/piano/PianoCard";
import { PianoDetailDrawer } from "@/components/piano/PianoDetailDrawer";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import type { SearchResponse, SearchError, PianoResult } from "@/lib/types";
import { ThemePicker } from "@/components/ui/ThemePicker";

// Leaflet must be client-only
const PianoMap = dynamic(
  () => import("@/components/map/PianoMap").then((m) => m.PianoMap),
  { ssr: false, loading: () => <div className="w-full h-full skeleton rounded-xl" /> }
);

type ViewTab = "list" | "map";

function ResultsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<ViewTab>("list");

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastSearchRef = useRef<string>("");

  const q = params.get("q") ?? "";
  const r = parseFloat(params.get("r") ?? "5");

  const doSearch = useCallback(
    async (location: string, radius: number) => {
      const key = `${location}::${radius}`;
      if (lastSearchRef.current === key) return;
      lastSearchRef.current = key;

      setLoading(true);
      setError(null);
      setSelectedId(null);

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationText: location, radiusKm: radius }),
        });

        const json = (await res.json()) as SearchResponse | SearchError;

        if (!res.ok || "error" in json) {
          setError((json as SearchError).error ?? "Search failed");
          setData(null);
        } else {
          setData(json as SearchResponse);
        }
      } catch {
        setError("Could not reach the server. Please check your connection.");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (q) doSearch(q, r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, r]);

  function handleNewSearch(location: string, radius: number) {
    lastSearchRef.current = "";
    const p = new URLSearchParams({ q: location, r: String(radius) });
    router.push(`/results?${p.toString()}`);
  }

  function handleSelectResult(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
    // Scroll card into view on list tab
    if (tab === "list") {
      const el = cardRefs.current.get(id);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  const selectedResult =
    data?.results.find((r) => r.id === selectedId) ?? null;

  const confirmedCount =
    data?.results.filter((r) => r.confidence === "confirmed").length ?? 0;
  const likelyCount =
    data?.results.filter((r) => r.confidence === "likely").length ?? 0;
  const mentionedCount =
    data?.results.filter((r) => r.confidence === "mentioned").length ?? 0;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="font-display text-base text-ink shrink-0 hover:text-gold transition-colors"
            aria-label="Home"
          >
            🎹
          </Link>
          <div className="flex-1 min-w-0">
            <SearchForm
              onSearch={handleNewSearch}
              loading={loading}
              initialLocation={q}
              initialRadius={r}
              compact
            />
          </div>
          <div className="shrink-0 hidden sm:block">
            <ThemePicker />
          </div>
        </div>
      </header>

      {/* Mobile tab toggle */}
      <div className="md:hidden border-b border-border flex">
        {(["list", "map"] as ViewTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors
              ${tab === t ? "text-gold border-b-2 border-gold" : "text-ink-muted"}`}
          >
            {t === "list" ? "List" : "Map"}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden max-w-screen-xl mx-auto w-full">
        {/* ── Results panel ── */}
        <aside
          className={`flex flex-col w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-border overflow-y-auto
            ${tab === "map" ? "hidden md:flex" : "flex"}`}
        >
          {/* Summary bar */}
          {data && !loading && (
            <div className="px-4 py-3 border-b border-border sticky top-0 bg-bg z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ink">
                  {data.totalCount === 0
                    ? "No results"
                    : `${data.totalCount} result${data.totalCount !== 1 ? "s" : ""}`}
                  <span className="text-ink-muted font-normal">
                    {" "}
                    near {data.geocoded.displayName.split(",")[0]}
                  </span>
                </p>
                {data.fromCache && (
                  <span className="text-[10px] text-ink-faint border border-border rounded px-1.5 py-0.5">
                    cached
                  </span>
                )}
              </div>
              {data.totalCount > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {confirmedCount > 0 && (
                    <span className="text-xs text-confirmed">
                      {confirmedCount} confirmed
                    </span>
                  )}
                  {likelyCount > 0 && (
                    <span className="text-xs text-likely">
                      {likelyCount} likely
                    </span>
                  )}
                  {mentionedCount > 0 && (
                    <span className="text-xs text-mentioned">
                      {mentionedCount} mentioned
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 p-3 space-y-2">
            {/* Loading skeletons */}
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}

            {/* Error state */}
            {!loading && error && (
              <div className="m-4 rounded-xl border border-mentioned/30 bg-mentioned/5 p-5 text-sm text-ink">
                <p className="font-medium text-mentioned mb-1">Search failed</p>
                <p className="text-ink-muted leading-relaxed">{error}</p>
                <button
                  onClick={() => doSearch(q, r)}
                  className="mt-3 text-xs text-gold hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && data && data.totalCount === 0 && (
              <div className="m-4 rounded-xl border border-border p-8 text-center">
                <p className="text-3xl mb-3">🎹</p>
                <p className="font-medium text-ink mb-2">No pianos found nearby</p>
                <p className="text-sm text-ink-muted leading-relaxed mb-4">
                  OpenStreetMap doesn&apos;t have piano data for this area yet.
                  Try a larger radius, or a different city.
                </p>
                {data.warnings?.map((w, i) => (
                  <p key={i} className="text-xs text-ink-faint">
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* Results */}
            {!loading &&
              !error &&
              data?.results.map((result) => (
                <div
                  key={result.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(result.id, el);
                    else cardRefs.current.delete(result.id);
                  }}
                  className="fade-in"
                >
                  <PianoCard
                    result={result}
                    isSelected={selectedId === result.id}
                    onClick={() => handleSelectResult(result.id)}
                  />
                </div>
              ))}
          </div>

          {/* Attribution footer */}
          <div className="px-4 py-3 border-t border-border text-[10px] text-ink-faint">
            Data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              OpenStreetMap
            </a>{" "}
            contributors, ODbL.{" "}
            <Link href="/about" className="hover:text-ink-muted transition-colors">
              Methodology
            </Link>
          </div>
        </aside>

        {/* ── Map panel ── */}
        <main
          className={`flex-1 relative ${tab === "list" ? "hidden md:block" : "block"}`}
        >
          {!loading && data ? (
            <PianoMap
              results={data.results}
              center={data.geocoded}
              radiusKm={data.radiusKm}
              selectedId={selectedId}
              onSelectResult={(id) => {
                handleSelectResult(id);
                setTab("list");
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-faint text-sm">
              {loading ? (
                <div className="skeleton w-full h-full" />
              ) : (
                "Search to see the map"
              )}
            </div>
          )}
        </main>
      </div>

      {/* Detail drawer */}
      <PianoDetailDrawer
        result={selectedResult}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <ResultsContent />
    </Suspense>
  );
}
