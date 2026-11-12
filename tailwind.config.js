/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4FA',
          100: '#D9E2F1',
          200: '#B3C6E3',
          300: '#8DA9D5',
          400: '#5C84C3',
          500: '#2F5EB1',
          600: '#1D376B',
          700: '#162C56',
          800: '#0F2247',
          900: '#09152F',
        },
        gold: {
          50: '#FDFBF7',
          100: '#F9F2E3',
          200: '#F2E2C0',
          300: '#E7C46A',
          400: '#D4AF37',
          500: '#C89B3C',
          600: '#A97823',
          700: '#8B611B',
          800: '#6C4A13',
          900: '#4D340C',
        },
        slate: {
          50: '#F8F7F3', // App Background
          100: '#F3F5F8', // Secondary Background
          200: '#ECECEC', // Card Border
          300: '#E5E8EF', // Light Border
          400: '#8A919F', // Light Text
          500: '#5E6472', // Secondary Text
          600: '#1D376B', // Secondary Navy
          700: '#1D376B',
          800: '#0F2247', // Primary Navy
          900: '#09152F', // Dark Navy
        },
        orange: {
          50: '#FDFBF7',
          100: '#F9F2E3',
          200: '#F2E2C0',
          300: '#E7C46A', // Luxury Gold
          400: '#E7C46A', // Luxury Gold
          500: '#C89B3C', // Premium Gold (Buttons, primary)
          600: '#A97823', // Deep Gold
          700: '#A97823', // Deep Gold
          800: '#8B611B',
          900: '#6C4A13',
        },
        blue: {
          50: '#F3F5F8',
          100: '#E5E8EF',
          400: '#1D376B',
          500: '#0F2247', // Map primary blues to Navy
          600: '#09152F',
        },
        primary: {
          navy: '#0F2247',
          gold: '#C89B3C'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
