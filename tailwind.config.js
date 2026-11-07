/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        workspace: {
          canvas: '#1b1b1b',
          panel: '#252525',
          field: '#202020',
          hover: '#2d2d2d',
          border: '#3a3a3a',
          text: '#f1eff0',
          muted: '#b7b4b6',
          accent: '#ffab82',
          highlight: '#3b302c',
        },
      },
      fontFamily: {
        'heading': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        'body': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        'mono': ['Monaco', 'Consolas', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
