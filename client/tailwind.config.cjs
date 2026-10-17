module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#162537', muted: '#66758a', line: '#e4e9ef',
        paper: '#f6f8fb', brand: '#1c4963', accent: '#dcebf0'
      },
      fontFamily: { sans: ['Inter', 'Noto Sans Gujarati', 'system-ui', 'sans-serif'] },
      boxShadow: { soft: '0 2px 16px rgba(22,37,55,.055)' },
    },
  },
  plugins: [],
};
