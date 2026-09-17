/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gllo: {
          accent:      '#4F46E5',
          'accent-dark': '#818CF8',
          bg:          '#F8FAFC',
          'bg-dark':   '#0B1120',
          surface:     '#FFFFFF',
          'surface-dark': '#151B2C',
          border:      '#E2E8F0',
          'border-dark': '#263042',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'System'],
        display: ['SUIT', 'System'],
      },
    },
  },
  plugins: [],
};
