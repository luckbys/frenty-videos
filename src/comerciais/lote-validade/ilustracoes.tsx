// Peças de ilustração do comercial de Lote e Validade, no mesmo estilo plano do kit do Módulo de O.S.
// (src/comerciais/modulo-os/ilustracoes.tsx): caixas, etiquetas de lote, prateleira, produtos, calendário,
// sino, lixeira, cofrinho, carrinho e os prédios da rota do lote. Cada peça é desenhada em torno de (0, 0);
// as que ficam em pé têm a origem no chão, ao centro.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Glifo, IL, Sombra, SimboloFrenty, Txt } from '../modulo-os/ilustracoes';

export const KRAFT = { frente: '#E9C38C', topo: '#F5DDB4', lado: '#CF9F62', fita: '#F8E8CB', tinta: '#9C6B32' };
export const ROSA = { claro: '#F7A6CB', base: '#F08AB8', escuro: '#D9629A', fenda: '#B4447A' };

/* ---------- Caixas e etiquetas ---------- */

// Caixa de papelão em leve perspectiva (topo e lateral). `children` fica no centro da frente.
export const Caixa: React.FC<{ w: number; h: number; children?: React.ReactNode; sombra?: boolean }> = ({ w, h, children, sombra = true }) => {
  const d = w * 0.15;
  const dy = d * 0.72;
  return (
    <g>
      {sombra && <Sombra x={d * 0.4} y={4} rx={w * 0.64} ry={w * 0.07} />}
      <path d={`M${-w / 2} ${-h} L${-w / 2 + d} ${-h - dy} L${w / 2 + d} ${-h - dy} L${w / 2} ${-h} Z`} fill={KRAFT.topo} />
      <path d={`M${w / 2} ${-h} L${w / 2 + d} ${-h - dy} L${w / 2 + d} ${-dy} L${w / 2} 0 Z`} fill={KRAFT.lado} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={w * 0.02} fill={KRAFT.frente} />
      <path d={`M${-w * 0.09} ${-h} L${-w * 0.09 + d} ${-h - dy} L${w * 0.09 + d} ${-h - dy} L${w * 0.09} ${-h} Z`} fill={KRAFT.fita} />
      <rect x={-w * 0.09} y={-h} width={w * 0.18} height={h * 0.2} fill={KRAFT.fita} />
      <path d={`M${-w / 2 + w * 0.06} ${-h * 0.1} L${w / 2 - w * 0.06} ${-h * 0.1}`} stroke={KRAFT.lado} strokeWidth={w * 0.012} strokeLinecap="round" opacity={0.6} />
      <g transform={`translate(0 ${-h * 0.46})`}>{children}</g>
    </g>
  );
};

const BARRAS = [3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 3];

// Código de barras (largura w, altura h), centrado em (0, 0).
export const CodigoBarras: React.FC<{ w: number; h: number; cor?: string }> = ({ w, h, cor = IL.tinta }) => {
  const total = BARRAS.reduce((a, b) => a + b + 1, 0);
  const u = w / total;
  let x = -w / 2;
  return (
    <g>
      {BARRAS.map((b, i) => {
        const el = <rect key={i} x={x} y={-h / 2} width={b * u} height={h} fill={cor} />;
        x += (b + 1) * u;
        return el;
      })}
    </g>
  );
};

// Etiqueta adesiva de lote: faixa colorida com o lote, código de barras e a validade.
export const EtiquetaLote: React.FC<{ w: number; lote: string; validade: string; cor?: string }> = ({ w, lote, validade, cor = IL.ciano }) => {
  const h = w * 0.66;
  const r = w * 0.06;
  return (
    <g filter="url(#il-drop-sm)">
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={IL.branco} />
      <path d={`M${-w / 2} ${-h / 2 + r} Q${-w / 2} ${-h / 2} ${-w / 2 + r} ${-h / 2} L${w / 2 - r} ${-h / 2} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + r} L${w / 2} ${-h * 0.2} L${-w / 2} ${-h * 0.2} Z`} fill={cor} />
      <Txt x={-w * 0.42} y={-h * 0.27} s={h * 0.15} cor={IL.branco} ls={w * 0.004}>
        LOTE {lote}
      </Txt>
      <g transform={`translate(0 ${h * 0.06})`}>
        <CodigoBarras w={w * 0.84} h={h * 0.26} />
      </g>
      <Txt x={-w * 0.42} y={h * 0.4} s={h * 0.15} cor={IL.tinta}>
        VAL {validade}
      </Txt>
    </g>
  );
};

