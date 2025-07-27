import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/components/**/*.js",
  ],
  corePlugins: {
    fontSize: true,
  },
  theme: {
    extend: {
      colors: {
        highlight: "#F39C12",
        blank: "#D4D4D8",
      },
      fontSize: {
        // TEXT CONTENT:
        // xs: 0.75rem;, non important text (12px)
        // sm: 0.875rem;, small text content (14px)
        // base: "1rem", default(16px)

        // TEXT HEADER:
        // '2xl': "1.5rem", header title (24px)
        // xl: "1.25rem", header name (20px)

        // HEADLINE:
        // '6xl': "4rem", headline title (60px)
        // '4xl': "2.25rem", section title (36px)
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
            primary_plain: "#0EA5E9",
            secondary_plain: "#DA9E22",
            tertiary: "#455b6e",
            // background
            bg: "#f5f5f5",
            bg_hover: "#e4e4e4",
            card: "#FFFFFF",
            card_hover: "#e4e4e4",
            // font
            text_color: "#000000",
            content_text: "#2C3E50",
          }
        },
        dark: {
          colors: {
            primary_plain: "#2563EB",
            secondary_plain: "#DA9E22",
            tertiary: "#2C3E50",
            // background
            bg: "#171717",
            bg_hover: "#1f1f1f",
            card: "#121212",
            card_hover: "#1f1f1f",
            // font
            text_color: "#E0E6ED",
            content_text: "#F2F2F2",
          }
        },
      }
    }),
  ],
}
