/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gllo: {
          purple: '#C4B5F8',
          pink: '#F0A8C8',
          peach: '#FFBDA0',
          'purple-dark': '#9B7CF8',
          'purple-light': '#EDE8FF',
          'pink-light': '#FDE8F2',
          'peach-light': '#FFF0E8',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'System'],
        mono: ['JetBrainsMono', 'Courier'],
      },
    },
  },
  plugins: [],
};
