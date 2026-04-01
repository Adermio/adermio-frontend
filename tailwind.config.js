/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./accueil2.html"],
  theme: {
    extend: {
      colors: {
        adermio: {
          base: '#F8FAFC',
          dark: '#0F3D39',
          primary: '#14B8A6',
          text: '#334155',
          muted: '#94A3B8',
          surface: '#FFFFFF'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 30px 60px -15px rgba(15, 61, 57, 0.15)',
        'luxury': '0 0 0 1px rgba(255,255,255,0.4) inset, 0 20px 40px -20px rgba(0,0,0,0.1)',
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    }
  },
  plugins: [],
}
