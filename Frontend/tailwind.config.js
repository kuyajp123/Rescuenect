// tailwind.config.js
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // single component styles
    // "./node_modules/@heroui/theme/dist/components/button.js",
    "./node_modules/@heroui/theme/dist/components/**/*.js",
    // or you can use a glob pattern (multiple component styles)
    // './node_modules/@heroui/theme/dist/components/(button|snippet|code|input|modal).js'
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      
    })],
};