// Plaquinha de validade presa no produto (verde = ok, âmbar = vence logo, vermelho = vencido).
export const TagValidade: React.FC<{ texto: string; cor: string; s?: number }> = ({ texto, cor, s = 26 }) => {
  const w = texto.length * s * 0.66 + s * 1.3;
  const h = s * 1.7;
  return (
    <g filter="url(#il-drop-sm)">
      <path d={`M${-w / 2 + h * 0.36} ${-h / 2} L${w / 2 - 6} ${-h / 2} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 6} L${w / 2} ${h / 2 - 6} Q${w / 2} ${h / 2} ${w / 2 - 6} ${h / 2} L${-w / 2 + h * 0.36} ${h / 2} L${-w / 2} 0 Z`} fill={cor} />
      <circle cx={-w / 2 + h * 0.42} cy={0} r={s * 0.16} fill="rgba(255,255,255,0.85)" />
      <Txt x={-w / 2 + h * 0.62} y={s * 0.36} s={s} cor={IL.branco} ls={s * 0.04}>
        {texto}
      </Txt>
    </g>
  );
};

/* ---------- Produtos ---------- */

export const Garrafa: React.FC<{ s: number; cor?: string }> = ({ s, cor = IL.ciano }) => (
  <g transform={`scale(${s / 100})`}>
    <path d="M-30 0 Q-34 0 -34 -8 L-34 -96 Q-34 -112 -20 -122 L-14 -128 L-14 -144 L14 -144 L14 -128 L20 -122 Q34 -112 34 -96 L34 -8 Q34 0 30 0 Z" fill="url(#il-papel)" />
    <rect x={-17} y={-160} width={34} height={20} rx={6} fill={cor} />
    <rect x={-34} y={-84} width={68} height={44} fill={cor} />
    <path d="M-34 -84 L34 -84" stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
    <path d="M-22 -104 L-22 -16" stroke="rgba(255,255,255,0.8)" strokeWidth={6} strokeLinecap="round" />
  </g>
);

export const Lata: React.FC<{ s: number; cor?: string }> = ({ s, cor = IL.vermelho }) => (
  <g transform={`scale(${s / 100})`}>
    <path d="M-36 -6 L-36 -94 A36 9 0 0 1 36 -94 L36 -6 A36 9 0 0 1 -36 -6 Z" fill={cor} />
    <rect x={-36} y={-74} width={72} height={40} fill={IL.branco} opacity={0.9} />
    <ellipse cy={-94} rx={36} ry={9} fill="url(#il-metal)" />
    <ellipse cy={-94} rx={24} ry={5} fill="none" stroke="#A79DC4" strokeWidth={2.4} />
    <path d="M-26 -84 L-26 -14" stroke="rgba(255,255,255,0.45)" strokeWidth={6} strokeLinecap="round" />
  </g>
);

export const Caixinha: React.FC<{ s: number; cor?: string }> = ({ s, cor = IL.azul }) => (
  <g transform={`scale(${s / 100})`}>
    <path d="M-34 0 L-34 -110 L-22 -136 L22 -136 L34 -110 L34 0 Z" fill="url(#il-papel)" />
    <path d="M-34 -110 L34 -110 L22 -136 L-22 -136 Z" fill={IL.lavandaEscura} />
    <rect x={-6} y={-150} width={12} height={16} rx={3} fill={cor} />
    <rect x={-34} y={-90} width={68} height={58} fill={cor} />
    <circle cx={0} cy={-61} r={15} fill={IL.branco} opacity={0.9} />
  </g>
);

