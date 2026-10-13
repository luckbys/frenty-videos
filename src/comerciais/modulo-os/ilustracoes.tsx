// Kit de ilustrações planas do comercial, desenhadas em SVG na paleta Frenty (roxo, ciano, branco, azul):
// objetos com volume suave, sombra no chão e entrada animada. Cada peça é desenhada em torno de (0, 0)
// para a cena posicionar, girar e escalar à vontade.
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BARRA, DISCO, HASTE, PONTO_MEIO, PONTO_R } from '../../components/frenty-logo-data';
import { FONT } from './tokens';

export const IL = {
  roxo: '#7446BE',
  roxoClaro: '#9C72DE',
  roxoEscuro: '#4E2A8E',
  roxoProfundo: '#2A1259',
  ciano: '#01C1EB',
  cianoClaro: '#86E6F8',
  cianoEscuro: '#0089B8',
  branco: '#FFFFFF',
  lavanda: '#EEE9F8',
  lavandaEscura: '#D8CFEE',
  tinta: '#2A1F55',
  tintaSuave: '#8B84A8',
  azul: '#3B6FD8',
  marinho: '#14459B',
  verde: '#2FBF6B',
  verdeEscuro: '#1E9A53',
  ambar: '#F2A91E',
  vermelho: '#EF4E5A',
  ouro: '#F7C548',
  ouroClaro: '#FFE08A',
  ouroEscuro: '#D9961A',
  pneu: '#1F1636',
  metal: '#CFC8E3',
};

// Gradientes e sombras compartilhados (uma vez por SVG; os ids se repetem com a mesma definição).
export const IlDefs: React.FC = () => (
  <defs>
    <radialGradient id="il-sombra">
      <stop offset="0" stopColor="#0B0326" stopOpacity="0.6" />
      <stop offset="1" stopColor="#0B0326" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="il-brilho-ciano">
      <stop offset="0" stopColor={IL.ciano} stopOpacity="0.38" />
      <stop offset="1" stopColor={IL.ciano} stopOpacity="0" />
    </radialGradient>
    <linearGradient id="il-roxo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={IL.roxoClaro} />
      <stop offset="1" stopColor={IL.roxo} />
    </linearGradient>
    <linearGradient id="il-roxo-fundo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#8757CF" />
      <stop offset="1" stopColor="#5A2F9E" />
    </linearGradient>
    <linearGradient id="il-ciano" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={IL.cianoClaro} />
      <stop offset="1" stopColor={IL.ciano} />
    </linearGradient>
    <linearGradient id="il-ouro" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={IL.ouroEscuro} />
      <stop offset="0.45" stopColor={IL.ouro} />
      <stop offset="1" stopColor={IL.ouroEscuro} />
    </linearGradient>
    <linearGradient id="il-papel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="1" stopColor="#F3EFFB" />
    </linearGradient>
    <linearGradient id="il-metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F4F1FB" />
      <stop offset="1" stopColor="#B7AED3" />
    </linearGradient>
    <linearGradient id="il-vidro" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={IL.cianoClaro} />
      <stop offset="1" stopColor={IL.cianoEscuro} />
    </linearGradient>
    <linearGradient id="il-verde" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#5BD98F" />
      <stop offset="1" stopColor={IL.verde} />
    </linearGradient>
    <filter id="il-drop" x="-40%" y="-40%" width="180%" height="190%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" floodColor="#0B0326" floodOpacity="0.45" />
    </filter>
    <filter id="il-drop-sm" x="-40%" y="-40%" width="180%" height="190%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#0B0326" floodOpacity="0.35" />
    </filter>
    <filter id="il-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
  </defs>
);

// Tela inteira de ilustração (1080×1920) por cima do fundo da cena.
export const Palco: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, overflow: 'visible', ...style }}>
    <IlDefs />
    {children}
  </svg>
);

export const MOLA = { damping: 12, stiffness: 140, mass: 0.8 };
export const MOLA_SUAVE = { damping: 18, stiffness: 90, mass: 1 };

export const useMola = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: Partial<typeof MOLA> = MOLA) => spring({ frame: frame - at, fps, config });
};

