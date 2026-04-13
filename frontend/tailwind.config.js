/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#c9a84c',
          light:   '#e8d5a3',
          dark:    '#a07830',
        },
        navy: {
          DEFAULT: '#0f172a',
          mid:     '#1e293b',
          light:   '#334155',
        },
        cream: '#fdf8f2',
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      keyframes: {
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.03)' },
        },
        pop: {
          '0%':   { transform: 'scale(0)' },
          '70%':  { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
      },
      animation: {
        float:        'float 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 4s ease-in-out infinite',
        pop:          'pop 0.2s ease forwards',
        'slide-in':   'slide-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
