// tailwind.config.js - KORRIGIERT UND VOLLSTÄNDIG

// 1. Das Plugin importieren
import typography from '@tailwindcss/typography'; 

export default {
  // Stellen sicher, dass Tailwind alle deine Quelldateien scannt
  content: [
    "./src/**/*.{astro,html,js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#ffffff",
        accent: "#58FFE9", // Definiert die Akzentfarbe
      },
      // 🚨 KRITISCH: Custom shadows für den Chatbot hinzufügen (shadow-tuai)
      boxShadow: { 
        'tuai': '0 4px 12px rgba(88, 255, 233, 0.2)',
        'tuai-strong': '0 8px 25px rgba(88, 255, 233, 0.4)',
      },
    },
  },
  // 🚨 KRITISCH: Das Typography Plugin hinzufügen (für die prose-Klassen)
  plugins: [
    typography,
  ],
};