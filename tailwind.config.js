/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        cozy: ['"Quicksand"', 'sans-serif'],
      },
      colors: {
        dough: '#f5e4c3',
        fruit: '#f9c5d1',
        veggie: '#cdebb0',
        header: '#FDEBD0',
        footer: '#FDEBD0',
        darkbg: '#1E1E1E',
        darkpanel: '#2D2D2D',
        primary: '#F4A261',
        highlight: '#E76F51',
        chatbg: '#FDF6EC',
        darkbubble: '#3f3f46',
      },
      borderRadius: {
        chat: '1.25rem',
      },
    },
  },
  plugins: [],
};
