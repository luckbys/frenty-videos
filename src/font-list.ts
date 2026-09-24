// Catálogo das fontes disponíveis (sem CSS, pode ser usado no Node).
// Para adicionar uma fonte: instale @fontsource/<nome>, importe os pesos em src/fonts.ts e inclua aqui.

export const FONTS = [
  { name: 'Plus Jakarta Sans', maxWeight: 800 },
  { name: 'Inter', maxWeight: 900 },
  { name: 'Poppins', maxWeight: 900 },
  { name: 'Montserrat', maxWeight: 900 },
  { name: 'DM Sans', maxWeight: 900 },
  { name: 'Nunito', maxWeight: 900 },
  { name: 'Sora', maxWeight: 800 },
  { name: 'Outfit', maxWeight: 900 },
  { name: 'Manrope', maxWeight: 800 },
] as const;

export type FontName = (typeof FONTS)[number]['name'];

export const fontStack = (name: string) => `"${name}", system-ui, sans-serif`;
