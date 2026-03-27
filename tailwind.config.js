/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}", 
    "./components/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {
        fontFamily: {
            sans: ['Tajawal', 'ui-sans-serif', 'system-ui'],
        },
        colors: {
            white:{
                0: '#FFFFFF',
                5: "#fbfbfb",
                10:'#EFF1F2',
                20:'#E0E3E4'
            },
            blue:{
              10: '#2563EB',
              20:'#0050D5'
            }
        },
        fontSize: {
            '10px': '0.625rem', 
            '12px': '0.75rem', 
            '14px': '0.875rem',
            '16px': '1rem',
            '18px': "1.125rem",
            "21px": "1.3125rem",
            '24px': '1.5rem',
            '36px': '2.25rem',
        },
    },
  },
  plugins: [],
}