// Grupo que entra crescendo (com um leve giro e subida) a partir do quadro `at`.
export const Pop: React.FC<{ at: number; x?: number; y?: number; rot?: number; dy?: number; from?: number; children: React.ReactNode; config?: Partial<typeof MOLA> }> = ({
  at,
  x = 0,
  y = 0,
  rot = -12,
  dy = 40,
  from = 0.3,
  children,
  config,
}) => {
  const p = useMola()(at, config);
  if (p <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y + (1 - p) * dy}) rotate(${(1 - p) * rot}) scale(${from + (1 - from) * p})`} opacity={Math.min(1, p * 2.2)}>
      {children}
    </g>
  );
};

export const Sombra: React.FC<{ x?: number; y?: number; rx: number; ry?: number; o?: number }> = ({ x = 0, y = 0, rx, ry = rx * 0.16, o = 1 }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="url(#il-sombra)" opacity={o} />
);

// Brilho de quatro pontas que pisca.
export const Brilho: React.FC<{ x: number; y: number; r: number; at: number; cor?: string }> = ({ x, y, r, at, cor = IL.branco }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const s = Math.max(0, Math.sin(Math.min(Math.PI, t / 9)) * 0.9 + (t > 28 ? 0.25 + 0.2 * Math.sin(t / 7) : 0));
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s * r}) rotate(${t * 2})`}
      d="M0 -1 C 0.12 -0.12, 0.12 -0.12, 1 0 C 0.12 0.12, 0.12 0.12, 0 1 C -0.12 0.12, -0.12 0.12, -1 0 C -0.12 -0.12, -0.12 -0.12, 0 -1 Z"
      fill={cor}
    />
  );
};

// Ícones de traço (24×24) usados dentro das ilustrações.
const GLIFOS: Record<string, string> = {
  pessoa: 'M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4zM4.5 21v-.8a7.5 7.5 0 0 1 15 0v.8',
  chave: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z',
  tecnico: 'M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM6.5 8.5h11M8 8.5a4 4 0 0 1 8 0M4.5 21v-.6a7.5 7.5 0 0 1 15 0v.6',
  calendario: 'M4 6h16v14H4zM4 10.5h16M8 3v5M16 3v5M8 14.5h2.5M13.5 14.5H16M8 17.5h2.5',
  check: 'M5 12.5l4.5 4.5L19 7',
  relogio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.2 2',
  sino: 'M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15.5 6 9M10.2 20.5a2 2 0 0 0 3.6 0',
  bandeira: 'M5 21V4M5 4.5s1.4-1 4.2-1 4.4 2 7.2 2 2.6-.7 2.6-.7v9s-.8.7-2.6.7-4.4-2-7.2-2S5 13.5 5 13.5',
  chat: 'M4 5h16v11H9.5L4 20V5zM8 9.5h8M8 12.5h5',
  grafico: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
  camera: 'M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  docMais: 'M6 3h8l4 4v14H6zM14 3v4h4M12 11v6M9 14h6',
  olho: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  selo: 'M12 2.8l2.3 1.7 2.8-.2.9 2.7 2.4 1.5-.9 2.7.9 2.7-2.4 1.5-.9 2.7-2.8-.2L12 19.6l-2.3-1.7-2.8.2-.9-2.7-2.4-1.5.9-2.7-.9-2.7 2.4-1.5.9-2.7 2.8.2zM8.6 11.3l2.4 2.4 4.4-4.6',
  fone: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3zM20 19c0 1.5-2 2.5-5 2.5',
  engrenagem: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
};

