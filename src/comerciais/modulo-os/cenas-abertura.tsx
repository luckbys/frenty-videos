// Cenas 1 a 3: o caos da gestão manual, os problemas e a entrada da marca com o módulo.
import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { alpha } from '../../color';
import { FrentyLogo } from '../../components/FrentyLogo';
import { LineIcon } from '../../components/Icons';
import { EASE, SPRING, Sfx, tween } from '../../motion/core';
import { K, M, SHADOW } from './tokens';
import { AppHeader, Bg, Card, Fade, IconTile, Kicker, Phone, Pill, Push, Title, useSpring } from './ui';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* ---------- Cena 1: o caos ---------- */

const SWEEP = 100; // quadro em que a barra ciana varre a tela

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
const Streaks: React.FC = () => {
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
const OldWays: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, width: 900 }}>
      {OLD_WAYS.map((w, i) => {
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

const PROBLEMS = [
  { icon: 'alert', title: 'Etapas esquecidas', sub: 'Ninguém sabe em que pé está', color: K.red, tint: K.redTint },
  { icon: 'coin', title: 'Custos sem controle', sub: 'Peças e horas fora da conta', color: K.amber, tint: K.amberTint },
  { icon: 'chat', title: 'Cliente sem resposta', sub: 'E a confiança vai embora', color: K.red, tint: K.redTint },
];
const STRIKE = 78;

export const CenaProblemas: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Bg focus={[50, 45]}>
      <div style={{ position: 'absolute', left: M, top: 460 }}>
        <Kicker at={2} text="O dia a dia sem sistema" />
      </div>
      {PROBLEMS.map((pb, i) => {
        const at = 8 + i * 15;
        const strike = tween(frame, STRIKE + i * 5, 12, EASE.out);
        // Os cartões caem logo depois de riscados, antes do título entrar no lugar deles.
        const fall = tween(frame, STRIKE + 12 + i * 3, 16, EASE.in);
        const shake = frame > at + 6 && frame < at + 16 ? Math.sin(frame * 2.7) * (at + 16 - frame) * 1.1 : 0;
        return (
          <div key={pb.title} style={{ position: 'absolute', left: M, top: 620 + i * 250, width: 1080 - M * 2, height: 214, transform: `translate(${shake}px, ${fall * 900}px) rotate(${fall * (i % 2 ? 10 : -12)}deg)`, opacity: 1 - fall }}>
            <Card at={at} from="right" dist={900} rot={6} radius={36} pad={0} style={{ left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 30, padding: '0 36px' }}>
              <IconTile icon={pb.icon} size={124} bg={pb.tint} color={pb.color} stroke={2.4} />
              <div>
                <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: -1.2 }}>{pb.title}</div>
                <div style={{ fontSize: 31, fontWeight: 700, color: K.inkSoft, marginTop: 2 }}>{pb.sub}</div>
              </div>
            </Card>
            {/* Risco ciano por cima do problema */}
            <div style={{ position: 'absolute', left: -20, top: 99, height: 16, width: (1080 - M * 2 + 40) * strike, borderRadius: 8, background: K.cyan, boxShadow: `0 0 30px ${alpha(K.cyan, 0.8)}` }} />
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

// Celular que surge pela borda de baixo com a lista de O.S. (antecipa as telas das próximas cenas).
const PEEK = [
  { n: '#1248', c: 'Oficina Ribeiro', st: 'Em execução', col: '#B87700', tint: K.amberTint },
  { n: '#1247', c: 'Auto Center Sul', st: 'Aberta', col: K.navy, tint: K.navyTint },
  { n: '#1246', c: 'Mecânica Souza', st: 'Fechada', col: K.green, tint: K.greenTint },
];
const PeekPhone: React.FC<{ at: number }> = ({ at }) => {
  const sp = useSpring();
  const p = sp(at, SPRING.heavy);
  return (
    <div style={{ position: 'absolute', left: 240, top: interpolate(p, [0, 1], [1980, 1470]), width: 600, perspective: 2000 }}>
      <div style={{ transform: `rotateX(${16 - 8 * p}deg)`, transformOrigin: '50% 0%' }}>
        <Phone width={600}>
          <AppHeader title="Ordens de serviço" sub="Hoje" right={<LineIcon name="search" size={24} color="#fff" />} />
          <div style={{ position: 'absolute', left: 16, right: 16, top: 166, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PEEK.map((o) => (
              <div key={o.n} style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 6px 18px rgba(29,20,64,0.06)' }}>
                <IconTile icon="doc" size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>O.S. {o.n}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: K.inkSoft }}>{o.c}</div>
                </div>
                <Pill text={o.st} color={o.col} tint={o.tint} size={12} />
              </div>
            ))}
          </div>
        </Phone>
      </div>
    </div>
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
      <Fade at={104} style={{ position: 'absolute', left: M, right: M, top: 1130, textAlign: 'center', fontSize: 44, fontWeight: 800, lineHeight: 1.3, color: alpha(K.white, 0.9) }}>
        Criação, acompanhamento e fechamento
        <br />
        em um só lugar.
      </Fade>
      <Fade at={122} style={{ position: 'absolute', left: 0, right: 0, top: 1290, display: 'flex', justifyContent: 'center' }}>
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
      <PeekPhone at={128} />
      <Sfx name="pop" at={8} volume={0.3} />
      <Sfx name="pop" at={12} volume={0.25} />
      <Sfx name="pop" at={16} volume={0.25} />
      <Sfx name="chime" at={24} volume={0.3} />
      <Sfx name="whoosh" at={60} volume={0.25} />
      <Sfx name="pop" at={124} volume={0.3} />
      <Sfx name="whoosh" at={126} volume={0.22} />
    </Bg>
  );
};
