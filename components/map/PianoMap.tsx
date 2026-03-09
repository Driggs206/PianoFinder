"use client";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { PianoResult, GeoPoint, ConfidenceTier } from "@/lib/types";

interface Props {
  results: PianoResult[];
  center: GeoPoint;
  radiusKm: number;
  selectedId: string | null;
  onSelectResult: (id: string) => void;
}

const CONFIDENCE_COLORS: Record<ConfidenceTier, string> = {
  confirmed: "#4ade80",
  likely: "#facc15",
  mentioned: "#f97316",
};

function createMarkerIcon(
  L: typeof import("leaflet"),
  tier: ConfidenceTier,
  selected: boolean
) {
  const color = CONFIDENCE_COLORS[tier];
  const size = selected ? 36 : 28;
  const shadow = selected
    ? `0 0 0 3px rgba(201,162,39,0.5), 0 3px 10px rgba(0,0,0,0.5)`
    : `0 2px 6px rgba(0,0,0,0.4)`;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:${shadow};
        border:2px solid rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        transition:all 0.15s ease;
      ">
        <span style="transform:rotate(45deg);font-size:${selected ? 16 : 13}px;display:block;">🎹</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 4)],
  });
}

export function PianoMap({
  results,
  center,
  radiusKm,
  selectedId,
  onSelectResult,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [center.lat, center.lon],
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });

      // Use Carto dark tiles — free, no API key, OSM attribution included
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Radius circle
      L.circle([center.lat, center.lon], {
        radius: radiusKm * 1000,
        color: "#c9a227",
        fillColor: "#c9a227",
        fillOpacity: 0.04,
        weight: 1,
        dashArray: "4 6",
      }).addTo(map);

      // Center marker
      L.circleMarker([center.lat, center.lon], {
        radius: 5,
        color: "#c9a227",
        fillColor: "#c9a227",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip("Search centre", { direction: "top" })
        .addTo(map);

      mapRef.current = map;

      // Add result markers
      results.forEach((r) => {
        const marker = L.marker([r.lat, r.lon], {
          icon: createMarkerIcon(L, r.confidence, r.id === selectedId),
          title: r.name,
          alt: r.name,
        });

        marker.bindPopup(
          `<div style="min-width:160px">
            <strong style="font-size:13px;display:block;margin-bottom:4px">${r.name}</strong>
            <span style="font-size:11px;color:#8a8799">${
              r.address ?? r.locality ?? ""
            }</span>
          </div>`,
          { maxWidth: 240 }
        );

        marker.on("click", () => onSelectResult(r.id));
        marker.addTo(map);
        markersRef.current.set(r.id, marker);
      });

      // Fit bounds to markers if any
      if (results.length > 0) {
        const group = L.featureGroup(
          results.map((r) => L.circleMarker([r.lat, r.lon]))
        );
        map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 15 });
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker icons when selection changes
  useEffect(() => {
    import("leaflet").then((L) => {
      markersRef.current.forEach((marker, id) => {
        const result = results.find((r) => r.id === id);
        if (!result) return;
        marker.setIcon(createMarkerIcon(L, result.confidence, id === selectedId));
      });

      // Pan to selected marker
      if (selectedId) {
        const selected = results.find((r) => r.id === selectedId);
        if (selected && mapRef.current) {
          mapRef.current.panTo([selected.lat, selected.lon], {
            animate: true,
            duration: 0.4,
          });
        }
      }
    });
  }, [selectedId, results]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      aria-label="Map showing piano locations"
      role="application"
    />
  );
}
