import { preset } from "@tailwindcss/preset";
/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
