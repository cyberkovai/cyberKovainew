/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ck-bg': '#050511',
        'ck-bg-secondary': '#09091b',
        'ck-card': '#0d0d23',
        'ck-card-light': '#11112d',
        'ck-purple': '#8b20ff',
        'ck-purple-light': '#b84dff',
        'ck-purple-dark': '#5512a8',
        'ck-violet': '#7b2ff7',
        'ck-orchid': '#c84bff',
        'ck-mist': '#e9dcff',
        'ck-cyan': '#00f0ff',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        sora: ['Sora', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

