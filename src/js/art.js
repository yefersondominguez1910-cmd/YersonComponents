import { escapeHtml } from '@/js/utils.js';

const BRANDS = {
  NVIDIA: { color: '#76B900', mark: 'GeForce' },
  Intel: { color: '#38BDF8', mark: 'intel CORE' },
  AMD: { color: '#EF4444', mark: 'RYZEN' },
  'ASUS ROG': { color: '#A78BFA', mark: 'ROG' },
  MSI: { color: '#F97316', mark: 'MSI' },
  Corsair: { color: '#FACC15', mark: 'CORSAIR' },
};

const DEFAULT_BRAND = { color: '#06B6D4', mark: '' };
const SURFACE = '#15102A';

const text = (x, y, anchor, value, fill, size) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="Orbitron, Inter, sans-serif" font-size="${size}" font-weight="700">${escapeHtml(value)}</text>`;

const fan = (cx, cy, r, color) => {
  const blades = [0, 72, 144, 216, 288]
    .map(
      (angle) =>
        `<ellipse cx="${cx}" cy="${cy - r * 0.5}" rx="${r * 0.22}" ry="${r * 0.42}" transform="rotate(${angle} ${cx} ${cy})"/>`,
    )
    .join('');
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#0E0A1C" stroke="${color}" stroke-width="2"/><g fill="${color}" fill-opacity=".5">${blades}</g><circle cx="${cx}" cy="${cy}" r="${r * 0.18}" fill="${color}"/></g>`;
};

const SHAPES = {
  gpu: ({ color, mark }) => `
    <rect x="22" y="58" width="276" height="108" rx="16" fill="${SURFACE}" stroke="${color}" stroke-width="2"/>
    ${fan(96, 110, 34, color)}${fan(224, 110, 34, color)}
    <rect x="22" y="150" width="276" height="16" rx="6" fill="${color}" fill-opacity=".85"/>
    ${text(160, 163, 'middle', mark, '#0B0714', 10)}`,

  cpu: ({ color, mark }, { chip }) => {
    const pins = [];
    for (let k = 0; k < 8; k += 1) {
      const x = 104 + k * 14;
      const y = 64 + k * 12;
      pins.push(
        `<line x1="${x}" y1="30" x2="${x}" y2="50"/><line x1="${x}" y1="170" x2="${x}" y2="190"/><line x1="60" y1="${y}" x2="90" y2="${y}"/><line x1="230" y1="${y}" x2="260" y2="${y}"/>`,
      );
    }
    return `
    <g stroke="${color}" stroke-width="3" stroke-linecap="round" opacity=".8">${pins.join('')}</g>
    <rect x="90" y="50" width="140" height="120" rx="14" fill="${SURFACE}" stroke="${color}" stroke-width="2"/>
    <rect x="110" y="70" width="100" height="80" rx="10" fill="${color}" fill-opacity=".14" stroke="${color}"/>
    ${text(160, 103, 'middle', mark, '#F5F3FF', 13)}
    ${text(160, 124, 'middle', chip, color, 9)}`;
  },

  ram: ({ color, mark }, { chip }) => {
    const modules = [];
    const contacts = [];
    for (let k = 0; k < 8; k += 1) {
      modules.push(
        `<rect x="${70 + k * 26}" y="92" width="20" height="36" rx="3" fill="${color}" fill-opacity=".25" stroke="${color}"/>`,
      );
      contacts.push(`<rect x="${58 + k * 13}" y="156" width="8" height="12" rx="1" fill="#D4AF37"/>`);
    }
    return `
    <rect x="46" y="74" width="228" height="78" rx="8" fill="${SURFACE}" stroke="${color}" stroke-width="2"/>
    ${modules.join('')}
    ${contacts.join('')}
    ${text(58, 66, 'start', mark, color, 12)}
    ${text(262, 66, 'end', chip, '#F5F3FF', 10)}`;
  },

  pc: ({ color, mark }) => `
    <rect x="104" y="26" width="112" height="176" rx="14" fill="${SURFACE}" stroke="${color}" stroke-width="2"/>
    <rect x="116" y="46" width="88" height="100" rx="8" fill="${color}" fill-opacity=".12" stroke="${color}" stroke-opacity=".6"/>
    ${fan(160, 96, 26, color)}
    <rect x="116" y="182" width="88" height="5" rx="2" fill="${color}"/>
    ${text(160, 166, 'middle', mark, color, 12)}`,

  laptop: ({ color, mark }, { chip }) => `
    <rect x="60" y="34" width="200" height="124" rx="10" fill="${SURFACE}" stroke="${color}" stroke-width="2"/>
    <rect x="72" y="46" width="176" height="100" rx="6" fill="${color}" fill-opacity=".12"/>
    ${text(160, 98, 'middle', mark, color, 18)}
    ${text(160, 122, 'middle', chip, '#F5F3FF', 9)}
    <path d="M30 166 H290 L304 184 H16 Z" fill="#1E1736" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="136" y="170" width="48" height="4" rx="2" fill="${color}"/>`,

  keyboard: ({ color, mark }) => {
    const keys = [];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 11; col += 1) {
        keys.push(
          `<rect x="${46 + col * 20}" y="${86 + row * 24}" width="16" height="16" rx="4" fill="${color}" fill-opacity=".3"/>`,
        );
      }
    }
    return `
    ${text(160, 60, 'middle', mark, color, 14)}
    <rect x="30" y="70" width="260" height="110" rx="14" fill="${SURFACE}" stroke="${color}" stroke-width="2"/>
    ${keys.join('')}`;
  },

  monitor: ({ color, mark }) => `
    <rect x="40" y="26" width="240" height="138" rx="10" fill="${SURFACE}" stroke="${color}" stroke-width="2"/>
    <rect x="52" y="38" width="216" height="114" rx="6" fill="${color}" fill-opacity=".12"/>
    <path d="M52 130 Q120 90 160 112 T268 96 V152 H52 Z" fill="${color}" fill-opacity=".35"/>
    ${text(160, 66, 'middle', mark, color, 13)}
    <rect x="148" y="164" width="24" height="22" fill="#1E1736"/>
    <rect x="110" y="186" width="100" height="8" rx="4" fill="#1E1736" stroke="${color}"/>`,
};

export function productArt(product) {
  const brand = BRANDS[product.brand] ?? { ...DEFAULT_BRAND, mark: product.brand };
  const shape = SHAPES[product.art] ?? SHAPES.gpu;
  const gradientId = `glow-${product.id}`;
  return `<svg class="product-art" viewBox="0 0 320 220" role="img" aria-label="Ilustración de ${escapeHtml(product.name)}" focusable="false">
    <defs>
      <radialGradient id="${gradientId}" cx="50%" cy="45%" r="60%">
        <stop offset="0" stop-color="${brand.color}" stop-opacity=".35"/>
        <stop offset="1" stop-color="${brand.color}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="320" height="220" fill="url(#${gradientId})"/>
    ${shape(brand, product)}
  </svg>`;
}
