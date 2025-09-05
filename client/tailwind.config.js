/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'card', 'card-ghost',
    'btn', 'btn-primary',
    'badge',
    'table-wrap', 'wrap-anywhere',
    'chip', 'topword-chip',
    'header-grad',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'yt-head': 'linear-gradient(135deg, #ef4444 0%, #0f172a 100%)',
        'cta': 'linear-gradient(135deg, #ef4444 0%, #7c3aed 100%)',
      },
    },
  },
  plugins: [],
}
