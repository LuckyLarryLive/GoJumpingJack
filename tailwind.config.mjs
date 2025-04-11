// tailwind.config.mjs
import forms from '@tailwindcss/forms';
import defaultTheme from 'tailwindcss/defaultTheme'; // Import defaultTheme

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Set Geist Sans as the primary sans-serif font
        // Accessible via `font-sans` class
        sans: ['var(--font-geist-sans)', ...defaultTheme.fontFamily.sans],

        // Set Playfair Display as the primary serif font
        // Accessible via `font-serif` class
        serif: ['var(--font-playfair)', ...defaultTheme.fontFamily.serif],

        // Set Geist Mono as the primary monospace font
        // Accessible via `font-mono` class
        mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],

        // Keep Lobster for special display purposes
        // Accessible via `font-display` class
        display: ['var(--font-lobster)', 'cursive'], // Added 'cursive' fallback
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // Add other theme extensions here if needed
    },
  },
  plugins: [forms],
};