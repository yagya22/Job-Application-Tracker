/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'DM Mono'", "monospace"],
      },
      colors: {
        ink:  "#0a0f1a",
        navy: "#1e2b3c",
        mist: "#f0f4f8",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        lift: "0 4px 20px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};
