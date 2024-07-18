import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        '12teal': '#0FFFC5'
      },
      animation: {
        'loading-pulse': 'loading-pulse 1s linear infinite',
        'slide-up-1': 'slide-up 18s ease-in-out infinite both',
        'slide-up-2': 'slide-up 18s ease-in-out infinite both 3s',
        'slide-up-3': 'slide-up 18s ease-in-out infinite both 6s',
        'slide-up-4': 'slide-up 18s ease-in-out infinite both 9s',
        'slide-up-5': 'slide-up 18s ease-in-out infinite both 12s',
        'slide-up-6': 'slide-up 18s ease-in-out infinite both 15s',
      },
      keyframes: {
        'loading-pulse': {
          '0%': {transform: 'scaleX(0.5) translateX(-100%)'},
          '100%': {transform: 'scaleX(0.5) translateX(200%)'},
        },
        'slide-up': {
          '0%': {
            opacity: '0.0',
            transform: 'translateY(100%)',
          },
          '2%': {
            opacity: '1.0',
            transform: 'translateY(0%)',
          },
          '14%': {
            opacity: '1.0',
            transform: 'translateY(0%)',
          },
          '16%': {
            opacity: '0.0',
            transform: 'translateY(-100%)',
          },
          '100%': {
            opacity: '0.0',
            transform: 'translateY(-100%)',
          },
        },
      },
    },
  },
  plugins: [],
}
export default config
