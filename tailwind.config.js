/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", 
    "./pages/**/*.{ts,tsx}",    // Pages Router
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        fontFamily: {
        },
        colors: {
        },
        fontSize: {
            '10px': '0.625rem', //10px
            '12px': '0.75rem', //12px
            '14px': '0.875rem', //14px
            '16px': '1rem', // 16px
            '18px': "1.125rem", //18px
            "21px": "1.3125rem", //21px
            '24px': '1.5rem', // 24px
            '36px': '2.25rem', //36px
        },
    },
  },
  plugins: [],
}
