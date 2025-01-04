import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  // Make sure you require daisyui AFTER @tailwindcss/typography in tailwind.config.js
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: ["autumn", "garden", "fantasy"],
  },
} satisfies Config;
