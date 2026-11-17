import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0B1020",
          light: "#F8FAFC"
        },
        surface: {
          DEFAULT: "#151C2F",
          muted: "#1E2742",
          light: "#FFFFFF",
          "light-muted": "#F1F5F9"
        },
        primary: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
          foreground: "#FFFFFF",
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA"
        },
        secondary: {
          DEFAULT: "#06B6D4",
          hover: "#0891B2",
          foreground: "#FFFFFF"
        },
        success: {
          DEFAULT: "#22C55E",
          hover: "#16A34A",
          muted: "#14532D",
          foreground: "#FFFFFF"
        },
        warning: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          muted: "#78350F",
          foreground: "#FFFFFF"
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          muted: "#7F1D1D",
          foreground: "#FFFFFF"
        },
        card: {
          DEFAULT: "#151C2F",
          border: "#232D48"
        },
        border: {
          DEFAULT: "#232D48",
          light: "#E2E8F0"
        }
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem"
      }
    },
  },
  plugins: [],
};
export default config;
