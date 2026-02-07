/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a"
        }
      },
      boxShadow: {
        card: "0 10px 30px rgba(2, 8, 23, 0.35)",
        glow: "0 0 0 1px rgba(59, 130, 246, 0.45), 0 10px 30px rgba(59, 130, 246, 0.25)"
      }
    }
  },
  plugins: []
};
