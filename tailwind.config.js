/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: "#FAFAF8",
        ink: "#16161A",
        terracotta: "#C4694A",
        forest: "#2D4A3E",
        sand: "#E8E0D5",
        mist: "#F3EFE9",
      },
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Cormorant Garamond", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(22,22,26,0.06)",
        lift: "0 12px 40px rgba(22,22,26,0.1)",
        glow: "0 0 40px rgba(196,105,74,0.18)",
      },
    },
  },
  plugins: [],
}
