/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cozy: ['"Quicksand"', 'sans-serif'], // or 'Poppins', etc.
      },
      colors: {
        dough: '#f5e4c3',
        fruit: '#f9c5d1',
        veggie: '#cdebb0',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
