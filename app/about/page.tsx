import Link from "next/link";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { CONFIDENCE_META } from "@/lib/types";
import { ThemePickerIsland } from "@/components/ui/ThemePickerIsland";

export const metadata = {
  title: "Methodology — Public Piano Finder",
  description:
    "How Public Piano Finder works: data sources, confidence tiers, and limitations.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-lg text-ink hover:text-gold transition-colors"
        >
          🎹 Piano Finder
        </Link>
        <div className="flex items-center gap-3">
          <ThemePickerIsland />
          <Link
            href="/"
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            ← Search
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 space-y-14">
        <header>
          <h1 className="font-display text-4xl text-ink mb-4">
            About &amp; Methodology
          </h1>
          <p className="text-ink-muted leading-relaxed text-lg">
            Public Piano Finder is evidence-first, not certainty-first. Every
            result comes with a confidence tier and an honest explanation of
            what we know — and don&apos;t know.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Data Sources</h2>
          <div className="space-y-4">
            <InfoCard title="OpenStreetMap / Overpass API" badge="Primary">
              <p>
                The primary data source. OSM contributors tag publicly
                accessible pianos with{" "}
                <code className="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-gold">
                  amenity=piano
                </code>
                , including street pianos, station pianos, library pianos, and
                more. We also query music schools, conservatories, libraries,
                community centres, and instrument shops — because these venues
                frequently have pianos even when not explicitly tagged.
              </p>
              <p className="mt-3">
                OSM data is crowd-sourced and varies significantly by city.
                Dense urban areas (London, Paris, New York, Toronto) have
                excellent coverage; smaller towns may have none.
              </p>
            </InfoCard>

            <InfoCard title="Nominatim" badge="Geocoding">
              <p>
                Location names are resolved to coordinates using the public
                Nominatim geocoding service, powered by OpenStreetMap data. We
                cache geocoding results aggressively and comply with
                Nominatim&apos;s usage policy (maximum 1 request per second, no
                autocomplete queries).
              </p>
            </InfoCard>

            <InfoCard title="Google Places / Yelp" badge="Not used in MVP">
              <p>
                These APIs are explicitly excluded from the MVP. Google Places
                review access is limited and billable at scale; Yelp&apos;s
                review API is similarly constrained. This app is designed to
                remain free to operate indefinitely.
              </p>
            </InfoCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Confidence Tiers</h2>
          <p className="text-ink-muted leading-relaxed">
            Each result is assigned a confidence tier based on a transparent,
            rule-based scoring algorithm — not AI inference.
          </p>
          <div className="space-y-3">
            {(["confirmed", "likely", "mentioned"] as const).map((tier) => (
              <div
                key={tier}
                className="rounded-xl border border-border bg-surface p-4 flex items-start gap-4"
              >
                <ConfidenceBadge tier={tier} size="md" />
                <p className="text-sm text-ink-muted leading-relaxed">
                  {CONFIDENCE_META[tier].description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Scoring Rules</h2>
          <p className="text-ink-muted leading-relaxed">
            Scores are deterministic and auditable. The rules applied, in
            descending weight:
          </p>
          <div className="rounded-xl border border-border overflow-hidden">
            {[
              { rule: "Direct piano tag (amenity=piano, leisure=piano, etc.)", points: "+60" },
              { rule: "Music school or instrument shop venue type", points: "+35" },
              { rule: 'Name contains "piano" or "keyboard"', points: "+20" },
              { rule: "Community centre, library, or arts venue", points: "+15" },
              { rule: "Access tagged as public", points: "+15" },
              { rule: "Access tagged as private or restricted", points: "−20" },
              { rule: "Tagged as disused or abandoned", points: "−40" },
            ].map(({ rule, points }, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 text-sm"
              >
                <span className="text-ink">{rule}</span>
                <span
                  className={`font-mono text-xs ${
                    points.startsWith("+") ? "text-confirmed" : "text-mentioned"
                  }`}
                >
                  {points}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint">
            Scores are clamped to 0–100. Confirmed ≥ 60, Likely ≥ 30,
            Mentioned &lt; 30.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink">
            What We Can&apos;t Know
          </h2>
          <div className="space-y-3 text-sm text-ink-muted leading-relaxed">
            <p>
              <strong className="text-ink">Is the piano still there?</strong>{" "}
              OSM data can be months or years old. A piano that was present when
              a contributor mapped it may have been moved or removed.
            </p>
            <p>
              <strong className="text-ink">Can you actually play it?</strong>{" "}
              A piano in a hotel lobby or restaurant is not the same as a street
              piano. Unless the OSM data explicitly marks access as public, we
              flag it as unknown.
            </p>
            <p>
              <strong className="text-ink">Opening hours.</strong> Even public
              pianos in train stations or libraries have restricted hours. Always
              check before making a special trip.
            </p>
            <p>
              <strong className="text-ink">Condition.</strong> OSM does not
              reliably capture whether an instrument is in tune or in playable
              condition.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink">
            Help Improve the Data
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            The best way to improve results is to contribute to OpenStreetMap
            directly. If you find a public piano that&apos;s not on the map, add
            it at{" "}
            <a
              href="https://www.openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              openstreetmap.org
            </a>{" "}
            with the tag{" "}
            <code className="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-gold">
              amenity=piano
            </code>
            . Your edit will be picked up the next time this area is searched.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6 text-sm text-ink-muted space-y-2">
          <p className="font-medium text-ink">Attribution</p>
          <p>
            Map data © OpenStreetMap contributors, available under the{" "}
            <a
              href="https://opendatacommons.org/licenses/odbl/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              Open Database Licence
            </a>
            . Map tiles © CARTO.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/50 px-6 py-4 text-xs text-ink-faint text-center">
        Public Piano Finder — built on open data, costs $0/month to operate.
      </footer>
    </div>
  );
}

function InfoCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-medium text-ink">{title}</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-ink-faint">
          {badge}
        </span>
      </div>
      <div className="text-sm text-ink-muted leading-relaxed">{children}</div>
    </div>
  );
}