export const Glifo: React.FC<{ nome: keyof typeof GLIFOS | string; x?: number; y?: number; s: number; cor: string; sw?: number; draw?: number }> = ({
  nome,
  x = 0,
  y = 0,
  s,
  cor,
  sw = 2.2,
  draw = 1,
}) => (
  <g transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s / 24})`}>
    <path d={GLIFOS[nome] ?? GLIFOS.check} fill="none" stroke={cor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={draw < 1 ? { strokeDasharray: 90, strokeDashoffset: 90 * (1 - draw) } : undefined} />
  </g>
);

// Bolha branca redonda com ícone (e anel colorido opcional).
export const Bolha: React.FC<{ r: number; glifo: string; cor: string; fundo?: string; anel?: string; sombra?: boolean }> = ({ r, glifo, cor, fundo = IL.branco, anel, sombra = true }) => (
  <g filter={sombra ? 'url(#il-drop-sm)' : undefined}>
    <circle r={r} fill={fundo} />
    {anel && <circle r={r - 3} fill="none" stroke={anel} strokeWidth={6} />}
    <Glifo nome={glifo} s={r * 1.05} cor={cor} sw={2.3} />
  </g>
);

// Texto das ilustrações (Nunito).
export const Txt: React.FC<{ x?: number; y?: number; s: number; w?: number; cor?: string; anchor?: 'start' | 'middle' | 'end'; ls?: number; children: React.ReactNode; opacity?: number }> = ({
  x = 0,
  y = 0,
  s,
  w = 900,
  cor = IL.branco,
  anchor = 'start',
  ls = 0,
  children,
  opacity,
}) => (
  <text x={x} y={y} fontFamily={FONT} fontSize={s} fontWeight={w} fill={cor} textAnchor={anchor} letterSpacing={ls} opacity={opacity}>
    {children}
  </text>
);

// Pílula de vidro com ícone e texto (legendas das ilustrações).
export const Etiqueta: React.FC<{ texto: string; glifo?: string; cor?: string; fundo?: string; s?: number; w: number }> = ({ texto, glifo = 'check', cor = IL.verde, fundo = IL.branco, s = 34, w }) => {
  const h = s * 2;
  return (
    <g filter="url(#il-drop-sm)">
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fundo} />
      <circle cx={-w / 2 + h / 2 + 4} cy={0} r={h * 0.32} fill={cor} />
      <Glifo nome={glifo} x={-w / 2 + h / 2 + 4} s={h * 0.4} cor={IL.branco} sw={3.4} />
      <Txt x={-w / 2 + h + 8} y={s * 0.36} s={s} cor={IL.tinta}>
        {texto}
      </Txt>
    </g>
  );
};

/* ---------- Pessoas ---------- */

export type PessoaProps = {
  r: number;
  pele: string;
  cabelo: string;
  roupa: string;
  fundo: string;
  estilo: 'curto' | 'longo' | 'coque' | 'ondulado';
  acessorio?: 'bone' | 'fone' | 'oculos';
  humor?: 'feliz' | 'triste';
  id: string;
};

// Retrato em busto dentro de um círculo (traço plano, rosto simples e simpático).
export const Pessoa: React.FC<PessoaProps> = ({ r, pele, cabelo, roupa, fundo, estilo, acessorio, humor = 'feliz', id }) => {
  const frame = useCurrentFrame();
  const piscar = frame % 90 > 85 ? 0.15 : 1;
  const sombraPele = 'rgba(80,30,20,0.18)';
  return (
    <g transform={`scale(${r / 100})`}>
      <defs>
        <clipPath id={`pessoa-${id}`}>
          <circle r={100} />
        </clipPath>
      </defs>
      <circle r={100} fill={fundo} />
      <g clipPath={`url(#pessoa-${id})`}>
        {estilo === 'longo' && <path d="M-44 -14 C-50 -60 50 -60 44 -14 L50 62 C30 74 -30 74 -50 62 Z" fill={cabelo} />}
        {estilo === 'ondulado' && <path d="M-46 -10 C-56 -64 56 -64 46 -10 C58 8 54 34 40 44 L-40 44 C-54 34 -58 8 -46 -10 Z" fill={cabelo} />}
        {/* tronco e pescoço */}
        <path d="M-86 120 C-86 76 -58 56 -28 52 L28 52 C58 56 86 76 86 120 Z" fill={roupa} />
        <path d="M-28 52 L0 82 L28 52 Z" fill="rgba(255,255,255,0.22)" />
        <rect x={-14} y={24} width={28} height={34} rx={10} fill={pele} />
        <rect x={-14} y={24} width={28} height={14} fill={sombraPele} />
        <path d="M-16 52 L0 70 L16 52 Z" fill={pele} />
        {/* cabeça */}
        <circle cx={-34} cy={2} r={8} fill={pele} />
        <circle cx={34} cy={2} r={8} fill={pele} />
        <ellipse cx={0} cy={-2} rx={34} ry={40} fill={pele} />
        {/* cabelo por cima */}
        {estilo === 'curto' && <path d="M-36 -2 C-40 -44 -14 -50 4 -48 C28 -48 40 -32 36 -4 C32 -20 20 -28 2 -28 C-14 -28 -28 -22 -36 -2 Z" fill={cabelo} />}
        {estilo === 'longo' && <path d="M-36 4 C-40 -46 40 -46 36 4 C28 -16 12 -26 -4 -26 C-14 -16 -26 -8 -36 4 Z" fill={cabelo} />}
        {estilo === 'coque' && (
          <>
            <circle cx={0} cy={-46} r={18} fill={cabelo} />
            <path d="M-36 -2 C-40 -46 40 -46 36 -2 C30 -22 16 -30 0 -30 C-16 -30 -30 -22 -36 -2 Z" fill={cabelo} />
          </>
        )}
        {estilo === 'ondulado' && <path d="M-38 0 C-44 -48 44 -48 38 0 C32 -18 20 -26 6 -24 C-6 -14 -24 -12 -38 0 Z" fill={cabelo} />}
        {/* rosto */}
        <ellipse cx={-12} cy={2} rx={3.6} ry={4.4 * piscar} fill={IL.tinta} />
        <ellipse cx={12} cy={2} rx={3.6} ry={4.4 * piscar} fill={IL.tinta} />
        <path d={humor === 'triste' ? 'M-18 -11 Q-12 -10 -6 -14M6 -14 Q12 -10 18 -11' : 'M-18 -9 Q-12 -13 -6 -10M6 -10 Q12 -13 18 -9'} stroke={cabelo} strokeWidth={3} fill="none" strokeLinecap="round" />
        <circle cx={-20} cy={14} r={6} fill="#FF7A8A" opacity={0.22} />
        <circle cx={20} cy={14} r={6} fill="#FF7A8A" opacity={0.22} />
        <path d={humor === 'triste' ? 'M-8 21 Q0 15 8 21' : 'M-9 16 Q0 24 9 16'} stroke={IL.tinta} strokeWidth={3} fill="none" strokeLinecap="round" />
        {acessorio === 'oculos' && (
          <g fill="none" stroke={IL.tinta} strokeWidth={2.8}>
            <rect x={-24} y={-6} width={20} height={15} rx={6} />
            <rect x={4} y={-6} width={20} height={15} rx={6} />
            <path d="M-4 0 L4 0" />
          </g>
        )}
        {acessorio === 'bone' && (
          <>
            <path d="M-37 -14 C-37 -52 37 -52 37 -14 Z" fill={IL.marinho} />
            <ellipse cx={0} cy={-14} rx={46} ry={9} fill="#0E3577" />
            <circle cx={0} cy={-34} r={6} fill={IL.ciano} />
          </>
        )}
        {acessorio === 'fone' && (
          <g>
            <path d="M-40 4 C-42 -58 42 -58 40 4" fill="none" stroke={IL.tinta} strokeWidth={6} />
            <rect x={-48} y={-10} width={14} height={26} rx={6} fill={IL.tinta} />
            <rect x={34} y={-10} width={14} height={26} rx={6} fill={IL.tinta} />
            <path d="M-42 14 C-38 28 -24 32 -12 30" fill="none" stroke={IL.tinta} strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={-11} cy={30} r={4} fill={IL.ciano} />
          </g>
        )}
      </g>
    </g>
  );
};

