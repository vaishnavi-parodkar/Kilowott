/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f3f0ff', 100: '#e7e0ff', 200: '#d0c2ff', 500: '#7f54b3', 600: '#6d44a0', 700: '#5b3787',
        },
      },
    },
  },
  plugins: [],
};
