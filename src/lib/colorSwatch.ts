const NAMED_SWATCHES: Record<string, string> = {
  black: '#1c1c1c',
  white: '#ffffff',
  ivory: '#fffff0',
  cream: '#f5edd8',
  beige: '#e8dcc8',
  tan: '#d2b48c',
  brown: '#6b4226',
  chocolate: '#3d2314',
  navy: '#1b2a4a',
  blue: '#3a5fa8',
  'sky blue': '#87ceeb',
  teal: '#006d5b',
  green: '#3a6b35',
  olive: '#6b6b3a',
  sage: '#9caf88',
  red: '#a83a3a',
  maroon: '#5c1a1a',
  burgundy: '#5c1a2e',
  wine: '#5c1a2e',
  pink: '#e8a5b0',
  rose: '#dca1a1',
  'dusty rose': '#dca1a1',
  blush: '#f3d4d4',
  purple: '#6b4a8a',
  lavender: '#c9a8e0',
  yellow: '#e8d15a',
  mustard: '#c9a227',
  orange: '#d97b3a',
  rust: '#a8542e',
  gray: '#8a8a8a',
  grey: '#8a8a8a',
  charcoal: '#3a3a3a',
  heather: '#a3a3ac',
  silver: '#c0c0c0',
  gold: '#c9a227',
  khaki: '#c3b091',
  denim: '#4a6a8a',
};

function hashHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
}

// Resolves a variant's display name (e.g. "Dusty Rose", "Black") to a swatch
// color. Known apparel color words are matched first; anything else falls
// back to a stable hash-derived hue so unrecognized names still get a
// consistent, distinct color rather than a generic gray.
export function colorForName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (NAMED_SWATCHES[normalized]) return NAMED_SWATCHES[normalized];

  for (const [key, hex] of Object.entries(NAMED_SWATCHES)) {
    if (normalized.includes(key)) return hex;
  }

  const hue = hashHue(normalized || 'default');
  return `hsl(${hue}, 45%, 55%)`;
}
