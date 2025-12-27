/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // This tells Tailwind to ONLY look inside the src folder for component files
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#111827', // Deep charcoal/black
        'ui-border': '#374151',
        'text-light': '#D1D5DB',
        'text-heavy': '#F9FAFB', // Nearly white
        'tech-primary': '#F59E0B', // Bold Gold/Amber
        'tech-secondary': '#3B82F6', // Vibrant Blue
        'ui-success': '#10B981',
        'ui-error': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card-lift': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'button-hover': '0 6px 10px rgba(0, 119, 182, 0.4)',
      }
    },
  },
  plugins: [],
}