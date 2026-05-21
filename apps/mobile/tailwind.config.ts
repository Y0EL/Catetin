import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#52525b',
          600: '#18181b',
          700: '#131316',
          800: '#0c0c0e',
          900: '#09090b',
          950: '#050506',
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
