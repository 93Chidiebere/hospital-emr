import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FFFFFF",
          warm: "#F4F6F9",
          surface: "#FFFFFF",
          border: "#DCE3EA",
          "border-dark": "#C3CDD8",
        },
        charcoal: {
          DEFAULT: "#1A1A1A",
          muted: "#4F4F4F",
          subtle: "#666666",
          faint: "#767676",
        },
        // Muted "denim / hospital navy" blue (deliberately not a bright screen blue)
        brand: {
          DEFAULT: "#1F4E79",
          hover: "#173B5C",
          light: "#EAF1F8",
          border: "#B7CBE0",
        },
        terracotta: {
          DEFAULT: "#9E4732",
          light: "#FAECE9",
          border: "#E5C2BA",
        },
        amber: {
          alert: "#8F6724",
          light: "#FBF5E8",
          border: "#E8D5B0",
        },
      },
      fontFamily: {
        serif: ["Merriweather", "Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Consolas", "Monaco", "monospace"],
      },
      borderRadius: {
        none: "0px",
        subtle: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
