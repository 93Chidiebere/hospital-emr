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
          DEFAULT: "#111111",
          muted: "#3F3F3F",
          subtle: "#555555",
          faint: "#666666",
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
        serif: ["Source Serif 4", "Georgia", "Times New Roman", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "Monaco", "monospace"],
      },
      // One step heavier than Tailwind's defaults so text reads well on projectors
      fontWeight: {
        normal: "500",
        medium: "600",
        semibold: "700",
        bold: "800",
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
