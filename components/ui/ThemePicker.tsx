"use client";
import { useEffect, useRef, useState } from "react";
import { THEMES, DEFAULT_THEME_ID, getTheme, type Theme } from "@/lib/themes";

const STORAGE_KEY = "piano-finder-theme";

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.find((t) => t.id === saved)) {
      applyTheme(saved);
      setThemeId(saved);
    }
  }, []);

  function applyTheme(id: string) {
    document.documentElement.setAttribute("data-theme", id);
    const theme = getTheme(id);
    document.documentElement.style.colorScheme = theme.dark ? "dark" : "light";
    localStorage.setItem(STORAGE_KEY, id);
    setThemeId(id);
  }

  return { themeId, applyTheme, currentTheme: getTheme(themeId) };
}

export function ThemePicker() {
  const { themeId, applyTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change color theme"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "5px 10px",
          borderRadius: "8px",
          border: "1px solid #c9a227",
          background: "#1a1a24",
          color: "#f0ece4",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {/* Colour swatch */}
        <span style={{ display: "flex", gap: "1px", borderRadius: "3px", overflow: "hidden", width: 18, height: 14, flexShrink: 0 }}>
          <span style={{ flex: 1, background: current.preview.bg }} />
          <span style={{ width: 5, background: current.preview.accent }} />
        </span>
        <span>{current.name}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", color: "#8a8799" }}
        >
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Color themes"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            width: "260px",
            background: "var(--color-surface, #13131a)",
            border: "1px solid var(--color-border, #252530)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "6px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 8px", color: "var(--color-ink-faint, #44424f)" }}>
              🎨 Color Theme
            </p>
            {THEMES.map((theme) => (
              <ThemeOption
                key={theme.id}
                theme={theme}
                selected={theme.id === themeId}
                onSelect={() => { applyTheme(theme.id); setOpen(false); }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeOption({ theme, selected, onSelect }: { theme: Theme; selected: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "7px 8px",
        borderRadius: "8px",
        background: selected || hovered ? "var(--color-elevated, #1a1a24)" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ width: 32, height: 20, borderRadius: 4, display: "flex", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
        <span style={{ flex: 1, background: theme.preview.bg }} />
        <span style={{ width: 8, background: theme.preview.accent }} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-ink, #f0ece4)", display: "block" }}>{theme.name}</span>
        <span style={{ fontSize: 10, color: "var(--color-ink-muted, #8a8799)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{theme.description}</span>
      </span>
      {selected && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "#c9a227", flexShrink: 0 }}>
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
