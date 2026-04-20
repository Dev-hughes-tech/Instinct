import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // INSTINCT premium white / silver palette.
        surface: {
          0: "#FFFFFF",
          50: "#FBFCFD",
          100: "#F5F6F8",
          150: "#EEF0F3",
          200: "#E6E9ED",
          300: "#D6DADF",
          400: "#BCC2C9",
          500: "#9AA1AA",
          600: "#6E757D",
          700: "#454A51",
          800: "#2B2F34",
          900: "#161A1E"
        },
        accent: {
          blue: "#3E8BFF",
          cyan: "#38D1E0",
          mint: "#5BD4A4",
          gold: "#D9B36A",
          coral: "#EF6F6C",
          violet: "#8C7BFF"
        },
        trackColor: {
          kick: "#E2B973",
          snare: "#D97E7E",
          hats: "#7EBFD9",
          perc: "#B57ED9",
          bass: "#7ED9A3",
          keys: "#D97EC7",
          vox: "#7E9FD9",
          fx: "#D9C17E"
        },
        meter: {
          green: "#4CD07A",
          amber: "#E8B84F",
          red: "#E85C5C"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "Menlo",
          "Consolas",
          "monospace"
        ]
      },
      boxShadow: {
        // Subtle premium lifts (no heavy drop shadows).
        lift: "0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(20,22,26,0.06), 0 2px 6px rgba(20,22,26,0.04)",
        panel:
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 1px rgba(20,22,26,0.04), 0 6px 18px rgba(20,22,26,0.06)",
        strip:
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(20,22,26,0.04), 0 4px 14px rgba(20,22,26,0.05)",
        inset:
          "inset 0 1px 2px rgba(20,22,26,0.08), inset 0 -1px 0 rgba(255,255,255,0.8)",
        pop: "0 2px 10px rgba(20,22,26,0.08), 0 1px 0 rgba(255,255,255,0.9) inset",
        glow: "0 0 24px rgba(62,139,255,0.25)"
      },
      borderRadius: {
        xs: "3px",
        sm: "5px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "28px"
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "12px", letterSpacing: "0.04em" }],
        xs: ["11px", { lineHeight: "14px" }],
        sm: ["12px", { lineHeight: "16px" }],
        base: ["13px", { lineHeight: "18px" }]
      },
      spacing: {
        px2: "2px",
        px3: "3px"
      }
    }
  },
  plugins: []
};

export default config;
