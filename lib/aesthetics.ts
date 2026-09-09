export const AESTHETICS = [
  { id: 'original', name: 'Original', description: 'Fresh greens and a clean, quiet workspace.' },
  {
    id: 'retro',
    name: 'Retro OS',
    description: 'Teal desktop, silver panels, and classic bevels.',
  },
  { id: 'swiss', name: 'Swiss', description: 'Bold type, sharp rules, and orange accents.' },
  {
    id: 'vintage',
    name: 'Warm Vintage',
    description: 'Soft beige, cocoa brown, and serif headings.',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Ink blue, precise lines, and a technical feel.',
  },
  { id: 'nord', name: 'Nord', description: 'Cool slate, muted blues, and spacious panels.' },
  { id: 'paper', name: 'Paper', description: 'An ivory notebook with serif type and fine rules.' },
  { id: 'lavender', name: 'Lavender', description: 'Soft lilac, plum accents, and rounded cards.' },
] as const;

export type Aesthetic = (typeof AESTHETICS)[number]['id'];
export const AESTHETIC_KEY = 'jobtrack-aesthetic';
export function parseAesthetic(value: unknown): Aesthetic {
  return AESTHETICS.find((item) => item.id === value)?.id ?? 'original';
}

// Static allowlisted values only; apply before paint to avoid flashing the default design.
export const aestheticBootstrap = `(()=>{try{const v=localStorage.getItem(${JSON.stringify(AESTHETIC_KEY)});document.documentElement.dataset.aesthetic=${JSON.stringify(AESTHETICS.map((item) => item.id))}.includes(v)?v:'original'}catch{document.documentElement.dataset.aesthetic='original'}})()`;
