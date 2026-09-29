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
        // Nexus tokens (existing)
        background: "var(--background)",
        foreground: "var(--foreground)",
        main: '#141520',
        sidebar: '#0f1117',
        nexus: '#08090f',
        'card-dark': '#0f1117',
        // Shadcn-compatible aliases mapped to Nexus palette.
        // Fusion-ported components use these; Nexus components can use
        // either these or the Nexus tokens above.
        card: {
          DEFAULT: '#1a1b2e',
          foreground: '#ffffff',
        },
        popover: {
          DEFAULT: '#1a1b2e',
          foreground: '#ffffff',
        },
        primary: {
          DEFAULT: '#CDA14B',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#141520',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#0f1117',
          foreground: 'rgba(255, 255, 255, 0.6)',
        },
        accent: {
          DEFAULT: '#CDA14B',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        border: 'rgba(255, 255, 255, 0.1)',
        input: 'rgba(255, 255, 255, 0.1)',
        ring: '#CDA14B',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
