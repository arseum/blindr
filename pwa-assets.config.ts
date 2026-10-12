import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Icônes PWA générées depuis public/icon.svg (carré plein, jeton centré dans la zone sûre).
// Régénérer : npm run icons
const brandGreen = '#1d7a4c';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: brandGreen } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: brandGreen } },
  },
  images: ['public/icon.svg'],
});
