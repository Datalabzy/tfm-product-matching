import type { Config } from "tailwindcss";

export default {
  // Tailwind v4 pulls theme tokens from CSS (@theme in app/globals.css).
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
