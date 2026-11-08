/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        galaxy: {
          void: "#000000",
          obsidian: "#0B0B0B",
          nebula: "#140710",
          card: "#0F0A0D",
          border: "#2E1122",
          neonPink: "#FF1493",
          hotPink: "#FF69B4",
          softPink: "#FFB6C1",
          deepPink: "#C71585",
          mutedPink: "#8A3B68",
        },
      },
    },
  },
  plugins: [],
};
