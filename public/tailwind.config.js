/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/components/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'main-bg': 'url("data:image/png;base64,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")',
      },
      backgroundImage: {
        'circle-shape': 'url("data:image/png;base64,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")',
      },
      backgroundImage: {
        'circle-shape': 'url("data:image/png;base64,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")',
      },
      keyframes: {
        floating: {
          '0%': { transform: 'translateY(0%) rotate(-55deg)' },
          '50%': { transform: 'translateY(300%) rotate(55deg)' },
          '100%': { transform: 'translateY(0%) rotate(-55deg)' },
        },
      },
      animation: {
        floating: 'floating 5s infinite',
      },
    },
  },
    variants: {},
    plugins: [],
}