import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        flame: {
          from: "#FF7A18",
          to: "#FF3D2E",
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 122, 24, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