/* ---------- Objetos ---------- */

// Cronômetro: arco ciano de progresso `p` e ponteiro no ângulo `ang` (graus).
export const Cronometro: React.FC<{ r: number; p: number; ang: number }> = ({ r, p, ang }) => {
  const ra = r * 0.66;
  const c = 2 * Math.PI * ra;
  return (
    <g>
      <Sombra y={r * 1.18} rx={r * 0.9} />
      <g transform={`rotate(38)`}>
        <rect x={-r * 0.1} y={-r * 1.2} width={r * 0.2} height={r * 0.3} rx={r * 0.05} fill={IL.roxoEscuro} />
      </g>
      <rect x={-r * 0.12} y={-r * 1.2} width={r * 0.24} height={r * 0.3} rx={r * 0.05} fill={IL.roxoEscuro} />
      <rect x={-r * 0.26} y={-r * 1.32} width={r * 0.52} height={r * 0.18} rx={r * 0.09} fill="url(#il-ciano)" />
      <circle r={r} fill="url(#il-roxo)" />
      <circle r={r * 0.84} fill="url(#il-papel)" />
      {new Array(12).fill(0).map((_, i) => (
        <line
          key={i}
          x1={0}
          y1={-r * 0.78}
          x2={0}
          y2={-r * (i % 3 === 0 ? 0.68 : 0.72)}
          stroke={IL.lavandaEscura}
          strokeWidth={r * (i % 3 === 0 ? 0.045 : 0.03)}
          strokeLinecap="round"
          transform={`rotate(${i * 30})`}
        />
      ))}
      <circle r={ra} fill="none" stroke={IL.lavanda} strokeWidth={r * 0.1} />
      <circle r={ra} fill="none" stroke={IL.ciano} strokeWidth={r * 0.1} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90)" />
      <g transform={`rotate(${ang})`}>
        <line x1={0} y1={r * 0.14} x2={0} y2={-r * 0.6} stroke={IL.roxoProfundo} strokeWidth={r * 0.06} strokeLinecap="round" />
      </g>
      <circle r={r * 0.08} fill={IL.roxoProfundo} />
      <circle r={r * 0.035} fill={IL.ciano} />
    </g>
  );
};

