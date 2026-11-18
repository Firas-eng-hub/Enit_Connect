/** @type {import('tailwindcss').Config} */

// ENIT Connect design tokens.
// Brand: navy "ink" and gold marker sampled from the ENIT logo.
// Semantic tokens (ink, body, muted, line, canvas, surface, gold) are backed by
// CSS variables in src/index.css so they stay the single source of truth.

const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

// Cool neutral scale shared by gray / neutral / slate / zinc / stone.
const neutral = {
  50: '#F5F7F9',
  100: '#EDF0F3',
  200: '#DCE1E7',
  300: '#C3CAD3',
  400: '#8D97A5',
  500: '#6A7686',
  600: '#4F5B6B',
  700: '#3D4B5C',
  800: '#26354A',
  900: '#182638',
  950: '#0F1A28',
};

// Navy scale anchored on the logo navy (900).
const primary = {
  50: '#EEF2F7',
  100: '#DAE3EE',
  200: '#B7C7DA',
  300: '#8DA5C2',
  400: '#5F7FA3',
  500: '#3E6189',
  600: '#2A4C73',
  700: '#1F3F63',
  800: '#193655',
  900: '#14304D',
  950: '#0D2136',
};

const gold = {
  50: '#FBF6EA',
  100: '#F5E9C9',
  200: '#EBD397',
  300: '#DFBA66',
  400: '#D4A84B',
  500: '#C99A3B',
  600: '#A87E2A',
  700: '#876421',
  800: '#6A4F1D',
  900: '#57411B',
  950: '#30230D',
};

const success = {
  50: '#EEF8F2',
  100: '#D5EEDF',
  200: '#ABDCBF',
  300: '#78C39A',
  400: '#46A673',
  500: '#2A8C5B',
  600: '#1E7B4F',
  700: '#196541',
  800: '#165136',
  900: '#12422D',
  950: '#0A2619',
};

const warning = {
  50: '#FDF6EC',
  100: '#FAE8C9',
  200: '#F3CF8F',
  300: '#E9B15A',
  400: '#D99331',
  500: '#BF7716',
  600: '#9A5B06',
  700: '#7C4908',
  800: '#653B0C',
  900: '#53310E',
  950: '#2F1A05',
};

const danger = {
  50: '#FDF2F1',
  100: '#FBE1DE',
  200: '#F6C3BD',
  300: '#EE9990',
  400: '#E26759',
  500: '#D0402F',
  600: '#B42318',
  700: '#941D16',
  800: '#7A1B17',
  900: '#651B18',
  950: '#370A08',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens
        ink: v('ink'),
        body: v('body'),
        line: v('line'),
        canvas: v('canvas'),
        surface: {
          DEFAULT: v('surface'),
          elevated: v('surface'),
          muted: v('canvas'),
        },
        gold: { DEFAULT: v('gold'), ...gold },
        background: v('canvas'),
        foreground: v('ink'),
        muted: {
          DEFAULT: neutral[100],
          foreground: v('muted'),
        },
        border: {
          DEFAULT: v('line'),
          muted: neutral[100],
        },

        // Scales
        primary: { DEFAULT: primary[900], foreground: '#ffffff', ...primary },
        accent: { DEFAULT: gold[500], foreground: primary[950], ...gold },
        brand: { navy: primary, gold },
        neutral,
        success: { DEFAULT: success[600], foreground: '#ffffff', ...success },
        warning: { DEFAULT: warning[600], foreground: '#ffffff', ...warning },
        danger: { DEFAULT: danger[600], foreground: '#ffffff', ...danger },
        info: { DEFAULT: primary[700], foreground: '#ffffff', ...primary },

        // Legacy Tailwind hues still used by unconverted pages are folded into
        // the brand system so nothing renders off-palette.
        gray: neutral,
        slate: neutral,
        zinc: neutral,
        stone: neutral,
        blue: primary,
        indigo: primary,
        violet: primary,
        purple: primary,
        sky: primary,
        cyan: primary,
        green: success,
        emerald: success,
        teal: success,
        lime: success,
        amber: warning,
        orange: warning,
        yellow: warning,
        red: danger,
        rose: danger,
        pink: danger,
        fuchsia: primary,
      },
      fontFamily: {
        sans: [
          '"IBM Plex Sans"',
          '"IBM Plex Sans Arabic"',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // 1.25 modular scale
        xs: ['0.75rem', { lineHeight: '1rem' }], // 12
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14
        base: ['1rem', { lineHeight: '1.5rem' }], // 16
        lg: ['1.125rem', { lineHeight: '1.625rem' }], // 18
        xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20
        '2xl': ['1.5625rem', { lineHeight: '1.25' }], // 25
        '3xl': ['1.9375rem', { lineHeight: '1.2' }], // 31
        '4xl': ['2.4375rem', { lineHeight: '1.15' }], // 39
        '5xl': ['2.4375rem', { lineHeight: '1.15' }], // capped
        '6xl': ['2.4375rem', { lineHeight: '1.15' }], // capped
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      maxWidth: {
        prose: '70ch',
      },
      borderRadius: {
        // 6px controls, 8px panels. Larger radii are normalised down.
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '6px',
        xl: '8px',
        '2xl': '8px',
        '3xl': '8px',
      },
      boxShadow: {
        // Panels are border-only; shadows are for overlays.
        overlay: '0 8px 24px -6px rgb(15 26 40 / 0.18), 0 2px 6px -2px rgb(15 26 40 / 0.08)',
        dropdown: '0 8px 24px -6px rgb(15 26 40 / 0.18), 0 2px 6px -2px rgb(15 26 40 / 0.08)',
        soft: 'none',
        card: 'none',
        elevated: 'none',
        md: 'none',
        lg: '0 8px 24px -6px rgb(15 26 40 / 0.18), 0 2px 6px -2px rgb(15 26 40 / 0.08)',
        xl: '0 8px 24px -6px rgb(15 26 40 / 0.18), 0 2px 6px -2px rgb(15 26 40 / 0.08)',
        '2xl': '0 12px 32px -8px rgb(15 26 40 / 0.22)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      animation: {
        'fade-in': 'fadeIn 120ms ease-out',
        // Legacy names kept as a plain fade so nothing slides or scales.
        'slide-in': 'fadeIn 120ms ease-out',
        'slide-up': 'fadeIn 120ms ease-out',
        'scale-in': 'fadeIn 120ms ease-out',
        shimmer: 'none',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
