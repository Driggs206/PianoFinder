export interface Theme {
  id: string;
  name: string;
  description: string;
  dark: boolean;
  preview: { bg: string; accent: string; ink: string };
}

export const THEMES: Theme[] = [
  {
    id: "ebony-ivory",
    name: "Ebony & Ivory",
    description: "Classic black keys and white keys",
    dark: true,
    preview: { bg: "#0d0d10", accent: "#c9a227", ink: "#f0ece4" },
  },
  {
    id: "grand-concert",
    name: "Grand Concert",
    description: "Deep navy — a concert hall at night",
    dark: true,
    preview: { bg: "#0a0e1a", accent: "#d4a853", ink: "#f2ead8" },
  },
  {
    id: "jazz-club",
    name: "Jazz Club",
    description: "Smoky, warm bourbon tones",
    dark: true,
    preview: { bg: "#12090a", accent: "#e07020", ink: "#f5dfc0" },
  },
  {
    id: "sheet-music",
    name: "Sheet Music",
    description: "Clean paper white — light mode",
    dark: false,
    preview: { bg: "#f8f5ef", accent: "#1a1814", ink: "#1a1814" },
  },
  {
    id: "nocturne",
    name: "Nocturne",
    description: "Midnight blue — Chopin at 2am",
    dark: true,
    preview: { bg: "#05080f", accent: "#6090d0", ink: "#d8e8f8" },
  },
  {
    id: "ragtime",
    name: "Ragtime",
    description: "Sepia and parchment vintage warmth",
    dark: true,
    preview: { bg: "#1a1408", accent: "#c88020", ink: "#f5e8c8" },
  },
  {
    id: "blue-note",
    name: "Blue Note",
    description: "Cool cobalt jazz — late night sessions",
    dark: true,
    preview: { bg: "#080c14", accent: "#2060c0", ink: "#e8f0f8" },
  },
  {
    id: "fortissimo",
    name: "Fortissimo",
    description: "Bold red and black — full power",
    dark: true,
    preview: { bg: "#0e0808", accent: "#cc2020", ink: "#faf0f0" },
  },
  {
    id: "synthesizer",
    name: "Synthesizer",
    description: "Neon cyan on deep black — electronic",
    dark: true,
    preview: { bg: "#050810", accent: "#00e8c8", ink: "#c0f8f0" },
  },
  {
    id: "impressionist",
    name: "Impressionist",
    description: "Dusty rose and sage — à la Debussy",
    dark: true,
    preview: { bg: "#13100f", accent: "#c09080", ink: "#f0e8e0" },
  },
];

export const DEFAULT_THEME_ID = "ebony-ivory";

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