// Avião de papel (aponta para a direita).
export const AviaoPapel: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`scale(${s / 100})`} filter="url(#il-drop-sm)">
    <path d="M60 0 L-50 -34 L-22 2 Z" fill={IL.branco} />
    <path d="M60 0 L-22 2 L-34 30 Z" fill={IL.lavandaEscura} />
    <path d="M60 0 L-22 2 L-8 14 Z" fill={IL.cianoClaro} />
  </g>
);

// Carimbo retangular com texto (como o "ATRASADA" da abertura, agora positivo).
export const Carimbo: React.FC<{ texto: string; cor: string; w: number; h: number }> = ({ texto, cor, w, h }) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.22} fill="none" stroke={cor} strokeWidth={h * 0.1} />
    <rect x={-w / 2 + h * 0.14} y={-h / 2 + h * 0.14} width={w - h * 0.28} height={h - h * 0.28} rx={h * 0.14} fill="none" stroke={cor} strokeWidth={h * 0.035} opacity={0.7} />
    <Txt y={h * 0.2} s={h * 0.52} cor={cor} anchor="middle" ls={h * 0.05}>
      {texto}
    </Txt>
  </g>
);

// Símbolo oficial Frenty (disco + F de pontos) para aplicar em objetos (van, pasta).
export const SimboloFrenty: React.FC<{ r: number; disco?: string }> = ({ r, disco = IL.branco }) => {
  const k = r / DISCO.r;
  return (
    <g transform={`scale(${k}) translate(${-DISCO.cx} ${-DISCO.cy})`}>
      <circle cx={DISCO.cx} cy={DISCO.cy} r={DISCO.r} fill={disco} />
      {[...HASTE, PONTO_MEIO].map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={PONTO_R} fill={IL.ciano} />
      ))}
      <rect x={BARRA.x} y={BARRA.y} width={BARRA.w} height={BARRA.h} rx={BARRA.h / 2} fill={IL.ciano} />
    </g>
  );
};

// Van de serviço vista de lado (para a direita); `roda` = giro das rodas em graus. Origem no chão, ao centro.
export const Van: React.FC<{ s: number; roda: number }> = ({ s, roda }) => {
  const Roda: React.FC<{ x: number }> = ({ x }) => (
    <g transform={`translate(${x} -27)`}>
      <circle r={27} fill={IL.pneu} />
      <circle r={14} fill={IL.metal} />
      <g transform={`rotate(${roda})`} stroke="#8F86AE" strokeWidth={3.5} strokeLinecap="round">
        <line x1={0} y1={-12} x2={0} y2={12} />
        <line x1={-10.4} y1={-6} x2={10.4} y2={6} />
        <line x1={-10.4} y1={6} x2={10.4} y2={-6} />
      </g>
      <circle r={4} fill={IL.roxoProfundo} />
    </g>
  );
  return (
    <g transform={`scale(${s / 260})`}>
      <Sombra y={2} rx={140} ry={14} />
      <path
        d="M-128 -36 L-128 -128 Q-128 -142 -114 -142 L50 -142 Q64 -142 74 -130 L114 -86 Q124 -74 124 -60 L124 -36 Q124 -24 112 -24 L-116 -24 Q-128 -24 -128 -36 Z"
        fill="url(#il-papel)"
      />
      <path d="M-128 -60 L120 -60 L122 -44 L-128 -44 Z" fill={IL.roxo} />
      <path d="M-128 -44 L122 -44 L123 -36 Q123 -24 112 -24 L-116 -24 Q-128 -24 -128 -36 Z" fill={IL.lavandaEscura} />
      <path d="M56 -130 L68 -130 Q72 -130 75 -126 L108 -88 L56 -88 Z" fill="url(#il-vidro)" />
      <path d="M60 -124 L70 -124 L84 -108" stroke="rgba(255,255,255,0.75)" strokeWidth={4} fill="none" strokeLinecap="round" />
      <line x1={44} y1={-138} x2={44} y2={-28} stroke={IL.lavandaEscura} strokeWidth={3} />
      <rect x={30} y={-82} width={10} height={4} rx={2} fill={IL.tintaSuave} />
      <rect x={114} y={-70} width={10} height={9} rx={3} fill={IL.ouro} />
      <rect x={-130} y={-80} width={6} height={14} rx={2} fill={IL.vermelho} />
      <g transform="translate(-44 -101)">
        <SimboloFrenty r={27} disco={IL.roxoProfundo} />
      </g>
      <path d="M-104 -24 A30 30 0 0 1 -44 -24 Z M40 -24 A30 30 0 0 1 100 -24 Z" fill={IL.roxoProfundo} opacity={0.25} />
      <Roda x={-74} />
      <Roda x={70} />
    </g>
  );
};

