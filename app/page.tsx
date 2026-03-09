"use client";
import { useRouter } from "next/navigation";
import { ThemePicker } from "@/components/ui/ThemePicker";
import { SearchForm } from "@/components/piano/SearchForm";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  function handleSearch(location: string, radius: number) {
    const params = new URLSearchParams({
      q: location,
      r: String(radius),
    });
    router.push(`/results?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border/50 px-6 py-4 flex items-center justify-between gap-4">
        <span className="font-display text-lg text-ink">🎹 Piano Finder</span>
        <div className="flex items-center gap-3">
          <ThemePicker />
          <Link
            href="/about"
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Methodology
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Piano keys decorative strip */}
        <div className="flex gap-px mb-12 opacity-20" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-b-sm ${
                [1, 3, 6, 8, 10].includes(i % 12)
                  ? "w-3 h-10 bg-ink-faint -mx-1.5 z-10 mt-0"
                  : "w-5 h-16 bg-ink"
              }`}
            />
          ))}
        </div>

        <h1 className="font-display text-4xl md:text-5xl text-center text-ink mb-4 leading-tight max-w-xl">
          Find a piano
          <br />
          <em className="text-gold not-italic">you can actually play.</em>
        </h1>

        <p className="text-center text-ink-muted max-w-md mb-12 leading-relaxed">
          Discover publicly playable pianos near any location — in train
          stations, libraries, cafés, and parks. Evidence drawn from
          OpenStreetMap, updated by the community.
        </p>

        <div className="w-full max-w-lg">
          <SearchForm onSearch={handleSearch} loading={false} initialRadius={5} />
        </div>

        {/* Example searches */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {[
            "Toronto, ON",
            "London, UK",
            "Paris, France",
            "New York, NY",
            "Amsterdam",
          ].map((place) => (
            <button
              key={place}
              onClick={() => handleSearch(place, 5)}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-ink-muted hover:border-border-strong hover:text-ink transition-colors"
            >
              {place}
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-5 flex flex-wrap gap-4 items-center justify-between text-xs text-ink-faint">
        <span>
          Data from{" "}
          <a
            href="https://www.openstreetmap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            OpenStreetMap
          </a>{" "}
          contributors (ODbL). Geocoding by{" "}
          <a
            href="https://nominatim.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Nominatim
          </a>
          .
        </span>
        <Link href="/about" className="hover:text-ink-muted transition-colors">
          About &amp; Methodology
        </Link>
      </footer>
    </div>
  );
}
