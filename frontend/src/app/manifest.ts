import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cafe POS - Kasir & Operasional Kafe',
    short_name: 'Cafe POS',
    description: 'Aplikasi Kasir POS, KDS Dapur, Pelayan & Manajemen Kafe Profesional',
    start_url: '/pos',
    id: '/pos',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#1c1917',
    theme_color: '#ea580c',
    categories: ['business', 'food', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
