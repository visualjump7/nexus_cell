import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Helvetica Neue', 'sans-serif'],
        // Brief views use font-serif for headings; render them in Oswald.
        serif: ['var(--font-display)', 'Helvetica Neue', 'sans-serif'],
      },
      // Pitch-site look: near-square corners. `full` is kept for dots/orbs.
      borderRadius: {
        sm: '1px',
        DEFAULT: '2px',
        md: '2px',
        lg: '3px',
        xl: '4px',
        '2xl': '6px',
        '3xl': '8px',
      },
      colors: {
        // Roaring Pines: burnished gold replaces the old emerald/teal accent app-wide.
        emerald: {
          50: '#FBF7EE', 100: '#F5EBD3', 200: '#EBD6A8', 300: '#E0BF7B', 400: '#D6AE5E',
          500: '#CDA14B', 600: '#B0853A', 700: '#8C6830', 800: '#6B4F28', 900: '#4F3B20', 950: '#2D2112',
        },
        teal: {
          50: '#FBF7EE', 100: '#F5EBD3', 200: '#EBD6A8', 300: '#E0BF7B', 400: '#D6AE5E',
          500: '#CDA14B', 600: '#B0853A', 700: '#8C6830', 800: '#6B4F28', 900: '#4F3B20', 950: '#2D2112',
        },
        // RP-leaning neutrals so every text-gray-* / text-slate-* reads on-brand.
        gray: {
          50: '#F5F5F5', 100: '#E6E8E9', 200: '#CDD1D3', 300: '#B4B9BC', 400: '#9AA0A4',
          500: '#6E7578', 600: '#565C60', 700: '#3A3E42', 800: '#26292C', 900: '#141618', 950: '#0A0B0C',
        },
        slate: {
          50: '#F5F5F5', 100: '#E6E8E9', 200: '#CDD1D3', 300: '#B4B9BC', 400: '#9AA0A4',
          500: '#6E7578', 600: '#565C60', 700: '#3A3E42', 800: '#26292C', 900: '#141618', 950: '#0A0B0C',
        },
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
          ink: '#111111',
        },
        // Nexus tokens (existing)
        background: "var(--background)",
        foreground: "#F5F5F5",
        main: '#0E0F11',
        sidebar: '#0E0F11',
        nexus: '#0A0B0C',
        'card-dark': '#0E0F11',
        // Shadcn-compatible aliases mapped to Nexus palette.
        // Fusion-ported components use these; Nexus components can use
        // either these or the Nexus tokens above.
        card: {
          DEFAULT: '#141618',
          foreground: '#F5F5F5',
        },
        popover: {
          DEFAULT: '#141618',
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
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        border: '#1F1F1F',
        input: '#26292C',
        ring: '#CDA14B',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