export const Pote: React.FC<{ s: number; cor?: string }> = ({ s, cor = IL.ambar }) => (
  <g transform={`scale(${s / 100})`}>
    <path d="M-38 -4 Q-40 0 -34 0 L34 0 Q40 0 38 -4 L40 -70 Q40 -80 30 -80 L-30 -80 Q-40 -80 -40 -70 Z" fill={IL.cianoClaro} opacity={0.55} />
    <path d="M-36 -10 L-37 -56 L37 -56 L36 -10 Z" fill={cor} opacity={0.9} />
    <rect x={-44} y={-100} width={88} height={24} rx={8} fill={IL.roxo} />
    <rect x={-30} y={-48} width={60} height={26} rx={6} fill={IL.branco} />
  </g>
);

/* ---------- Móveis e objetos ---------- */

// Estante: dois postes de metal e tábuas nas alturas `tabuas` (coordenadas da cena).
export const Prateleira: React.FC<{ x0: number; x1: number; topo: number; tabuas: number[]; base?: number }> = ({ x0, x1, topo, tabuas, base }) => {
  const fundo = base ?? tabuas[tabuas.length - 1] + 60;
  return (
    <g>
      <Sombra x={(x0 + x1) / 2} y={fundo + 6} rx={(x1 - x0) * 0.56} ry={22} />
      {[x0 + 16, x1 - 16].map((x) => (
        <rect key={x} x={x - 12} y={topo} width={24} height={fundo - topo} rx={9} fill="url(#il-metal)" />
      ))}
      {tabuas.map((y) => (
        <g key={y}>
          <rect x={x0} y={y} width={x1 - x0} height={28} rx={10} fill={IL.lavanda} />
          <rect x={x0} y={y + 20} width={x1 - x0} height={8} rx={4} fill={IL.lavandaEscura} />
        </g>
      ))}
    </g>
  );
};

// Impressora de etiquetas (a etiqueta sai pela fenda de cima).
export const Impressora: React.FC<{ w: number; luz?: number }> = ({ w, luz = 1 }) => {
  const h = w * 0.6;
  return (
    <g>
      <Sombra y={6} rx={w * 0.62} ry={w * 0.06} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={w * 0.12} fill="url(#il-roxo)" />
      <path d={`M${-w / 2} ${-h * 0.4} L${w / 2} ${-h * 0.4} L${w / 2} ${-w * 0.12} Q${w / 2} 0 ${w / 2 - w * 0.12} 0 L${-w / 2 + w * 0.12} 0 Q${-w / 2} 0 ${-w / 2} ${-w * 0.12} Z`} fill={IL.roxoEscuro} opacity={0.45} />
      <rect x={-w * 0.38} y={-h - w * 0.035} width={w * 0.76} height={w * 0.07} rx={w * 0.035} fill={IL.roxoProfundo} />
      <rect x={-w * 0.36} y={-h * 0.8} width={w * 0.36} height={h * 0.26} rx={w * 0.03} fill="url(#il-vidro)" />
      <rect x={-w * 0.31} y={-h * 0.7} width={w * 0.2} height={h * 0.05} rx={2} fill="rgba(255,255,255,0.8)" />
      <circle cx={w * 0.2} cy={-h * 0.67} r={w * 0.065} fill={IL.ciano} opacity={0.4 + 0.6 * luz} />
      <circle cx={w * 0.36} cy={-h * 0.67} r={w * 0.045} fill={IL.lavanda} />
    </g>
  );
};

// Leitor de código de barras (aponta para a esquerda; origem na janela de leitura).
export const Leitor: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`scale(${s / 100})`}>
    <path d="M70 -6 L104 76 Q108 88 96 92 L80 96 Q70 98 66 88 L44 20 Z" fill={IL.roxoEscuro} />
    <path d="M0 -30 Q0 -40 10 -40 L118 -40 Q132 -40 132 -26 L132 12 Q132 24 118 24 L10 24 Q0 24 0 14 Z" fill="url(#il-roxo)" />
    <rect x={-6} y={-28} width={14} height={40} rx={6} fill={IL.vermelho} />
    <path d="M60 24 Q64 44 52 50" stroke={IL.roxoProfundo} strokeWidth={8} fill="none" strokeLinecap="round" />
    <rect x={30} y={-30} width={70} height={10} rx={5} fill="rgba(255,255,255,0.25)" />
  </g>
);

