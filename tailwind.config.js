/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dceffd',
          200: '#b1dffb',
          300: '#7dc6f8',
          400: '#42a8f0',
          500: '#1a88dc',
          600: '#0e6cba',
          700: '#0d5897',
          800: '#10497c',
          900: '#143e67',
          950: '#0d2843'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
