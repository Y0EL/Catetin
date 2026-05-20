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
        surface: {
          bg: '#ffffff',
          1: '#fafafa',
          2: '#f4f4f5',
          'bg-dark': '#09090b',
          '1-dark': '#18181b',
          '2-dark': '#27272a',
        },
        success: { DEFAULT: '#16a34a', dark: '#22c55e' },
        warning: { DEFAULT: '#f59e0b', dark: '#fbbf24' },
        danger: { DEFAULT: '#dc2626', dark: '#ef4444' },
        info: { DEFAULT: '#0284c7', dark: '#38bdf8' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
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