// Lixeira com tampa que abre (`abre` de 0 a 1).
export const Lixeira: React.FC<{ w: number; abre: number }> = ({ w, abre }) => {
  const h = w * 1.12;
  return (
    <g>
      <Sombra y={6} rx={w * 0.62} ry={w * 0.08} />
      <path d={`M${-w / 2} ${-h} L${w / 2} ${-h} L${w * 0.4} -8 Q${w * 0.39} 0 ${w * 0.3} 0 L${-w * 0.3} 0 Q${-w * 0.39} 0 ${-w * 0.4} -8 Z`} fill="url(#il-metal)" />
      {[-0.22, 0, 0.22].map((k) => (
        <path key={k} d={`M${k * w} ${-h * 0.86} L${k * w * 0.86} ${-h * 0.12}`} stroke="#A99FC7" strokeWidth={w * 0.045} strokeLinecap="round" />
      ))}
      <g transform={`translate(${-w * 0.56} ${-h}) rotate(${-abre * 62}) translate(${w * 0.56} ${h})`}>
        <rect x={-w * 0.56} y={-h - w * 0.1} width={w * 1.12} height={w * 0.14} rx={w * 0.06} fill={IL.metal} />
        <rect x={-w * 0.12} y={-h - w * 0.19} width={w * 0.24} height={w * 0.1} rx={w * 0.04} fill="#A99FC7" />
      </g>
    </g>
  );
};

// Cofrinho de porquinho (olha para a direita).
export const Cofrinho: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`scale(${s / 100})`}>
    <Sombra y={66} rx={84} ry={11} />
    <rect x={-54} y={28} width={24} height={36} rx={9} fill={ROSA.escuro} />
    <rect x={30} y={28} width={24} height={36} rx={9} fill={ROSA.escuro} />
    <path d="M-88 -4 Q-110 -8 -104 -26 Q-98 -36 -88 -24" stroke={ROSA.escuro} strokeWidth={7} fill="none" strokeLinecap="round" />
    <ellipse cx={0} cy={0} rx={90} ry={66} fill={ROSA.base} />
    <path d="M-30 -54 L-16 -90 L6 -58 Z" fill={ROSA.escuro} />
    <ellipse cx={88} cy={8} rx={20} ry={25} fill={ROSA.escuro} />
    <ellipse cx={84} cy={0} rx={4} ry={6} fill={ROSA.fenda} />
    <ellipse cx={92} cy={16} rx={4} ry={6} fill={ROSA.fenda} />
    <circle cx={48} cy={-20} r={7} fill={IL.tinta} />
    <rect x={-30} y={-64} width={56} height={10} rx={5} fill={ROSA.fenda} />
    <path d="M-60 -30 Q-44 -52 -12 -56" stroke="rgba(255,255,255,0.6)" strokeWidth={9} fill="none" strokeLinecap="round" />
  </g>
);

// Carrinho de compras (de lado, para a direita). `children` vai dentro do cesto.
export const Carrinho: React.FC<{ s: number; children?: React.ReactNode; roda?: number }> = ({ s, children, roda = 0 }) => (
  <g transform={`scale(${s / 100})`}>
    <Sombra y={4} rx={96} ry={11} />
    <g>{children}</g>
    <path d="M-86 -122 L96 -122 L74 -44 L-64 -44 Z" fill="rgba(255,255,255,0.12)" stroke={IL.branco} strokeWidth={7} strokeLinejoin="round" />
    {[-0.6, -0.2, 0.2, 0.6].map((k) => (
      <path key={k} d={`M${5 + k * 92} -122 L${5 + k * 70} -44`} stroke={IL.branco} strokeWidth={4} opacity={0.75} />
    ))}
    <path d="M-80 -96 L88 -96 M-72 -70 L80 -70" stroke={IL.branco} strokeWidth={4} opacity={0.75} />
    <path d="M96 -122 L110 -150 L132 -150" stroke={IL.branco} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M-64 -44 L-52 -22 L74 -22" stroke={IL.branco} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {[-44, 60].map((x) => (
      <g key={x} transform={`translate(${x} -10)`}>
        <circle r={12} fill={IL.pneu} />
        <line x1={-7} y1={0} x2={7} y2={0} stroke={IL.metal} strokeWidth={3} transform={`rotate(${roda})`} />
      </g>
    ))}
  </g>
);

