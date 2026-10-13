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
        cream: {
          DEFAULT: "#FDFBF7",
          warm: "#F5F2EA",
          surface: "#FFFFFF",
          border: "#E5E0D8",
          "border-dark": "#D5CEBF",
        },
        charcoal: {
          DEFAULT: "#1A1A1A",
          muted: "#4F4F4F",
          subtle: "#7E7E7E",
          faint: "#A8A8A8",
        },
        sage: {
          DEFAULT: "#3D5245",
          hover: "#2F3F35",
          light: "#F0F4F1",
          border: "#C2D1C6",
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
