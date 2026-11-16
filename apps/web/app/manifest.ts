import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrewLite', short_name: 'BrewLite', lang: 'vi',
    description: 'Đặt và thanh toán đồ uống BrewLite',
    start_url: '/', scope: '/', display: 'standalone',
    background_color: '#faf7f2', theme_color: '#60412b',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