// Sino dourado; `ang` balança em torno do topo (0, 0).
export const Sino: React.FC<{ r: number; ang: number }> = ({ r, ang }) => (
  <g transform={`rotate(${ang})`}>
    <circle cy={r * 1.34} r={r * 0.17} fill={IL.ouroEscuro} transform={`rotate(${-ang * 0.6} 0 0)`} />
    <path d={`M0 ${r * 0.08} C ${r * 0.56} ${r * 0.08} ${r * 0.64} ${r * 0.52} ${r * 0.68} ${r * 0.94} L ${r * 0.9} ${r * 1.16} L ${-r * 0.9} ${r * 1.16} L ${-r * 0.68} ${r * 0.94} C ${-r * 0.64} ${r * 0.52} ${-r * 0.56} ${r * 0.08} 0 ${r * 0.08} Z`} fill="url(#il-ouro)" />
    <rect x={-r * 0.95} y={r * 1.1} width={r * 1.9} height={r * 0.16} rx={r * 0.08} fill={IL.ouroEscuro} />
    <circle cy={0} r={r * 0.14} fill="none" stroke={IL.ouroEscuro} strokeWidth={r * 0.07} />
    <path d={`M${-r * 0.34} ${r * 0.4} Q${-r * 0.44} ${r * 0.7} ${-r * 0.5} ${r * 0.96}`} stroke="rgba(255,255,255,0.65)" strokeWidth={r * 0.09} fill="none" strokeLinecap="round" />
  </g>
);

// Lupa (lente em 0, 0; cabo para baixo e à direita).
export const Lupa: React.FC<{ r: number }> = ({ r }) => (
  <g>
    <path d={`M${r * 0.7} ${r * 0.7} L${r * 1.5} ${r * 1.5}`} stroke={IL.roxoProfundo} strokeWidth={r * 0.36} strokeLinecap="round" />
    <circle r={r} fill={IL.cianoClaro} opacity={0.28} />
    <circle r={r} fill="none" stroke={IL.roxoEscuro} strokeWidth={r * 0.2} />
    <path d={`M${-r * 0.56} ${-r * 0.3} A${r * 0.64} ${r * 0.64} 0 0 1 ${-r * 0.2} ${-r * 0.6}`} stroke="rgba(255,255,255,0.85)" strokeWidth={r * 0.12} fill="none" strokeLinecap="round" />
  </g>
);

// Escudo com check (conformidade).
export const Escudo: React.FC<{ r: number; draw?: number; cor?: string }> = ({ r, draw = 1, cor = 'url(#il-verde)' }) => (
  <g>
    <Sombra y={r * 1.22} rx={r * 0.8} />
    <path d={`M0 ${-r} L${r * 0.86} ${-r * 0.66} L${r * 0.8} ${r * 0.12} Q${r * 0.66} ${r * 0.8} 0 ${r * 1.1} Q${-r * 0.66} ${r * 0.8} ${-r * 0.8} ${r * 0.12} L${-r * 0.86} ${-r * 0.66} Z`} fill={cor} />
    <path d={`M0 ${-r * 0.8} L${r * 0.68} ${-r * 0.52} L${r * 0.63} ${r * 0.1} Q${r * 0.52} ${r * 0.64} 0 ${r * 0.9}`} fill="rgba(255,255,255,0.16)" />
    <Glifo nome="check" y={r * 0.04} s={r * 1.05} cor={IL.branco} sw={3.6} draw={draw} />
  </g>
);

