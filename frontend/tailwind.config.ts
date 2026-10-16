import type { Config } from "tailwindcss";

const ease = "cubic-bezier(0.2, 0.7, 0.2, 1)";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#eef4fb",
          100: "#d7e5f5",
          200: "#b3cdec",
          300: "#86aedf",
          400: "#5a8dcd",
          500: "#3b6fb6",
          600: "#2f5d9e",
          700: "#264b80",
          800: "#1f3d68",
          900: "#192f4f",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translate3d(0, 14px, 0)" },
          to: { opacity: "1", transform: "none" },
        },
        "page-in": {
          from: { opacity: "0", transform: "translate3d(0, 6px, 0)" },
          to: { opacity: "1", transform: "none" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(4%, -6%, 0) scale(1.08)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "dash-flow": { to: { strokeDashoffset: "-18" } },
        sweep: { from: { transform: "translateX(-12%)" }, to: { transform: "translateX(100%)" } },
        "wave-x": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "cell-pulse": {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%": { transform: "scale(0.82)", filter: "brightness(1.25)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        "fade-up": `fade-up 0.8s ${ease} both`,
        "page-in": `page-in 0.45s ${ease} both`,
        drift: "drift 18s ease-in-out infinite",
        "drift-slow": "drift 26s ease-in-out infinite reverse",
        "gradient-x": "gradient-x 8s ease-in-out infinite",
        "dash-flow": "dash-flow 1.6s linear infinite",
        sweep: "sweep 3.2s linear infinite",
        "wave-x": "wave-x 6s linear infinite",
        "cell-pulse": "cell-pulse 3.6s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
