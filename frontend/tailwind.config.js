export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        /* ── Warm Academic Palette ── */
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        surface: {
          50:  '#fafaf8',  // warm off-white page bg
          100: '#fefdfb',  // warm card surface
          200: '#f5f5f0',  // warm muted bg
        },
      },
      boxShadow: {
        '2xs': '0 1px 1px 0 rgba(0, 0, 0, 0.03)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 2px rgba(28,25,23,0.06), 0 1px 3px rgba(28,25,23,0.1)',
        float: '0 12px 32px -12px rgba(109,40,217,0.30)',
        bento: '0 4px 20px -2px rgba(28, 25, 23, 0.05), 0 2px 6px -1px rgba(28, 25, 23, 0.03)',
        'bento-hover': '0 12px 30px -4px rgba(124, 58, 237, 0.12), 0 4px 10px -2px rgba(28, 25, 23, 0.04)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
