// Ícones de linha para as cenas: escolhidos pela IA (ou pelo texto do item) e, quando nenhum serve, desenhados pela IA.
import React, { createContext, useContext } from 'react';
import type { CustomIcon } from '../types';

const P: Record<string, React.ReactNode> = {
  box: <path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5v-9zM3 7.5l9 4.5 9-4.5M12 12v9" />,
  cart: <path d="M3 4h2l2.4 11h10.2L20 7H6.2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />,
  chat: <path d="M4 5h16v11H9l-5 4V5zM8 9h8M8 12h5" />,
  spark: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />,
  chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6M20 16V6" />,
  clock: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2" />,
  coin: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11" />,
  receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6M9 16h3" />,
  store: <path d="M4 10v10h16V10M3 10l2-6h14l2 6H3zM3 10a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M10 20v-5h4v5" />,
  shield: <path d="M12 3l8 3v6c0 4.5-3.4 8.1-8 9-4.6-.9-8-4.5-8-9V6l8-3zM8.5 12l2.5 2.5 4.5-5" />,
  target: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z" />,
  users: <path d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M16 3.5a4 4 0 010 7.5M22 21v-1a6 6 0 00-4-5.7" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  up: <path d="M4 17l6-6 4 4 7-7M15 8h6v6" />,
  down: <path d="M4 7l6 6 4-4 7 7M15 16h6v-6" />,
  rocket: <path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1-4 4.5-8.5 12.5-9-.5 8-5 11.5-9 12.5zM14.5 9.5h.01M9 12l-3-.5 2.5-3H12M12 15l.5 3 3-2.5V12" />,
  calendar: <path d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5M8 14h2M14 14h2M8 17h2" />,
  heart: <path d="M12 20s-7.5-4.6-9-9.3C2 7.2 4.3 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3 0 5.3 2.7 4.3 6.2-1.5 4.7-9 9.3-9 9.3z" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />,
  phone: <path d="M7 3h10v18H7zM11 18h2" />,
  mail: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  lock: <path d="M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 017 0V11M12 15v2" />,
  gift: <path d="M4 10h16v4H4zM5 14v7h14v-7M12 10v11M12 10c-1.5-3-5-4-5.5-1.5S10 10 12 10zm0 0c1.5-3 5-4 5.5-1.5S14 10 12 10z" />,
  truck: <path d="M2 6h12v10H2zM14 10h4l3 3v3h-7M6 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z" />,
  leaf: <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c3-4 6-6 9-7.5" />,
  home: <path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6" />,
  search: <path d="M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM20 20l-4.8-4.8" />,
  gear: <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />,
  globe: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" />,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />,
  trophy: <path d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4M8 21h8M9.5 17h5v4h-5z" />,
  card: <path d="M3 6h18v12H3zM3 10h18M7 15h4" />,
  percent: <path d="M19 5L5 19M7 9a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z" />,
  pin: <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
  doc: <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  alert: <path d="M12 8v5M12 16.5h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />,
  arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
  play: <path d="M7 5l12 7-12 7V5z" />,
  camera: <path d="M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 100-8 4 4 0 000 8z" />,
  megaphone: <path d="M3 10v4h3l8 5V5L6 10H3zM18 8.5a5 5 0 010 7M6 14l1.5 6h3L9 15" />,
  wallet: <path d="M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H3V7zM3 7l12-3v3M16 13.5h.01" />,
  handshake: <path d="M2 11l4-4 4 2 3-2 4 1 5 4M6 7l-1 7 5 5 2-1 3 2 3-3M10 15l2 2M13 13l2 2" />,
  cloud: <path d="M7 18a4 4 0 01-.5-8A6 6 0 0118 9a4.5 4.5 0 01-.5 9H7z" />,
  wifi: <path d="M2 9a15 15 0 0120 0M5.5 12.5a10 10 0 0113 0M9 16a5 5 0 016 0M12 19.5h.01" />,
  refresh: <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" />,
  eye: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z" />,
  smile: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM8 14c1 1.5 2.3 2.2 4 2.2s3-.7 4-2.2M9 9.5h.01M15 9.5h.01" />,
  tag: <path d="M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01" />,
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />,
};

// Nomes aceitos pela montagem com IA (a lista vai no pedido feito à IA).
export const ICON_NAMES = Object.keys(P);

// Ícones desenhados pela IA para o vídeo atual.
const Custom = createContext<Record<string, React.ReactNode>>({});
export const CustomIconsProvider: React.FC<{ icons?: CustomIcon[]; children: React.ReactNode }> = ({ icons, children }) => {
  const map: Record<string, React.ReactNode> = {};
  for (const ic of icons ?? []) map[ic.name] = ic.paths.map((d, i) => <path key={i} d={d} pathLength={80} />);
  return <Custom.Provider value={map}>{children}</Custom.Provider>;
};

const RULES: [RegExp, keyof typeof P][] = [
  [/previs|prev[eê]|preditiv/i, 'spark'],
  [/whats|mensag|atendim|crm|convers|chat|conte?ato/i, 'chat'],
  [/estoque|reposi|compra|produto|mercadoria|ruptura|pedido/i, 'box'],
  [/vend|pdv|caixa|carrinho|checkout|ticket/i, 'cart'],
  [/\bia\b|iaf|intelig/i, 'spark'],
  [/automat|autom[aá]t/i, 'bolt'],
  [/relat[oó]rio|dado|gr[aá]fico|dashboard|acompanh|indicador|m[eé]trica|an[aá]lise/i, 'chart'],
  [/tempo|hora|r[aá]pid|agilid|minuto/i, 'clock'],
  [/custo|lucro|dinheiro|pre[cç]o|financ|margem|economi|r\$/i, 'coin'],
  [/nota|fiscal|nf-?e|imposto|tribut/i, 'receipt'],
  [/loja|varejo|filia|unidade/i, 'store'],
  [/segur|prote|backup|confi[aá]/i, 'shield'],
  [/meta|objetivo|foco|resultado/i, 'target'],
  [/cliente|equipe|funcion|pessoa|time\b/i, 'users'],
  [/simples|f[aá]cil|pr[aá]tic|integr/i, 'bolt'],
];

const match = (s: string) => RULES.find(([re]) => re.test(s))?.[1];
// O trecho em **negrito** manda (é o conceito principal do item); depois, o texto inteiro.
export const iconFor = (text: string): keyof typeof P => {
  const bold = text.match(/\*\*([^*]+)\*\*/)?.[1];
  return (bold && match(bold)) || match(text) || 'check';
};

export const LineIcon: React.FC<{ name: keyof typeof P | string; size: number; color: string; draw?: number; strokeWidth?: number }> = ({
  name,
  size,
  color,
  draw = 1,
  strokeWidth = 2,
}) => {
  const custom = useContext(Custom);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <g style={{ strokeDasharray: 80, strokeDashoffset: 80 * (1 - draw) }}>{custom[name] ?? P[name] ?? P.check}</g>
    </svg>
  );
};