// Folha de multa: cabeçalho vermelho, linhas e carimbo.
export const FolhaMulta: React.FC<{ w: number }> = ({ w }) => {
  const h = w * 1.3;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.1} fill="url(#il-papel)" filter="url(#il-drop-sm)" />
      <path d={`M${-w / 2} ${-h / 2 + w * 0.1} Q${-w / 2} ${-h / 2} ${-w / 2 + w * 0.1} ${-h / 2} L${w / 2 - w * 0.1} ${-h / 2} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + w * 0.1} L${w / 2} ${-h * 0.24} L${-w / 2} ${-h * 0.24} Z`} fill={IL.vermelho} />
      <Txt y={-h * 0.32} s={w * 0.2} cor={IL.branco} anchor="middle" ls={w * 0.01}>
        MULTA
      </Txt>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={-w * 0.36} y={-h * 0.1 + i * h * 0.15} width={i === 2 ? w * 0.4 : w * 0.72} height={w * 0.07} rx={w * 0.035} fill={IL.lavandaEscura} />
      ))}
      <Txt x={w * 0.2} y={h * 0.4} s={w * 0.24} cor={IL.vermelho} anchor="middle">
        R$
      </Txt>
    </g>
  );
};

// Coração com cinco estrelas em arco (confiança do cliente).
export const Confianca: React.FC<{ r: number; estrelas?: number }> = ({ r, estrelas = 5 }) => {
  const estrela = (s: number) => {
    const p = new Array(10).fill(0).map((_, i) => {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? s * 0.45 : s;
      return `${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
    });
    return `M${p.join(' L')} Z`;
  };
  return (
    <g>
      <Sombra y={r * 1.05} rx={r * 0.8} />
      <path d={`M0 ${r * 0.9} C ${-r * 1.4} ${-r * 0.1} ${-r * 0.7} ${-r * 1.1} 0 ${-r * 0.42} C ${r * 0.7} ${-r * 1.1} ${r * 1.4} ${-r * 0.1} 0 ${r * 0.9} Z`} fill={IL.vermelho} />
      <path d={`M${-r * 0.6} ${-r * 0.36} Q${-r * 0.5} ${-r * 0.66} ${-r * 0.2} ${-r * 0.62}`} stroke="rgba(255,255,255,0.6)" strokeWidth={r * 0.12} fill="none" strokeLinecap="round" />
      {new Array(Math.min(5, estrelas)).fill(0).map((_, i) => {
        const a = ((-140 + i * 25) * Math.PI) / 180;
        return <path key={i} d={estrela(r * 0.2)} transform={`translate(${Math.cos(a) * r * 1.25} ${Math.sin(a) * r * 1.25 + r * 0.5})`} fill={IL.ouro} stroke={IL.ouroEscuro} strokeWidth={2} />;
      })}
    </g>
  );
};

/* ---------- Calendário de parede ---------- */

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Calendário de novembro/2026 (o dia 1 cai num domingo). Dias antes de `hoje` ficam riscados;
// `alvo` é o vencimento, em âmbar.
export const CalendarioParede: React.FC<{ w: number; hoje: number; alvo: number; pulso?: number }> = ({ w, hoje, alvo, pulso = 0 }) => {
  const cel = (w - 60) / 7;
  const h = 150 + cel * 5 + 30;
  const x0 = -w / 2 + 30;
  const y0 = -h / 2 + 150;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={30} fill="url(#il-papel)" filter="url(#il-drop)" />
      <path d={`M${-w / 2} ${-h / 2 + 30} Q${-w / 2} ${-h / 2} ${-w / 2 + 30} ${-h / 2} L${w / 2 - 30} ${-h / 2} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 30} L${w / 2} ${-h / 2 + 96} L${-w / 2} ${-h / 2 + 96} Z`} fill="url(#il-roxo)" />
      <Txt y={-h / 2 + 66} s={40} anchor="middle" ls={4}>
        NOVEMBRO
      </Txt>
      {[-0.3, -0.1, 0.1, 0.3].map((k) => (
        <g key={k} transform={`translate(${k * w} ${-h / 2})`}>
          <rect x={-7} y={-22} width={14} height={40} rx={7} fill={IL.metal} />
          <circle cy={14} r={9} fill={IL.roxoProfundo} />
        </g>
      ))}
      {SEMANA.map((d, i) => (
        <Txt key={i} x={x0 + cel * (i + 0.5)} y={y0 - 16} s={24} w={900} cor={IL.tintaSuave} anchor="middle">
          {d}
        </Txt>
      ))}
      {new Array(30).fill(0).map((_, i) => {
        const dia = i + 1;
        const col = i % 7;
        const lin = Math.floor(i / 7);
        const cx = x0 + cel * (col + 0.5);
        const cy = y0 + cel * (lin + 0.5);
        const passado = dia < hoje;
        const ehHoje = dia === hoje;
        const ehAlvo = dia === alvo;
        return (
          <g key={dia}>
            {ehAlvo && <circle cx={cx} cy={cy} r={cel * (0.46 + pulso * 0.16)} fill="none" stroke={IL.ambar} strokeWidth={4} opacity={1 - pulso} />}
            {ehAlvo && <circle cx={cx} cy={cy} r={cel * 0.4} fill={IL.ambar} />}
            {ehHoje && !ehAlvo && <circle cx={cx} cy={cy} r={cel * 0.4} fill={IL.roxo} />}
            <Txt x={cx} y={cy + 11} s={30} w={900} cor={ehAlvo || ehHoje ? IL.branco : passado ? IL.lavandaEscura : IL.tinta} anchor="middle">
              {dia}
            </Txt>
            {passado && <path d={`M${cx - cel * 0.26} ${cy - cel * 0.26} L${cx + cel * 0.26} ${cy + cel * 0.26} M${cx + cel * 0.26} ${cy - cel * 0.26} L${cx - cel * 0.26} ${cy + cel * 0.26}`} stroke={IL.vermelho} strokeWidth={4} strokeLinecap="round" opacity={0.55} />}
          </g>
        );
      })}
    </g>
  );
};

// Posição (centro) de um dia no CalendarioParede de largura w.
export const posDia = (w: number, dia: number): [number, number] => {
  const cel = (w - 60) / 7;
  const h = 150 + cel * 5 + 30;
  const i = dia - 1;
  return [-w / 2 + 30 + cel * ((i % 7) + 0.5), -h / 2 + 150 + cel * (Math.floor(i / 7) + 0.5)];
};

/* ---------- Rota do lote ---------- */

export const Fabrica: React.FC<{ w: number }> = ({ w }) => {
  const frame = useCurrentFrame();
  const h = w * 0.5;
  return (
    <g>
      <Sombra y={6} rx={w * 0.62} ry={w * 0.07} />
      {[0, 1, 2].map((k) => {
        const t = ((frame + k * 20) % 60) / 60;
        return <circle key={k} cx={w * 0.33 + t * w * 0.12} cy={-h - w * 0.5 - t * w * 0.34} r={w * (0.06 + t * 0.06)} fill={IL.branco} opacity={0.5 * (1 - t)} />;
      })}
      <rect x={w * 0.24} y={-h - w * 0.46} width={w * 0.14} height={w * 0.5} rx={w * 0.02} fill={IL.roxoEscuro} />
      <rect x={w * 0.24} y={-h - w * 0.38} width={w * 0.14} height={w * 0.05} fill={IL.ciano} />
      <path d={`M${-w / 2} ${-h} L${-w / 2} ${-h - w * 0.2} L${-w / 6} ${-h} L${-w / 6} ${-h - w * 0.2} L${w / 6} ${-h} L${w / 6} ${-h - w * 0.2} L${w / 2} ${-h} Z`} fill={IL.roxoEscuro} />
      {[-w / 2, -w / 6, w / 6].map((x) => (
        <path key={x} d={`M${x} ${-h - w * 0.2} L${x} ${-h} L${x + w * 0.05} ${-h} L${x + w * 0.05} ${-h - w * 0.17} Z`} fill={IL.cianoClaro} opacity={0.8} />
      ))}
      <rect x={-w / 2} y={-h} width={w} height={h} rx={w * 0.03} fill="url(#il-roxo)" />
      {[-0.32, -0.08, 0.16].map((k) => (
        <rect key={k} x={k * w} y={-h * 0.78} width={w * 0.14} height={h * 0.26} rx={w * 0.02} fill="url(#il-vidro)" />
      ))}
      <rect x={w * 0.24} y={-h * 0.5} width={w * 0.18} height={h * 0.5} rx={w * 0.02} fill={IL.roxoProfundo} />
    </g>
  );
};

export const Armazem: React.FC<{ w: number }> = ({ w }) => {
  const h = w * 0.46;
  return (
    <g>
      <Sombra y={6} rx={w * 0.62} ry={w * 0.07} />
      <path d={`M${-w / 2 - w * 0.04} ${-h} L0 ${-h - w * 0.26} L${w / 2 + w * 0.04} ${-h} Z`} fill={IL.roxoEscuro} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={w * 0.02} fill="url(#il-roxo)" />
      <rect x={-w * 0.3} y={-h * 0.82} width={w * 0.6} height={h * 0.82} rx={w * 0.02} fill={IL.lavanda} />
      {[0.66, 0.5, 0.34, 0.18].map((k) => (
        <line key={k} x1={-w * 0.3} y1={-h * k} x2={w * 0.3} y2={-h * k} stroke={IL.lavandaEscura} strokeWidth={w * 0.012} />
      ))}
      <circle cy={-h - w * 0.1} r={w * 0.05} fill={IL.ciano} />
    </g>
  );
};

export const Loja: React.FC<{ w: number }> = ({ w }) => {
  const h = w * 0.56;
  const n = 6;
  return (
    <g>
      <Sombra y={6} rx={w * 0.62} ry={w * 0.07} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={w * 0.03} fill="url(#il-papel)" />
      <rect x={-w * 0.4} y={-h * 0.56} width={w * 0.44} height={h * 0.4} rx={w * 0.02} fill="url(#il-vidro)" />
      <rect x={w * 0.12} y={-h * 0.6} width={w * 0.26} height={h * 0.6} rx={w * 0.02} fill={IL.roxo} />
      <rect x={-w / 2 - w * 0.03} y={-h - w * 0.06} width={w * 1.06} height={w * 0.08} rx={w * 0.03} fill={IL.roxoEscuro} />
      {new Array(n).fill(0).map((_, i) => {
        const x = -w / 2 - w * 0.03 + (i * w * 1.06) / n;
        const ww = (w * 1.06) / n;
        return <path key={i} d={`M${x} ${-h + w * 0.02} L${x + ww} ${-h + w * 0.02} L${x + ww} ${-h + w * 0.1} A${ww / 2} ${ww / 2} 0 0 1 ${x} ${-h + w * 0.1} Z`} fill={i % 2 ? IL.branco : IL.ciano} />;
      })}
      <Glifo nome="check" x={-w * 0.18} y={-h * 0.36} s={w * 0.14} cor={IL.branco} sw={3} />
    </g>
  );
};

// Caminhão baú (para a direita) com o símbolo Frenty; `roda` gira as rodas.
export const Caminhao: React.FC<{ s: number; roda: number }> = ({ s, roda }) => {
  const Roda: React.FC<{ x: number }> = ({ x }) => (
    <g transform={`translate(${x} -24)`}>
      <circle r={24} fill={IL.pneu} />
      <circle r={12} fill={IL.metal} />
      <line x1={-10} y1={0} x2={10} y2={0} stroke="#8F86AE" strokeWidth={3.5} transform={`rotate(${roda})`} />
      <line x1={0} y1={-10} x2={0} y2={10} stroke="#8F86AE" strokeWidth={3.5} transform={`rotate(${roda})`} />
    </g>
  );
  return (
    <g transform={`scale(${s / 260})`}>
      <Sombra y={2} rx={150} ry={14} />
      <rect x={-140} y={-170} width={180} height={140} rx={14} fill="url(#il-papel)" />
      <rect x={-140} y={-62} width={180} height={14} fill={IL.ciano} />
      <g transform="translate(-50 -116)">
        <SimboloFrenty r={30} disco={IL.roxoProfundo} />
      </g>
      <path d="M46 -130 L96 -130 Q108 -130 114 -120 L132 -88 Q136 -80 136 -70 L136 -38 Q136 -30 128 -30 L46 -30 Z" fill="url(#il-roxo)" />
      <path d="M58 -120 L94 -120 Q100 -120 104 -114 L118 -88 L58 -88 Z" fill="url(#il-vidro)" />
      <rect x={-146} y={-38} width={286} height={14} rx={7} fill={IL.roxoProfundo} />
      <Roda x={-96} />
      <Roda x={-46} />
      <Roda x={96} />
    </g>
  );
};
