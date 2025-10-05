/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}", "./index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Vercel-inspired dark theme palette
        dark: {
          bg: "#0a0a0a", // Main background - very dark
          surface: "#111111", // Cards, modals, elevated surfaces
          border: "#1a1a1a", // Subtle borders
          hover: "#1f1f1f", // Hover states
          text: "#ededed", // Primary text
          muted: "#a1a1a1", // Secondary/muted text
          accent: "#2563eb", // Blue accent for buttons
        },
      },
    },
  },
  plugins: [],
};
