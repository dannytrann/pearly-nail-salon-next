/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#194D80',        // Rich blue
        'primary-dark': '#143D66',
        'primary-light': '#2666A6',
        secondary: '#194D80',      // Rich blue
        'secondary-dark': '#143D66',
        accent: '#194D80',
        neutral: {
          850: '#1a1a1a',          // Darker for better contrast
          750: '#333333',
        }
      },
      fontFamily: {
        heading: ['Gilda Display', 'serif'],
        body: ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
