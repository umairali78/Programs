/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx,html}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        brand: '#1B6B3A',
        'brand-dark': '#134d2a',
        'brand-light': '#D6EFE0',
        accent: '#2D6A4F',
        earth: '#6B4226',
        sky: '#1E90FF',
        sand: '#F5F0E8',
        surface: '#F8FAFB',
        'app-border': '#E2E8F0',
        wetlands: '#2196F3',
        agriculture: '#8BC34A',
        'urban-ecology': '#9C27B0',
        'climate-justice': '#F44336',
        'indigenous-knowledge': '#FF9800'
      },
      borderRadius: {
        card: '12px'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