// Alfinete de mapa (ponta em 0,0).
export const Pino: React.FC<{ cor: string; s: number; children?: React.ReactNode }> = ({ cor, s, children }) => (
  <g transform={`scale(${s / 100})`}>
    <Sombra y={2} rx={30} ry={7} />
    <path d="M0 0 C-12 -24 -40 -48 -40 -76 A40 40 0 1 1 40 -76 C40 -48 12 -24 0 0 Z" fill={cor} />
    <path d="M-30 -96 A40 40 0 0 1 20 -112" stroke="rgba(255,255,255,0.35)" strokeWidth={6} fill="none" strokeLinecap="round" />
    <circle cy={-76} r={24} fill={IL.branco} />
    <g transform="translate(0 -76)">{children}</g>
  </g>
);

// Moeda vista de lado (pilhas): `n` moedas empilhadas.
export const PilhaMoedas: React.FC<{ n: number; rx: number; caindo?: number[] }> = ({ n, rx, caindo = [] }) => {
  const ry = rx * 0.3;
  const h = rx * 0.26;
  // a sombra só aparece conforme a primeira moeda chega ao chão
  const chao = Math.max(0, 1 - (caindo[0] ?? 0) / 260);
  return (
    <g>
      <g opacity={chao} transform={`scale(${0.5 + 0.5 * chao})`}>
        <Sombra y={ry * 0.4} rx={rx * 1.3} ry={ry * 0.8} />
      </g>
      {new Array(n).fill(0).map((_, i) => {
        const off = caindo[i] ?? 0;
        const y = -i * h - off;
        return (
          <g key={i} transform={`translate(0 ${y})`} opacity={off > 400 ? 0 : 1}>
            <path d={`M${-rx} 0 L${-rx} ${-h} A${rx} ${ry} 0 0 1 ${rx} ${-h} L${rx} 0 A${rx} ${ry} 0 0 1 ${-rx} 0 Z`} fill="url(#il-ouro)" />
            <ellipse cy={-h} rx={rx} ry={ry} fill={IL.ouroClaro} />
            <ellipse cy={-h} rx={rx * 0.72} ry={ry * 0.68} fill="none" stroke={IL.ouroEscuro} strokeWidth={rx * 0.06} opacity={0.5} />
          </g>
        );
      })}
    </g>
  );
};

