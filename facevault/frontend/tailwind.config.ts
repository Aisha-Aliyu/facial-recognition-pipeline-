import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        void: "#1c1c1c",
        muted: "#5a4e4e",
        gold: "#bfa27a",
        surface: "#242020",
        "surface-raised": "#2e2929",
      },
    },
  },
  plugins: [],
};

export default config;
