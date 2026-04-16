/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx,html}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        brand: '#C0392B',
        'brand-lite': '#FADBD8',
        dark: '#1A1A2E',
        accent: '#2C3E50',
        gold: '#D4AC0D',
        surface: '#F8F9FA',
        'app-border': '#E0E0E0'
      },
      borderRadius: {
        card: '12px'
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.08)'
      },
      transitionDuration: {
        DEFAULT: '200ms'
      }
    }
  },
  plugins: []
}
