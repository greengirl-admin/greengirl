/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html'
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': {
          light: '#A8C3A9',
          DEFAULT: '#6B8F71',
          dark: '#4A6C55',
        },
        'brand-pink': {
          light: '#F8DEDD',
          DEFAULT: '#E6B6B4',
          dark: '#D19A98',
        },
        'brand-dark': '#333333',
        'brand-light': '#F9F9F9',
        'brand-gray': '#E5E7EB',
      },
      fontFamily: {
        sans: ['"Poppins"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};