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
        background: "var(--background)",
        foreground: "var(--foreground)",
        main: '#141520',
        sidebar: '#0f1117',
        card: '#1a1b2e',
        accent: '#4ade80',
        nexus: '#08090f',
        'card-dark': '#0f1117',
      },
    },
  },
  plugins: [],
};
export default config;
