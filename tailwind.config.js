/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#38679B',
          primary: '#38679B',
          textOnDark: '#7FA6D1',
          ink: '#14181F',
          paper: '#F6F4EE',
          surface: '#FFFFFF',
          darkCard: '#222A35',
          muted: '#5D646C',
          border: '#E0DDD3',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
