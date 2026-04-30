module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Include all files in the "app" directory
    "./components/**/*.{js,ts,jsx,tsx}", // Include your components directory if separate
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'], // Paragraph font
        heading: ['Poppins', 'sans-serif'],     // Heading font
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [
      {
        theme: {
          primary: "#3b82f6",  // BFE-style blue for primary CTAs
          secondary: "#2ecc71", // Customize secondary color
          accent: "#9b59b6",   // Accent color
          neutral: "#1F2937",  // Neutral color
          "base-100": "#ffffff", // Background color
          info: "#1abc9c",     // Info color
          success: "#00AA6E",  // Success color
          warning: "#f39c12",  // Warning color
          error: "#e74c3c",    // Error color
        },
      },
      "fantasy", // Keep the default fantasy theme as a fallback
    ],
  },
};

// #F2F2F2
