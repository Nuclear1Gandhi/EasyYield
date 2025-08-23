/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{svelte,ts,js}',
    './node_modules/flowbite-svelte/**/*.{svelte,js,ts}',
    './node_modules/flowbite/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // Subtle Y2K-trance palette
        'neutral-base': '#F7F7F9',
        'neutral-sec': '#E2E4E8',
        'accent-peach': '#FFD8CC',
        'accent-cyan': '#CCF0FF',
        'glow-mint': '#A8E6CF',
        // Risk badges
        'risk-conservative': '#E2E4E8',
        'risk-balanced': '#CCF0FF',
        'risk-aggressive': '#FFD8CC',
      },
    },
  },
  plugins: [require('flowbite/plugin')],
};
