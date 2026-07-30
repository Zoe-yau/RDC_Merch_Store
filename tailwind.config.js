/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rho Delta Chi Brand Colors
        'rho-rose': '#DCA1A1',      // Soft Dusty Rose
        'rho-teal': '#006D5B',      // Rich Teal Green

        // Brandy Melville Vibe Neutrals
        'bm-bg': '#FBF9F6',        // Warm Linen Off-White background
        'bm-card': '#FFFFFF',      // Pure White cards
        'bm-text': '#1C1C1C',      // Soft Charcoal black text
        'bm-muted': '#757575',     // Subtle subtexts
        'bm-border': '#EAE7E1',    // Crisp light borders
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
