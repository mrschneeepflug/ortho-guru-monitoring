import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
        medical: { blue: '#4AABC8', light: '#E8F4FA', dark: '#4A5462' },
        tag: { green: '#22c55e', yellow: '#eab308', red: '#ef4444' },
      },
    },
  },
  plugins: [],
};
export default config;
