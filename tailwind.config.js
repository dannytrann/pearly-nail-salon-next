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
        primary: '#A0CE4E',        // Sage green
        'primary-dark': '#8BB842',
        'primary-light': '#B8DC6E',
        secondary: '#DCBAA1',      // Warm beige/tan
        'secondary-dark': '#C9A78E',
        accent: '#A0CE4E',
        neutral: {
          850: '#333333',
          750: '#494949',
        }
      },
      fontFamily: {
        heading: ['Cormorant Garamond', 'serif'],
        body: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