// Medidor semicircular verde/âmbar/vermelho com ponteiro no ângulo `ang` (180 = esquerda, 270 = topo, 360 = direita).
export const Medidor: React.FC<{ r: number; ang: number }> = ({ r, ang }) => {
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const sw = r * 0.2;
  return (
    <g>
      <path d={`M${-r - sw} 0 A${r + sw} ${r + sw} 0 0 1 ${r + sw} 0 Z`} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" strokeWidth={3} />
      <path d={arc(180, 286)} fill="none" stroke={IL.verde} strokeWidth={sw} strokeLinecap="round" />
      <path d={arc(290, 328)} fill="none" stroke={IL.ambar} strokeWidth={sw} />
      <path d={arc(332, 360)} fill="none" stroke={IL.vermelho} strokeWidth={sw} strokeLinecap="round" />
      {new Array(9).fill(0).map((_, i) => (
        <line key={i} x1={r * 0.72} y1={0} x2={r * 0.64} y2={0} stroke="rgba(255,255,255,0.5)" strokeWidth={4} strokeLinecap="round" transform={`rotate(${180 + i * 22.5})`} />
      ))}
      <g transform={`rotate(${ang})`}>
        <path d={`M0 ${-r * 0.06} L${r * 0.78} 0 L0 ${r * 0.06} Z`} fill={IL.branco} />
      </g>
      <circle r={r * 0.24} fill={IL.branco} filter="url(#il-drop-sm)" />
      <Txt y={r * 0.08} s={r * 0.2} cor={IL.roxo} anchor="middle">
        R$
      </Txt>
    </g>
  );
};

// Despertador de mesa (sem tocar) com arco ciano de andamento `p`.
export const Despertador: React.FC<{ r: number; p: number; min: number }> = ({ r, p, min }) => {
  const ra = r * 0.62;
  const c = 2 * Math.PI * ra;
  return (
    <g>
      <Sombra y={r * 1.12} rx={r * 0.95} />
      <rect x={-r * 0.68} y={r * 0.78} width={r * 0.16} height={r * 0.34} rx={r * 0.08} fill={IL.roxoEscuro} transform={`rotate(28 ${-r * 0.6} ${r * 0.8})`} />
      <rect x={r * 0.52} y={r * 0.78} width={r * 0.16} height={r * 0.34} rx={r * 0.08} fill={IL.roxoEscuro} transform={`rotate(-28 ${r * 0.6} ${r * 0.8})`} />
      <path d={`M${-r * 0.92} ${-r * 0.62} A${r * 0.36} ${r * 0.36} 0 0 1 ${-r * 0.38} ${-r * 1.02} Z`} fill="url(#il-ciano)" />
      <path d={`M${r * 0.38} ${-r * 1.02} A${r * 0.36} ${r * 0.36} 0 0 1 ${r * 0.92} ${-r * 0.62} Z`} fill="url(#il-ciano)" />
      <rect x={-r * 0.06} y={-r * 1.2} width={r * 0.12} height={r * 0.26} rx={r * 0.05} fill={IL.roxoEscuro} />
      <circle r={r} fill="url(#il-roxo)" />
      <circle r={r * 0.82} fill="url(#il-papel)" />
      {new Array(12).fill(0).map((_, i) => (
        <circle key={i} cx={0} cy={-r * 0.72} r={r * (i % 3 === 0 ? 0.04 : 0.024)} fill={IL.lavandaEscura} transform={`rotate(${i * 30})`} />
      ))}
      <circle r={ra} fill="none" stroke={IL.lavanda} strokeWidth={r * 0.09} />
      <circle r={ra} fill="none" stroke={IL.ciano} strokeWidth={r * 0.09} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90)" />
      <line x1={0} y1={0} x2={0} y2={-r * 0.36} stroke={IL.roxoProfundo} strokeWidth={r * 0.07} strokeLinecap="round" transform={`rotate(${min / 12 + 120})`} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.52} stroke={IL.roxoProfundo} strokeWidth={r * 0.05} strokeLinecap="round" transform={`rotate(${min})`} />
      <circle r={r * 0.07} fill={IL.roxoProfundo} />
    </g>
  );
};

// Folha de calendário com dia e mês.
export const FolhaCalendario: React.FC<{ w: number; dia: string; mes: string }> = ({ w, dia, mes }) => {
  const h = w * 1.08;
  return (
    <g filter="url(#il-drop-sm)">
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.12} fill={IL.branco} />
      <path d={`M${-w / 2} ${-h / 2 + w * 0.12} Q${-w / 2} ${-h / 2} ${-w / 2 + w * 0.12} ${-h / 2} L${w / 2 - w * 0.12} ${-h / 2} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + w * 0.12} L${w / 2} ${-h / 2 + w * 0.3} L${-w / 2} ${-h / 2 + w * 0.3} Z`} fill={IL.vermelho} />
      <rect x={-w * 0.26} y={-h / 2 - w * 0.08} width={w * 0.07} height={w * 0.2} rx={w * 0.035} fill={IL.tinta} />
      <rect x={w * 0.19} y={-h / 2 - w * 0.08} width={w * 0.07} height={w * 0.2} rx={w * 0.035} fill={IL.tinta} />
      <Txt y={-h / 2 + w * 0.235} s={w * 0.15} cor={IL.branco} anchor="middle" ls={w * 0.01}>
        {mes}
      </Txt>
      <Txt y={h / 2 - w * 0.2} s={w * 0.46} cor={IL.tinta} anchor="middle">
        {dia}
      </Txt>
    </g>
  );
};

