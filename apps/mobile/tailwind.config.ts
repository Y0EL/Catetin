import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        success: { DEFAULT: '#16a34a', light: '#22c55e' },
        warning: { DEFAULT: '#f59e0b', light: '#fbbf24' },
        danger: { DEFAULT: '#dc2626', light: '#ef4444' },
        info: { DEFAULT: '#0284c7', light: '#38bdf8' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        input: '12px',
        card: '16px',
        sheet: '24px',
      },
    },
  },
  plugins: [],
} satisfies Config
