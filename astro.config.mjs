// astro.config.mjs

import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
// Wichtig: Vercel-Integrationen nutzen oft den /serverless Eintrag in älteren Projekten,
// aber wir belassen es bei '@astrojs/vercel' für v9.x, wie es der Standard ist.
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react(), tailwind()],
  
  // HIER KOMMT DER STABILITÄTS-BLOCK FÜR VITE/ASTRO
  vite: {
    // 1. ASTRO/VITE SSR-Fix für Node-Pakete (ist bei dir schon korrekt)
    ssr: {
      external: ['nodemailer'],
      
      // Füge hier den Ausschluss des alten Wallet-Codes hinzu
      noExternal: ['web3', 'ethers', 'wagmi', 'viem', '@walletconnect/web3-provider']
    },
    
    // 2. WATCH-FIX: Verhindert, dass der Server externe/private Ordner überwacht und abstürzt
    watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/../**'] 
    },
    
    // 3. ABSTURZ-FIX: Schließt fehlerhafte Wallet-Bibliotheken vom Abhängigkeitsscan aus
    optimizeDeps: {
      exclude: [
        'web3',
        'ethers',
        'wagmi',
        'viem',
        '@walletconnect/web3-provider'
      ]
    }
  },
});
