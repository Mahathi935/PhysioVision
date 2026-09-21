/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PHYSIOVISION teal/cyan accent palette
        accent: {
          50:  '#f0fdfc',
          100: '#ccfbf8',
          200: '#99f5f0',
          300: '#5feae4',
          400: '#2dd4cc',
          500: '#14b8b0',   // primary accent
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        surface: {
          900: '#090f13',   // deepest background
          800: '#0f1923',   // page background
          700: '#162130',   // card background
          600: '#1e2e3e',   // elevated card
          500: '#253545',   // border / divider
          400: '#3a4f63',   // subtle element
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#475569',
        },
        status: {
          good: '#14b8b0',      // teal
          warning: '#f59e0b',   // amber
          error: '#ef4444',     // red
          pause: '#6366f1',     // indigo
          info: '#3b82f6',      // blue
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
