import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#010744',
          50:  '#e8e9f5',
          100: '#c5c7e6',
          200: '#9fa2d5',
          300: '#767bc4',
          400: '#5660b7',
          500: '#3645aa',
          600: '#2f3da0',
          700: '#263294',
          800: '#1c2889',
          900: '#010744',
        },
        yellow: {
          brand: '#f2d22e',
        },
        cream: {
          DEFAULT: '#ededd1',
          dark:   '#dede99',
        },
      },
      fontFamily: {
        sans: ['var(--font-raleway)', 'Raleway', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
