import type { Config } from "tailwindcss";

// ── Roaring Pines palette ramps ────────────────────────────────────────────
// The concept has one accent (burnished gold), blue for focus/links/forecast,
// green for selection/"reached", and one derived alert colour. Every stock
// Tailwind hue is remapped onto one of these ramps as a safety net, so any
// leftover `text-red-400` / `bg-yellow-500/15` / `text-purple-400` still reads
// on-brand. This is not a licence to use them: new code uses the `rp-*`
// tokens and the components in components/rp.
const GOLD = {
  50: '#FBF7EE', 100: '#F5EBD3', 200: '#EBD6A8', 300: '#E0BF7B', 400: '#D6AE5E',
  500: '#CDA14B', 600: '#B0853A', 700: '#8C6830', 800: '#6B4F28', 900: '#4F3B20', 950: '#2D2112',
};
const ALERT = {
  50: '#FBEFEC', 100: '#F5D9D2', 200: '#EBB3A6', 300: '#DE8C79', 400: '#D3705A',
  500: '#C8553D', 600: '#A84432', 700: '#853528', 800: '#63281E', 900: '#431B14', 950: '#2A110D',
};
const GREEN = {
  50: '#F4F9EA', 100: '#E7F2D3', 200: '#D5E8B4', 300: '#C5E09A', 400: '#B6D67D',
  500: '#A4CC5C', 600: '#86AD43', 700: '#6E9A2E', 800: '#527322', 900: '#384F17', 950: '#212E0D',
};
const BLUE = {
  50: '#EEF5FB', 100: '#D7E8F5', 200: '#B5D4EE', 300: '#8DBDE4', 400: '#5FA2D8',
  500: '#3989CB', 600: '#2D6FA6', 700: '#245883', 800: '#1B4262', 900: '#122C42', 950: '#0B1B29',
};
// RP-leaning neutrals: gray-400 = muted, gray-500 = dim, gray-800 = line-2,
// gray-900 = surface, gray-950 = bg.
const NEUTRAL = {
  50: '#F5F5F5', 100: '#E6E8E9', 200: '#CDD1D3', 300: '#B4B9BC', 400: '#9AA0A4',
  500: '#6E7578', 600: '#565C60', 700: '#3A3E42', 800: '#26292C', 900: '#141618', 950: '#0A0B0C',
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Helvetica Neue', 'sans-serif'],
        // Brief views use font-serif for headings; render them in Oswald.
        serif: ['var(--font-display)', 'Helvetica Neue', 'sans-serif'],
        // The concept never uses a monospace face. Leftover `font-mono`
        // renders in the body face with tabular figures (see globals.css).
        mono: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      // The concept is square. `full` is kept for true circles only
      // (the orb, play discs, chart dots).
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
      },
      colors: {
        // Burnished gold replaces the old emerald/teal accent app-wide.
        emerald: GOLD,
        teal: GOLD,
        yellow: GOLD,
        amber: GOLD,
        orange: GOLD,
        // Derived alert colour (#C8553D): overdue, over budget, urgent, destructive.
        red: ALERT,
        rose: ALERT,
        // Selection / complete / on track.
        green: GREEN,
        lime: GREEN,
        // Focus / links / scheduled / informational.
        blue: BLUE,
        sky: BLUE,
        cyan: BLUE,
        purple: BLUE,
        violet: BLUE,
        indigo: BLUE,
        fuchsia: BLUE,
        pink: BLUE,
        gray: NEUTRAL,
        slate: NEUTRAL,
        zinc: NEUTRAL,
        neutral: NEUTRAL,
        stone: NEUTRAL,
        // Roaring Pines tokens (mirror of --rp-* in globals.css)
        rp: {
          bg: '#0A0B0C',
          panel: '#0E0F11',
          surface: '#141618',
          line: '#1F1F1F',
          line2: '#26292C',
          line3: '#3A3E42',
          text: '#F5F5F5',
          muted: '#9AA0A4',
          dim: '#6E7578',
          gold: '#CDA14B',
          blue: '#3989CB',
          green: '#A4CC5C',
          alert: '#C8553D',
          seg: '#4C5257',
          segtext: '#C8CCCF',
          ink: '#111111',
        },
        // Nexus tokens (existing)
        background: "var(--background)",
        foreground: "#F5F5F5",
        main: '#0E0F11',
        sidebar: '#0E0F11',
        nexus: '#0A0B0C',
        'card-dark': '#0E0F11',
        // Shadcn-compatible aliases mapped to the RP palette.
        card: {
          DEFAULT: '#0A0B0C',
          foreground: '#F5F5F5',
        },
        popover: {
          DEFAULT: '#0A0B0C',
          foreground: '#F5F5F5',
        },
        primary: {
          DEFAULT: '#CDA14B',
          foreground: '#111111',
        },
        secondary: {
          DEFAULT: '#141618',
          foreground: '#F5F5F5',
        },
        muted: {
          DEFAULT: '#0E0F11',
          foreground: '#9AA0A4',
        },
        accent: {
          DEFAULT: '#CDA14B',
          foreground: '#111111',
        },
        destructive: {
          DEFAULT: '#C8553D',
          foreground: '#F5F5F5',
        },
        border: '#1F1F1F',
        input: '#4C5257',
        ring: '#3989CB',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
