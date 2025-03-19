/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        secondary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        warning: {
          50: "#fff8e1",
          100: "#ffecb3",
          200: "#ffe082",
          300: "#ffd54f",
          400: "#ffca28",
          500: "#ffc107",
          600: "#ffb300",
          700: "#ffa000",
          800: "#ff8f00",
          900: "#ff6f00",
          950: "#e56000",
        },
        error: {
          50: "#ffebee",
          100: "#ffcdd2",
          200: "#ef9a9a",
          300: "#e57373",
          400: "#ef5350",
          500: "#f44336",
          600: "#e53935",
          700: "#d32f2f",
          800: "#c62828",
          900: "#b71c1c",
          950: "#7f0000",
        },
      },
      fontFamily: {
        sans: [
          "Lexend",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        mono: [
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      spacing: {
        "72": "18rem",
        "84": "21rem",
        "96": "24rem",
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'dark': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
        'dark-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'dark-card': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'none': 'none',
        // Premium shadows with subtle green tint
        'premium-card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 4px 20px -2px rgba(5, 150, 105, 0.05)',
      },
      backgroundImage: {
        // Subtle grain texture - very light for default use
        'texture-grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        'texture-grain-dark': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        'full': '9999px',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme("colors.surface.800"),
            a: {
              color: theme("colors.primary.600"),
              "&:hover": {
                color: theme("colors.primary.800"),
              },
            },
            h1: {
              color: theme("colors.surface.900"),
              fontFamily: theme("fontFamily.sans").join(", "),
            },
            h2: {
              color: theme("colors.surface.900"),
              fontFamily: theme("fontFamily.sans").join(", "),
            },
            h3: {
              color: theme("colors.surface.900"),
              fontFamily: theme("fontFamily.sans").join(", "),
            },
            h4: {
              color: theme("colors.surface.900"),
              fontFamily: theme("fontFamily.sans").join(", "),
            },
            code: {
              color: theme("colors.surface.700"),
              backgroundColor: theme("colors.surface.100"),
              padding: "0.2em 0.4em",
              borderRadius: "0.25rem",
            },
            "code::before": {
              content: "none",
            },
            "code::after": {
              content: "none",
            },
          },
        },
        dark: {
          css: {
            color: theme("colors.surface.300"),
            a: {
              color: theme("colors.primary.400"),
              "&:hover": {
                color: theme("colors.primary.300"),
              },
            },
            h1: {
              color: theme("colors.surface.100"),
            },
            h2: {
              color: theme("colors.surface.100"),
            },
            h3: {
              color: theme("colors.surface.100"),
            },
            h4: {
              color: theme("colors.surface.100"),
            },
            code: {
              color: theme("colors.surface.300"),
              backgroundColor: theme("colors.surface.800"),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    function({ addBase, addComponents, addUtilities }) {
      // Add base styles for common elements
      addBase({
        'body': {
          '@apply bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 bg-texture-grain dark:bg-texture-grain-dark': {},
        },
        '.card': {
          '@apply bg-white dark:bg-surface-800 rounded-lg shadow-card dark:shadow-dark-card p-6 bg-texture-grain dark:bg-texture-grain-dark': {},
        },
        '.section-premium': {
          '@apply bg-primary-50 dark:bg-surface-900 bg-texture-grain dark:bg-texture-grain-dark py-12': {},
        }
      });
      
      // Add component classes
      addComponents({
        '.btn-premium': {
          '@apply px-6 py-3 bg-primary-600 text-white rounded-md shadow-premium-card hover:bg-primary-700 transition-all duration-200': {},
        },
        '.input-premium': {
          '@apply rounded-md border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:focus:ring-primary-400': {},
        },
      });
      
      // Add utility classes
      addUtilities({
        '.premium-card': {
          '@apply bg-white dark:bg-surface-800 rounded-lg shadow-premium-card p-6 bg-texture-grain dark:bg-texture-grain-dark': {},
        },
        '.premium-text': {
          '@apply text-primary-700 dark:text-primary-300 font-medium': {},
        },
      });
    }
  ],
  variants: {
    extend: {
      typography: ['dark'],
    },
  },
};