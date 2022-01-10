const colors = require('tailwindcss/colors')

module.exports = {
  content: ['public/index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.orange,
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
