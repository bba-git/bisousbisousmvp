/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#191970",
        secondary: "#4ECDC4",
        accent: "#FFE66D",
        'midnight-blue': "#191970",
      },
    },
  },
  plugins: [],
} 