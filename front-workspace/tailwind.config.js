/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Attijari Bank Colors
        'attijari-dark': '#003366',
        'attijari-red': '#C8102E',
        'attijari-gold': '#F5A623',
        'attijari-bg': '#f4f7fa',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 30px rgba(0, 51, 102, 0.1)',
        'header': '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
