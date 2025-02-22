import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/components/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        highlight: "#F39C12",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          layout: {},
          colors: {
            primary_plain: "#14723C",
            secondary_plain: "#3498DB",
            tertiary: "#455b6e",
            // background
            bg: "#F8F8FF",
            bg_hover: "#F3F3F3",
            card: "#FFFFFF",
            card_hover: "#E9E9E9",
            // font
            text_color: "#2C3E50",
            content_text: "#000000",
          }
        },
        dark: {
          layout: {},
          colors: {
            primary_plain: "#14723C",
            secondary_plain: "#2a6186",
            tertiary: "#2C3E50",
            // background
            bg: "#333333",
            bg_hover: "#3D3D3D",
            card: "#404040",
            card_hover: "#4A4A4A",
            // font
            text_color: "#E0E6ED",
            content_text: "#FFFFFF",
          }
        },
      }
    })
],
}
