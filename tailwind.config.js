/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: {
          50: '#ffffff',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          border: '#e2e8f0',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          accent: '#0284c7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(99, 102, 241, 0.08), 0 8px 10px -6px rgba(99, 102, 241, 0.05)',
        'glow-indigo': '0 4px 20px -2px rgba(79, 70, 229, 0.25)',
        'glow-cyan': '0 4px 20px -2px rgba(2, 132, 199, 0.25)',
      }
    },
  },
  plugins: [],
}
