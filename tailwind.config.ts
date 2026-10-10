import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          tint: "var(--primary-tint)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
          tint: "var(--secondary-tint)",
        },
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
        "border-subtle": "var(--border-subtle)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
        arabic: ["var(--font-arabic)", "Georgia", "serif"],
        malayalam: ["var(--font-malayalam)", "sans-serif"],
      },
      borderRadius: {
        card: "22px",
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(16, 36, 30, 0.08)",
        floating: "0 20px 40px -15px rgba(16, 36, 30, 0.12)",
      },
      maxWidth: {
        site: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