// SVG pequeno centrado em (0, 0) para pôr uma ilustração dentro de um bloco de layout.
export const MiniPalco: React.FC<{ size: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, children, style }) => (
  <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} style={{ overflow: 'visible', ...style }}>
    <IlDefs />
    {children}
  </svg>
);

// Lápis inclinado escrevendo (ponta em 0, 0).
export const Lapis: React.FC<{ s: number; rot?: number }> = ({ s, rot = 38 }) => (
  <g transform={`scale(${s / 100}) rotate(${rot})`}>
    <path d="M0 0 L-9 -22 L9 -22 Z" fill="#F6D9B5" />
    <path d="M0 0 L-3.4 -8.4 L3.4 -8.4 Z" fill={IL.tinta} />
    <rect x={-9} y={-92} width={18} height={70} fill={IL.ambar} />
    <rect x={-3} y={-92} width={6} height={70} fill={IL.ouroClaro} opacity={0.7} />
    <rect x={-9} y={-104} width={18} height={12} fill={IL.metal} />
    <path d="M-9 -104 L-9 -112 Q-9 -118 -3 -118 L3 -118 Q9 -118 9 -112 L9 -104 Z" fill="#F28CA0" />
  </g>
);

// Moeda de frente com asinhas batendo (dinheiro indo embora).
export const MoedaAsas: React.FC<{ r: number; bate: number }> = ({ r, bate }) => {
  const k = r / 30;
  const asa = 'M-26 -6 C-44 -34 -70 -26 -66 -10 C-76 -6 -70 8 -54 5 C-48 10 -36 8 -26 2 Z';
  return (
    <g transform={`scale(${k})`}>
      <g transform={`translate(-24 -2) scale(1 ${bate}) translate(24 2)`}>
        <path d={asa} fill={IL.branco} />
        <path d="M-40 -14 C-50 -18 -58 -16 -60 -10" stroke={IL.lavandaEscura} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(24 -2) scale(-1 ${bate}) translate(24 2)`}>
        <path d={asa} fill={IL.branco} />
        <path d="M-40 -14 C-50 -18 -58 -16 -60 -10" stroke={IL.lavandaEscura} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      </g>
      <circle r={30} fill="url(#il-ouro)" />
      <circle r={22} fill="none" stroke={IL.ouroEscuro} strokeWidth={2.4} opacity={0.6} />
      <Txt y={7} s={20} cor={IL.ouroEscuro} anchor="middle">
        R$
      </Txt>
    </g>
  );
};

// Selo de concluído: medalha verde recortada com fitas e check desenhado conforme `draw`.
export const Selo: React.FC<{ r: number; draw?: number }> = ({ r, draw = 1 }) => {
  const pts = new Array(24).fill(0).map((_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r * 0.88 : r;
    return `${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  });
  return (
    <g>
      <Sombra y={r * 1.5} rx={r * 0.8} />
      <path d={`M${-r * 0.5} ${r * 0.5} L${-r * 0.78} ${r * 1.36} L${-r * 0.48} ${r * 1.22} L${-r * 0.3} ${r * 1.5} L${-r * 0.06} ${r * 0.7} Z`} fill={IL.verdeEscuro} />
      <path d={`M${r * 0.5} ${r * 0.5} L${r * 0.78} ${r * 1.36} L${r * 0.48} ${r * 1.22} L${r * 0.3} ${r * 1.5} L${r * 0.06} ${r * 0.7} Z`} fill={IL.verdeEscuro} />
      <path d={`M${pts.join(' L')} Z`} fill="url(#il-verde)" stroke="url(#il-verde)" strokeWidth={r * 0.08} strokeLinejoin="round" />
      <circle r={r * 0.66} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={r * 0.05} />
      <Glifo nome="check" s={r * 0.95} cor={IL.branco} sw={3.6} draw={draw} />
    </g>
  );
};
