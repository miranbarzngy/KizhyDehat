import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'uni-salar': ['var(--font-uni-salar)', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--theme-card-bg)',
          foreground: 'var(--theme-foreground)',
        },
        popover: {
          DEFAULT: 'var(--theme-card-bg)',
          foreground: 'var(--theme-foreground)',
        },
        primary: {
          DEFAULT: 'var(--theme-primary)',
          foreground: 'var(--theme-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--theme-secondary)',
          foreground: 'var(--theme-foreground)',
        },
        muted: {
          DEFAULT: 'var(--theme-muted)',
          foreground: 'var(--theme-secondary)',
        },
        accent: {
          DEFAULT: 'var(--theme-accent)',
          foreground: 'var(--theme-foreground)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'var(--theme-border)',
        input: 'var(--theme-border)',
        ring: 'var(--theme-accent)',
        chart: {
          '1': 'var(--theme-chart-color)',
          '2': 'var(--theme-accent)',
          '3': 'var(--theme-primary)',
          '4': 'var(--theme-secondary)',
          '5': 'var(--theme-muted)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
