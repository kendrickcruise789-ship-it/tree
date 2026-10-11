/**
 * Fail-safe image cascade for Clotex.
 * Guarantees that product photos, hero banners, and craft images
 * NEVER disappear, whether in production build, local dev, offline,
 * or deployed with custom base paths.
 */

// Category-specific high-resolution beige luxury photography fallbacks
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Dresses:
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80',
  'Co-ords':
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
  'Kurtas & Tunics':
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
  Kaftans:
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80',
  Bedsheets:
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
  Home:
    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80',
  Gifts:
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80',
  Sale:
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
  Hero:
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1600&q=85',
  Craft:
    'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=1200&q=80',
};

// Generates an inline SVG Data URI that requires zero network requests and looks exquisite
export function getBeigePlaceholderSvg(label: string = 'CLOTEX'): string {
  const safeLabel = label.replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none">
    <rect width="600" height="800" fill="#F4EFEA"/>
    <rect x="24" y="24" width="552" height="752" stroke="#E5DDD0" stroke-width="1.5" stroke-dasharray="4 4"/>
    <circle cx="300" cy="360" r="120" fill="#EFE8DD" opacity="0.8"/>
    <!-- Artisanal Botanical Woodblock Motif -->
    <path d="M300 280 C320 320 360 340 360 360 C360 380 340 400 300 400 C260 400 240 380 240 360 C240 340 280 320 300 280 Z" fill="#879883" opacity="0.6"/>
    <path d="M300 300 C310 330 330 345 330 360 C330 375 320 385 300 385 C280 385 270 375 270 360 C270 345 290 330 300 300 Z" fill="#C6934B" opacity="0.7"/>
    <circle cx="300" cy="360" r="14" fill="#A8523C"/>
    <!-- Brand Typography -->
    <text x="300" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="6" fill="#1E1B18" font-weight="500">CLOTEX</text>
    <text x="300" y="500" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" letter-spacing="3" fill="#7A6B5D" font-weight="600" text-transform="uppercase">${safeLabel}</text>
    <text x="300" y="525" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#A89C8F">JAIPUR ARTISANAL ATELIER</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
