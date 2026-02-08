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
        primary: '#926B6B',
        'primary-dark': '#7A5555',
        'primary-light': '#B08D8D',
        secondary: '#C4A77D',
        'secondary-dark': '#A8894D',
        accent: '#C4A77D',
        cream: {
          DEFAULT: '#FAF7F4',
          deep: '#F0EAE3',
        },
        mist: '#E5DFD9',
        neutral: {
          850: '#2A2220',
          750: '#5C4F4A',
        },
        warmgray: {
          light: '#8A7E79',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['Montserrat', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
