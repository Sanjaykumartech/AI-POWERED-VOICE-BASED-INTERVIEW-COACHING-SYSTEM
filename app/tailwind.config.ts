import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#060816",
        panel: "rgba(14, 19, 42, 0.72)",
        neon: "#76a9ff",
        iris: "#8b5cf6",
        aqua: "#22d3ee"
      },
      boxShadow: {
        glass: "0 24px 64px rgba(12, 18, 36, 0.45)"
      },
      backdropBlur: {
        xs: "2px"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseBorder: {
          "0%, 100%": { borderColor: "rgba(118, 169, 255, 0.18)" },
          "50%": { borderColor: "rgba(139, 92, 246, 0.45)" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseBorder: "pulseBorder 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

