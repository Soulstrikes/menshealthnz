/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js,ts}"],
  theme: {
    extend: {
      colors: {
        'honolulu-blue': '#007EC3',
        'steel-blue': '#447BB0',
        'alice-blue': '#E6F4FA',
        'white-smoke': '#F2F2F2',
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
