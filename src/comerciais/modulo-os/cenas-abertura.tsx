// Cenas 1 a 3: o caos da gestão manual, os problemas e a entrada da marca com o módulo.
import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { alpha } from '../../color';
import { FrentyLogo } from '../../components/FrentyLogo';
import { LineIcon } from '../../components/Icons';
import { EASE, SPRING, Sfx, tween } from '../../motion/core';
import { K, M, SHADOW } from './tokens';
import { Cronometro, Glifo, IL, Lapis, MiniPalco, MoedaAsas, Palco, Pessoa, PilhaMoedas, Pop, Selo, Sombra, Txt, useMola } from './ilustracoes';
import { Bg, Fade, Kicker, Push, Title, useSpring } from './ui';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* ---------- Cena 1: o caos ---------- */

export const SWEEP = 100; // quadro em que a barra ciana varre a tela

// Rabiscos de caneta (linhas onduladas) para preencher os papéis.
const Scribble: React.FC<{ w: number; seed: number; color?: string }> = ({ w, seed, color = '#2B4C9B' }) => {
  const pts = new Array(9).fill(0).map((_, i) => `${(i / 8) * w},${8 + Math.sin(i * 1.7 + seed) * 5 + random(`sc${seed}${i}`) * 4}`);
  return (
    <svg width={w} height={20} style={{ display: 'block' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const PaperOS: React.FC<{ n: string; stampAt?: number; w: number; h: number }> = ({ n, stampAt, w, h }) => {
  const sp = useSpring();
  const stamp = stampAt === undefined ? 0 : sp(stampAt, { damping: 12, stiffness: 220, mass: 0.6 });
  return (
    <div style={{ width: w, height: h, background: K.paper, borderRadius: 10, boxShadow: SHADOW, padding: 30, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', color: K.ink }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '3px solid #D9D3C4', paddingBottom: 12 }}>
        <span style={{ fontWeight: 900, fontSize: 21, letterSpacing: 2 }}>ORDEM DE SERVIÇO</span>
        <span style={{ fontWeight: 800, fontSize: 24, color: '#C93C3C', fontStyle: 'italic' }}>Nº {n}</span>
      </div>
      {['Cliente', 'Serviço', 'Técnico', 'Prazo', 'Custo'].map((l, i) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#8A8170', width: 82 }}>{l}:</span>
          <div style={{ flex: 1, borderBottom: '2px dashed #D9D3C4', paddingBottom: 2 }}>
            {i !== 4 ? <Scribble w={(w - 170) * (0.45 + random(`pw${n}${i}`) * 0.5)} seed={i + n.length} /> : <span style={{ fontSize: 22, fontWeight: 800, color: '#C93C3C', fontStyle: 'italic' }}>???</span>}
          </div>
        </div>
      ))}
      {/* Marca de café */}
      <div style={{ position: 'absolute', right: -30, bottom: -30, width: 170, height: 170, borderRadius: '50%', border: '12px solid rgba(120,80,40,0.16)' }} />
      {stampAt !== undefined && stamp > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '56%',
            transform: `translate(-50%, -50%) rotate(-16deg) scale(${2.4 - 1.4 * Math.min(1, stamp)})`,
            opacity: Math.min(1, stamp * 1.5) * 0.92,
            border: '6px solid #D33A3A',
            color: '#D33A3A',
            borderRadius: 12,
            padding: '6px 22px',
            fontWeight: 900,
            fontSize: 46,
            letterSpacing: 4,
          }}
        >
          ATRASADA
        </div>
      )}
    </div>
  );
};

const SpreadSheet: React.FC<{ w: number }> = ({ w }) => {
  const cols = ['Cliente', 'Serviço', 'Status', 'Valor'];
  const rows = [
    ['J. Silva', 'Revisão', 'feito?', 'R$ 320'],
    ['Ribeiro', 'Troca', '???', '#REF!'],
    ['M. Souza', 'Instal.', 'pendente', 'R$ 1.1'],
    ['Auto Center', '—', 'ligar', '???'],
    ['Oficina 2', 'Peças', 'atrasado', '#REF!'],
  ];
  return (
    <div style={{ width: w, background: K.white, borderRadius: 14, boxShadow: SHADOW, overflow: 'hidden', fontSize: 19, color: K.ink }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', background: '#1E7B45', color: K.white, fontWeight: 900 }}>
        {cols.map((c) => (
          <div key={c} style={{ padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
            {c}
          </div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr' }}>
          {r.map((c, j) => {
            const bad = c.includes('?') || c.includes('#');
            return (
              <div key={j} style={{ padding: '9px 12px', borderRight: `1px solid ${K.line}`, borderBottom: `1px solid ${K.line}`, background: bad ? K.redTint : undefined, color: bad ? K.red : K.ink, fontWeight: bad ? 900 : 700 }}>
                {c}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Sticky: React.FC<{ text: string; color: string; size: number }> = ({ text, color, size }) => (
  <div
    style={{
      width: size,
      height: size,
      background: `linear-gradient(160deg, ${color}, ${alpha(color, 0.85)})`,
      boxShadow: '0 22px 40px rgba(16,6,48,0.4)',
      padding: 26,
      boxSizing: 'border-box',
      fontWeight: 900,
      fontStyle: 'italic',
      fontSize: 34,
      lineHeight: 1.15,
      color: '#4A3B10',
      transform: 'skewX(-4deg)',
    }}
  >
    {text}
  </div>
);

const Bubble: React.FC<{ text: string; mine?: boolean; w?: number }> = ({ text, mine, w = 470 }) => (
  <div
    style={{
      maxWidth: w,
      background: mine ? '#D7F7C7' : K.white,
      color: K.ink,
      borderRadius: 28,
      borderBottomRightRadius: mine ? 6 : 28,
      borderBottomLeftRadius: mine ? 28 : 6,
      padding: '20px 26px',
      fontSize: 32,
      fontWeight: 800,
      boxShadow: '0 18px 40px rgba(16,6,48,0.35)',
      lineHeight: 1.2,
    }}
  >
    {text}
    <div style={{ fontSize: 18, fontWeight: 700, color: K.inkSoft, textAlign: 'right', marginTop: 6 }}>{mine ? '22:47 ✓✓' : '22:41'}</div>
  </div>
);

type Item = { x: number; y: number; rot: number; at: number; el: React.ReactNode; z?: number };

const Chaos: React.FC<{ items: Item[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  return (
    <>
      {items.map((it, i) => {
        const p = sp(it.at, { damping: 13, stiffness: 150, mass: 0.8 });
        // Na varredura, cada item é arremessado para fora do quadro, a partir do centro da bagunça.
        const dx = it.x - 540;
        const dy = it.y - 1250;
        const len = Math.hypot(dx, dy) || 1;
        const e = tween(frame, SWEEP - 2 + random(`ex${i}`) * 6, 16, EASE.in);
        const spin = (random(`es${i}`) > 0.5 ? 1 : -1) * 70;
        const wob = Math.sin((frame + i * 17) / 14) * 1.6;
        const bob = Math.sin((frame + i * 23) / 19) * 7;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: it.x,
              top: it.y,
              zIndex: it.z ?? i,
              transform: `translate(-50%, -50%) translate(${(dx / len) * 1500 * e}px, ${(1 - p) * 220 + bob + (dy / len) * 1500 * e}px) rotate(${it.rot * Math.min(1, p) + wob + spin * e + (1 - p) * 20}deg) scale(${(0.7 + 0.3 * p) * (1 + 0.25 * e)})`,
              opacity: Math.min(1, p * 2),
              filter: e > 0.05 ? `blur(${e * 12}px)` : undefined,
            }}
          >
            {it.el}
          </div>
        );
      })}
    </>
  );
};

// Rastros cianos (a barra do F) que cruzam a tela enquanto a bagunça voa para fora.
const STREAKS = [
  { y: 640, h: 34, d: 0, c: K.cyan },
  { y: 820, h: 90, d: 2, c: K.cyan },
  { y: 1010, h: 26, d: 5, c: 'rgba(255,255,255,0.55)' },
  { y: 1180, h: 70, d: 1, c: K.cyanText },
  { y: 1390, h: 30, d: 4, c: K.cyan },
  { y: 1560, h: 56, d: 3, c: 'rgba(255,255,255,0.4)' },
  { y: 1740, h: 40, d: 6, c: K.cyan },
];
export const Streaks: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [SWEEP, SWEEP + 4, SWEEP + 16], [0, 0.18, 0], clamp);
  return (
    <>
      {STREAKS.map((st, i) => {
        const e = tween(frame, SWEEP - 3 + st.d, 14, EASE.inOut);
        if (e <= 0 || e >= 1) return null;
        const w = 700 + st.h * 6;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 1200 - e * (2400 + w),
              top: st.y - st.h / 2,
              width: w,
              height: st.h,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${st.c}, ${alpha(K.cyan, 0)})`,
              boxShadow: st.c === K.cyan ? `0 0 40px ${alpha(K.cyan, 0.7)}` : undefined,
            }}
          />
        );
      })}
      {flash > 0 && <AbsoluteFill style={{ background: K.white, opacity: flash }} />}
    </>
  );
};

// Os jeitos antigos, riscados um a um.
const OLD_WAYS = ['Papel', 'Planilha', 'Grupo de WhatsApp'];
export const OldWays: React.FC<{ at: number; itens?: string[] }> = ({ at, itens = OLD_WAYS }) => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, width: 900 }}>
      {itens.map((w, i) => {
        const p = sp(at + i * 6, SPRING.bouncy);
        const strike = tween(frame, at + 14 + i * 6, 10, EASE.out);
        return (
          <div
            key={w}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 28px 16px 18px',
              borderRadius: 999,
              background: alpha(K.white, 0.1),
              border: `2px solid ${alpha(K.white, 0.22)}`,
              fontSize: 38,
              fontWeight: 800,
              color: alpha(K.white, 1 - strike * 0.45),
              transform: `scale(${p})`,
              transformOrigin: 'left center',
            }}
          >
            <span style={{ width: 40, height: 40, borderRadius: 20, background: K.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LineIcon name="x" size={24} color={K.white} strokeWidth={3.4} />
            </span>
            {w}
            <span style={{ position: 'absolute', left: 70, top: '50%', height: 5, marginTop: -2, width: `calc((100% - 92px) * ${strike})`, borderRadius: 3, background: K.cyan }} />
          </div>
        );
      })}
    </div>
  );
};

export const CenaCaos: React.FC = () => {
  const items: Item[] = [
    { x: 760, y: 1240, rot: 7, at: 8, el: <PaperOS n="0912" w={380} h={480} /> },
    { x: 330, y: 1150, rot: -9, at: 4, el: <PaperOS n="0847" w={420} h={530} stampAt={44} /> },
    { x: 700, y: 900, rot: 5, at: 14, el: <SpreadSheet w={540} /> },
    { x: 250, y: 790, rot: -7, at: 20, el: <Sticky text="Ligar pro cliente!!" color={K.sticky} size={240} /> },
    { x: 870, y: 1580, rot: 10, at: 26, el: <Sticky text="A peça chegou??" color={K.stickyPink} size={220} /> },
    { x: 380, y: 1560, rot: -3, at: 32, el: <Bubble text="Cadê a O.S. do Sr. João?" /> },
    { x: 640, y: 1735, rot: 2, at: 40, el: <Bubble text="Alguém viu o orçamento?" mine w={430} /> },
  ];
  const frame = useCurrentFrame();
  const shake = frame >= 44 && frame < 54 ? Math.sin(frame * 3.1) * (54 - frame) * 1.2 : 0;
  return (
    <Bg focus={[50, 60]}>
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        <Push from={1} to={1.06}>
          <Chaos items={items} />
        </Push>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: M, top: 210 }}>
        <Title text={'Ainda controla\nO.S. no **papel**?'} at={4} size={108} out={SWEEP - 6} />
      </div>
      <Streaks />
      <div style={{ position: 'absolute', left: M, top: 620 }}>
        <Kicker at={SWEEP + 14} text="Chega de improviso" />
      </div>
      <div style={{ position: 'absolute', left: M, top: 710 }}>
        <Title text={'Diga adeus à\n**gestão**\n**manual.**'} at={SWEEP + 18} size={150} lh={0.98} />
      </div>
      <div style={{ position: 'absolute', left: M, top: 1250 }}>
        <OldWays at={SWEEP + 40} />
      </div>
      <Sfx name="whoosh" at={2} volume={0.25} />
      {items.map((it, i) => (
        <Sfx key={i} name="pop" at={it.at + 3} volume={0.22} />
      ))}
      <Sfx name="click" at={46} volume={0.5} />
      <Sfx name="whoosh" at={SWEEP - 2} volume={0.5} />
      {OLD_WAYS.map((_, i) => (
        <React.Fragment key={i}>
          <Sfx name="pop" at={SWEEP + 41 + i * 6} volume={0.22} />
          <Sfx name="tick" at={SWEEP + 54 + i * 6} volume={0.35} />
        </React.Fragment>
      ))}
    </Bg>
  );
};

/* ---------- Cena 2: os problemas ---------- */

// Cada problema ganha uma ilustração (desenhada em torno de 0,0 num quadro de 220 px).
const EtapasEsquecidas: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 7) * 4;
  return (
    <g>
      <Sombra y={106} rx={78} />
      <g transform="rotate(-7)">
        <rect x={-70} y={-90} width={140} height={182} rx={18} fill="url(#il-papel)" filter="url(#il-drop-sm)" />
        <rect x={-30} y={-102} width={60} height={24} rx={9} fill="url(#il-metal)" />
        {[0, 1, 2].map((i) => {
          const y = -36 + i * 44;
          const ok = i !== 1;
          return (
            <g key={i}>
              {ok ? (
                <>
                  <circle cx={-40} cy={y} r={14} fill={IL.verde} />
                  <Glifo nome="check" x={-40} y={y} s={18} cor={IL.branco} sw={3.6} />
                </>
              ) : (
                <circle cx={-40} cy={y} r={13} fill="none" stroke={IL.vermelho} strokeWidth={3.4} strokeDasharray="5 5" />
              )}
              <rect x={-16} y={y - 6} width={ok ? 64 : 50} height={12} rx={6} fill={ok ? IL.lavandaEscura : IL.lavanda} />
            </g>
          );
        })}
      </g>
      <g transform={`translate(68 ${-78 + bob})`}>
        <circle r={32} fill={IL.vermelho} filter="url(#il-drop-sm)" />
        <Txt y={15} s={44} anchor="middle">
          ?
        </Txt>
      </g>
    </g>
  );
};

const CustosVoando: React.FC = () => {
  const frame = useCurrentFrame();
  const bate = 0.5 + 0.5 * Math.abs(Math.sin(frame / 3.2));
  return (
    <g>
      <g transform="translate(-38 84)">
        <PilhaMoedas n={4} rx={50} />
      </g>
      {[0, 1].map((k) => {
        const t = ((frame + k * 26) % 52) / 52;
        const x = -26 + t * 112;
        const y = 4 - t * 92 + Math.sin(t * Math.PI * 2) * 6;
        return (
          <g key={k} transform={`translate(${x} ${y}) rotate(${-12 + t * 20})`} opacity={Math.min(1, t * 6, (1 - t) * 3)}>
            <MoedaAsas r={26 + t * 6} bate={bate} />
          </g>
        );
      })}
    </g>
  );
};

const ClienteSemResposta: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 8) * 3;
  return (
    <g>
      <g transform="translate(-36 30)">
        <Pessoa r={70} pele="#C98B63" cabelo="#3A2418" roupa={IL.azul} fundo="#FFE3CC" estilo="curto" humor="triste" id="cliente-problema" />
      </g>
      <g transform={`translate(54 ${-64 + bob})`}>
        <path d="M-54 -32 Q-54 -46 -40 -46 L40 -46 Q54 -46 54 -32 L54 20 Q54 34 40 34 L-12 34 L-34 54 L-30 34 L-40 34 Q-54 34 -54 20 Z" fill={IL.branco} filter="url(#il-drop-sm)" />
        <Txt y={10} s={56} cor={IL.vermelho} anchor="middle">
          ?
        </Txt>
        <g transform="translate(50 -42)">
          <circle r={22} fill={IL.ambar} />
          <Glifo nome="relogio" s={26} cor={IL.branco} sw={2.8} />
        </g>
      </g>
    </g>
  );
};

const PROBLEMS = [
  { title: 'Etapas esquecidas', sub: 'Ninguém sabe em que pé está', Il: EtapasEsquecidas },
  { title: 'Custos sem controle', sub: 'Peças e horas fora da conta', Il: CustosVoando },
  { title: 'Cliente sem resposta', sub: 'E a confiança vai embora', Il: ClienteSemResposta },
];
const STRIKE = 78;

export const CenaProblemas: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  return (
    <Bg focus={[50, 45]}>
      <div style={{ position: 'absolute', left: M, top: 460 }}>
        <Kicker at={2} text="O dia a dia sem sistema" />
      </div>
      {PROBLEMS.map((pb, i) => {
        const at = 8 + i * 15;
        const pop = mola(at, { damping: 11, stiffness: 150, mass: 0.7 });
        const txt = tween(frame, at + 4, 16, EASE.out);
        const strike = tween(frame, STRIKE + i * 5, 12, EASE.out);
        // Os problemas caem logo depois de riscados, antes do título entrar no lugar deles.
        const fall = tween(frame, STRIKE + 12 + i * 3, 16, EASE.in);
        const shake = frame > at + 6 && frame < at + 16 ? Math.sin(frame * 2.7) * (at + 16 - frame) * 1.1 : 0;
        return (
          <div key={pb.title} style={{ position: 'absolute', left: M, top: 620 + i * 250, width: 1080 - M * 2, height: 214, transform: `translate(${shake}px, ${fall * 900}px) rotate(${fall * (i % 2 ? 10 : -12)}deg)`, opacity: 1 - fall }}>
            <div style={{ position: 'absolute', left: 0, top: -3, width: 220, height: 220, transform: `scale(${pop}) rotate(${(1 - Math.min(1, pop)) * -24}deg)` }}>
              <MiniPalco size={220}>
                <circle r={106} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" strokeWidth={3} />
                <pb.Il />
              </MiniPalco>
            </div>
            <div style={{ position: 'absolute', left: 262, right: -20, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: K.white, opacity: txt, transform: `translateX(${(1 - txt) * 90}px)` }}>
              <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1.05 }}>{pb.title}</div>
              <div style={{ fontSize: 31, fontWeight: 700, color: alpha(K.white, 0.75), marginTop: 6 }}>{pb.sub}</div>
            </div>
            {/* Risco ciano por cima do problema */}
            <div style={{ position: 'absolute', left: -20, top: 80, height: 16, width: (1080 - M * 2 + 40) * strike, borderRadius: 8, background: K.cyan, boxShadow: `0 0 30px ${alpha(K.cyan, 0.8)}` }} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: M, top: 740 }}>
        <Title text={'Isso acaba\n**aqui.**'} at={STRIKE + 32} size={176} lh={0.98} />
      </div>
      {PROBLEMS.map((_, i) => (
        <React.Fragment key={i}>
          <Sfx name="pop" at={8 + i * 15 + 4} volume={0.35} />
          <Sfx name="tick" at={STRIKE + i * 5} volume={0.5} />
        </React.Fragment>
      ))}
      <Sfx name="whoosh" at={STRIKE + 14} volume={0.3} />
    </Bg>
  );
};

/* ---------- Cena 3: a marca e o módulo ---------- */

// Os três momentos da O.S. (criação, acompanhamento e fechamento) ligados por uma trilha pontilhada.
const PASSOS = ['Criação', 'Acompanhamento', 'Fechamento'];
const PASSOS_X = [220, 540, 860];
const PASSOS_Y = 1540;

const DocNovo: React.FC = () => (
  <g>
    <Sombra y={84} rx={62} />
    <g transform="rotate(-6)">
      <rect x={-50} y={-64} width={100} height={128} rx={14} fill="url(#il-papel)" filter="url(#il-drop-sm)" />
      <rect x={-34} y={-44} width={50} height={10} rx={5} fill={IL.roxo} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={-34} y={-18 + i * 22} width={i === 2 ? 38 : 66} height={9} rx={4.5} fill={IL.lavandaEscura} />
      ))}
    </g>
    <g transform="translate(22 46)">
      <Lapis s={64} />
    </g>
    <g transform="translate(46 -60)">
      <circle r={24} fill={IL.ciano} filter="url(#il-drop-sm)" />
      <path d="M0 -11 V11 M-11 0 H11" stroke={IL.branco} strokeWidth={5.5} strokeLinecap="round" />
    </g>
  </g>
);

const PASSOS_AT = 118;

const Passos: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const viagem = tween(frame, at + 22, 30, EASE.inOut);
  const xPonto = PASSOS_X[0] + (PASSOS_X[2] - PASSOS_X[0]) * viagem;
  // quadro em que o ponto chega a cada passo (a curva é simétrica: metade do caminho na metade do tempo)
  const chegadas = [at + 22, at + 37, at + 52];
  return (
    <Palco>
      {new Array(31).fill(0).map((_, k) => {
        const x = PASSOS_X[0] + (k * (PASSOS_X[2] - PASSOS_X[0])) / 30;
        if (PASSOS_X.some((px) => Math.abs(px - x) < 104)) return null;
        return <circle key={k} cx={x} cy={PASSOS_Y} r={5.5} fill={IL.branco} opacity={0.45 * tween(frame, at + 8 + k * 0.5, 6)} />;
      })}
      {viagem > 0 && viagem < 1 && (
        <g>
          <circle cx={xPonto} cy={PASSOS_Y} r={22} fill={IL.ciano} opacity={0.5} filter="url(#il-glow)" />
          <circle cx={xPonto} cy={PASSOS_Y} r={11} fill={IL.ciano} />
        </g>
      )}
      {PASSOS.map((nome, i) => {
        const onda = (frame - chegadas[i]) / 16;
        return (
          <g key={nome}>
            {onda > 0 && onda < 1 && <circle cx={PASSOS_X[i]} cy={PASSOS_Y} r={106 + onda * 40} fill="none" stroke={IL.ciano} strokeWidth={5} opacity={0.7 * (1 - onda)} />}
            <Pop at={at + i * 7} x={PASSOS_X[i]} y={PASSOS_Y} rot={i === 1 ? 0 : i === 0 ? -14 : 14}>
              <circle r={104} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" strokeWidth={3} />
              {i === 0 && <DocNovo />}
              {i === 1 && <Cronometro r={60} p={tween(frame, at + 12, 44, EASE.inOut) * 0.8} ang={(frame - at) * 7} />}
              {i === 2 && <Selo r={54} draw={tween(frame, at + 24, 12)} />}
            </Pop>
            <g opacity={tween(frame, at + 6 + i * 7, 12)}>
              <Txt x={PASSOS_X[i]} y={PASSOS_Y + 156} s={36} anchor="middle">
                {nome}
              </Txt>
            </g>
          </g>
        );
      })}
    </Palco>
  );
};

export const CenaMarca: React.FC = () => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const lift = sp(58, SPRING.heavy);
  const ring = tween(frame, 20, 40, EASE.out);
  return (
    <Bg focus={[50, 40]}>
      {ring > 0 && ring < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 540 - 140 - ring * 600,
            top: 880 - 140 - ring * 600,
            width: 280 + ring * 1200,
            height: 280 + ring * 1200,
            borderRadius: '50%',
            border: `${(1 - ring) * 14 + 1}px solid ${alpha(K.cyan, 0.7 * (1 - ring))}`,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: interpolate(lift, [0, 1], [770, 330]),
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${interpolate(lift, [0, 1], [1, 0.62])})`,
        }}
      >
        <FrentyLogo height={220} brilho />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center' }}>
        <Kicker at={70} text="Novo módulo" />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 790 }}>
        <Title text={'Ordens de\n**Serviço**'} at={74} size={168} align="center" lh={0.96} />
      </div>
      <Fade at={100} style={{ position: 'absolute', left: M, right: M, top: 1130, textAlign: 'center', fontSize: 44, fontWeight: 800, lineHeight: 1.3, color: alpha(K.white, 0.9) }}>
        Criação, acompanhamento e fechamento
        <br />
        em um só lugar.
      </Fade>
      <Fade at={110} style={{ position: 'absolute', left: 0, right: 0, top: 1270, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '20px 34px',
            borderRadius: 999,
            border: `3px solid ${K.cyan}`,
            background: alpha(K.cyan, 0.12),
            fontSize: 36,
            fontWeight: 900,
            boxShadow: `0 0 40px ${alpha(K.cyan, 0.35)}`,
          }}
        >
          <LineIcon name="layers" size={42} color={K.cyan} strokeWidth={2.4} />
          Integrado ao seu ERP
        </div>
      </Fade>
      <Passos at={PASSOS_AT} />
      <Sfx name="pop" at={8} volume={0.3} />
      <Sfx name="pop" at={12} volume={0.25} />
      <Sfx name="pop" at={16} volume={0.25} />
      <Sfx name="chime" at={24} volume={0.3} />
      <Sfx name="whoosh" at={60} volume={0.25} />
      <Sfx name="pop" at={112} volume={0.3} />
      {PASSOS.map((_, i) => (
        <Sfx key={i} name="pop" at={PASSOS_AT + 2 + i * 7} volume={0.2} />
      ))}
      <Sfx name="tick" at={PASSOS_AT + 37} volume={0.3} />
      <Sfx name="tick" at={PASSOS_AT + 52} volume={0.35} />
    </Bg>
  );
};
