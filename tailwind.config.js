/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Source-of-truth annotation colors (matches CONVENTIONS.md #37)
        'src-sch': {
          50: '#ecfdf5',
          100: '#d1fae5',
          900: '#064e3b',
          950: '#022c22',
        },
        'src-res': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          900: '#0c4a6e',
          950: '#082f49',
        },
        'src-const': {
          50: '#f8fafc',
          100: '#f1f5f9',
          900: '#0f172a',
          950: '#020617',
        },
      },
    },
  },
  plugins: [],
};
