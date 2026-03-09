import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // All colors now come from CSS variables — themes work automatically
        bg:             "var(--color-bg)",
        surface:        "var(--color-surface)",
        elevated:       "var(--color-elevated)",
        border:         "var(--color-border)",
        "border-strong":"var(--color-border-strong)",
        ink:            "var(--color-ink)",
        "ink-muted":    "var(--color-ink-muted)",
        "ink-faint":    "var(--color-ink-faint)",
        gold:           "var(--color-accent)",
        "gold-light":   "var(--color-accent-light)",
        "gold-dark":    "var(--color-accent-dark)",
        ebony:          "var(--color-bg)",
        // Confidence colors stay fixed — they are semantic, not themed
        confirmed: "#4ade80",
        likely:    "#facc15",
        mentioned: "#f97316",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
