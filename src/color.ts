// Utilitários de cor: mistura, transparência e contraste (WCAG).

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export const isHex = (s: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());

export function rgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const hex = ([r, g, b]: [number, number, number]) => `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

// Mistura a com b (t = 0 → a, t = 1 → b).
export const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return hex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
};

export const alpha = (color: string, a: number) => {
  const [r, g, b] = rgb(color);
  return `rgba(${r},${g},${b},${a})`;
};

export const luminance = (color: string) => {
  const [r, g, b] = rgb(color).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// Entre as opções, a que tem mais contraste com o fundo.
export const bestOn = (bg: string, options: string[]) => options.reduce((a, b) => (contrast(bg, b) > contrast(bg, a) ? b : a));

// Escurece/clareia até atingir o contraste mínimo com o fundo (para textos em cor da marca).
export const ensureContrast = (color: string, bg: string, min = 4.5) => {
  const target = luminance(bg) > 0.4 ? '#000000' : '#FFFFFF';
  let c = color;
  for (let i = 1; i <= 20 && contrast(c, bg) < min; i++) c = mix(color, target, i * 0.05);
  return c;
};
