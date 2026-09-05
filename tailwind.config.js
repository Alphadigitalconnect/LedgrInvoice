/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mint / Seafoam accent family (from logo)
        mint: {
          50: '#f0faf6',
          100: '#dbf4ec',
          200: '#bae8db',
          300: '#8fd1be', // Exact logo accent color
          400: '#64b9a3',
          500: '#409c86',
          600: '#307d6d',
          700: '#286458',
          800: '#235047',
          900: '#1e433b',
          950: '#0e2621',
        },
        // Forest Slate / Pine background & dark container family (from logo)
        pine: {
          50: '#f3f7f5',
          100: '#e3ece8',
          200: '#c7d9d2',
          300: '#9fbeae',
          400: '#729d91',
          500: '#527f74',
          600: '#3f655c',
          700: '#34524b',
          800: '#2b423d',
          900: '#243834', // Exact logo background dark slate
          950: '#14221f', // Darkest sidebar & canvas
        },
        // Re-route brand to the mint/pine palette for consistency
        brand: {
          50: '#f0faf6',
          100: '#dbf4ec',
          200: '#bae8db',
          300: '#8fd1be',
          400: '#64b9a3',
          500: '#3a937d',
          600: '#2a7564',
          700: '#245f51',
          800: '#1e4b41',
          900: '#243834',
          950: '#14221f',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Poppins', 'sans-serif'],
        mono: ['Poppins', 'monospace'],
      }
    },
  },
  plugins: [],
}
