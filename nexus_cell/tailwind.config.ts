import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
          DEFAULT: '#4ade80',
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
          DEFAULT: '#4ade80',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        border: 'rgba(255, 255, 255, 0.1)',
        input: 'rgba(255, 255, 255, 0.1)',
        ring: '#4ade80',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
