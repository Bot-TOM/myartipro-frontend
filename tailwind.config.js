/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1B4ED8',
          600: '#1B4ED8',
          700: '#1a3fb0',
          800: '#1e3a8a',
          900: '#1e3a5f',
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}
