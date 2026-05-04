/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false, // keep existing CSS resets intact
  },
  theme: {
    extend: {},
  },
  plugins: [],
}

