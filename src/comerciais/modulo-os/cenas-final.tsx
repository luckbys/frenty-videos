// Cenas 7 a 10: benefícios, integração, chamada para a demonstração e encerramento com a logo.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { alpha } from '../../color';
import { FrentyLogo } from '../../components/FrentyLogo';
import { LineIcon } from '../../components/Icons';
import { EASE, SPRING, Sfx, tween } from '../../motion/core';
import { K, M } from './tokens';
import { Brilho, IL, Palco, Sombra, useMola } from './ilustracoes';
import { Bg, Burst, CheckBadge, Fade, Kicker, Push, Tap, Title, Typed, useSpring } from './ui';

/* ---------- Cena 7: benefícios ---------- */

const BENEFITS = [
  { icon: 'layers', t: 'Organização', s: 'Tudo centralizado, sem retrabalho' },
  { icon: 'bolt', t: 'Eficiência', s: 'Menos erros e esquecimentos' },
  { icon: 'smile', t: 'Satisfação do cliente', s: 'Informação precisa e atualizada' },
  { icon: 'wallet', t: 'Controle de custos', s: 'Cada serviço monitorado' },
  { icon: 'chart', t: 'Relatórios', s: 'Decisões com dados na mão' },
];
// Ilustração de crescimento: colunas que sobem e uma seta ciana subindo por cima delas.
type P = [number, number];
const COLUNAS = [110, 160, 136, 220, 300];
const COL_W = 104;
const COL_GAP = 40;
const COL_X0 = 540 - (COLUNAS.length * COL_W + (COLUNAS.length - 1) * COL_GAP) / 2;
const CHAO = 1690;
const SETA: P[] = [
  [130, 1580],
  [252, 1510],
  [396, 1462],
  [540, 1484],
  [684, 1398],
  [850, 1300],
];
const SETA_AT = 146;

const Crescimento: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const mola = useMola();
  const seta = tween(frame, SETA_AT, 24, EASE.inOut);
  const ponta = mola(SETA_AT + 20, { damping: 10, stiffness: 170, mass: 0.6 });
  const [a, b] = [SETA[SETA.length - 2], SETA[SETA.length - 1]];
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const d = SETA.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const base = tween(frame, at - 4, 14, EASE.out);
  return (
    <Palco>
      <Sombra x={540} y={CHAO + 8} rx={420 * base} ry={30} />
      <rect x={540 - 380 * base} y={CHAO - 2} width={760 * base} height={10} rx={5} fill="rgba(255,255,255,0.28)" />
      {COLUNAS.map((h, i) => {
        const g = mola(at + i * 6, { damping: 13, stiffness: 120, mass: 0.8 });
        if (g <= 0.001) return null;
        const x = COL_X0 + i * (COL_W + COL_GAP);
        const hh = h * g;
        const ultima = i === COLUNAS.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={CHAO - hh} width={COL_W} height={hh} rx={18} fill={ultima ? 'url(#il-ciano)' : 'url(#il-papel)'} filter="url(#il-drop-sm)" />
            <rect x={x + COL_W * 0.66} y={CHAO - hh} width={COL_W * 0.34} height={hh} rx={0} fill={ultima ? IL.cianoEscuro : IL.roxo} opacity={ultima ? 0.35 : 0.14} />
            <rect x={x + 16} y={CHAO - hh + 16} width={COL_W * 0.3} height={Math.max(0, Math.min(10, hh - 30))} rx={5} fill="rgba(255,255,255,0.7)" />
          </g>
        );
      })}
      {seta > 0 && (
        <g>
          <path d={d} fill="none" stroke={IL.roxoProfundo} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - seta} opacity={0.55} />
          <path d={d} fill="none" stroke={IL.ciano} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - seta} />
        </g>
      )}
      {ponta > 0.001 && (
        <g transform={`translate(${b[0]} ${b[1]}) rotate(${ang}) scale(${ponta})`}>
          <path d="M44 0 L-26 -40 L-12 0 L-26 40 Z" fill={IL.roxoProfundo} opacity={0.55} transform="scale(1.18)" />
          <path d="M44 0 L-26 -40 L-12 0 L-26 40 Z" fill={IL.ciano} strokeLinejoin="round" />
        </g>
      )}
      <Brilho x={930} y={1236} r={24} at={SETA_AT + 22} />
      <Brilho x={772} y={1288} r={14} at={SETA_AT + 28} />
      <Brilho x={968} y={1352} r={16} at={SETA_AT + 34} />
    </Palco>
  );
};

export const CenaBeneficios: React.FC = () => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  return (
    <Bg focus={[40, 50]}>
      <Push from={1} to={1.03}>
        {BENEFITS.map((b, i) => {
          const at = 34 + i * 14;
          const tile = sp(at, SPRING.bouncy);
          const txt = tween(frame, at + 3, 16, EASE.out);
          return (
            <div key={b.t} style={{ position: 'absolute', left: M, right: M, top: 530 + i * 142, height: 120, display: 'flex', alignItems: 'center', gap: 30 }}>
              <div
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: 32,
                  background: `linear-gradient(145deg, ${K.cyanText}, ${K.cyan})`,
                  boxShadow: `0 14px 34px ${alpha(K.cyan, 0.4)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${tile}) rotate(${(1 - Math.min(1, tile)) * -30}deg)`,
                  flexShrink: 0,
                }}
              >
                <LineIcon name={b.icon} size={60} color={K.bg0} strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1, opacity: txt, transform: `translateX(${(1 - txt) * -40}px)` }}>
                <div style={{ fontSize: 50, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05 }}>{b.t}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: alpha(K.white, 0.75), marginTop: 2 }}>{b.s}</div>
              </div>
              <CheckBadge at={at + 10} size={62} style={{ border: `5px solid ${alpha(K.white, 0.9)}` }} />
            </div>
          );
        })}
        <Crescimento at={118} />
      </Push>
      <div style={{ position: 'absolute', left: M, top: 150 }}>
        <Title text={'Benefícios que\n**impulsionam**\nseu negócio'} at={2} size={100} />
      </div>
      <Sfx name="whoosh" at={2} volume={0.25} />
      {BENEFITS.map((_, i) => (
        <Sfx key={i} name="pop" at={34 + i * 14 + 2} volume={0.26} />
      ))}
      {COLUNAS.map((_, i) => (
        <Sfx key={i} name="tick" at={120 + i * 6} volume={0.18} />
      ))}
      <Sfx name="whoosh" at={SETA_AT} volume={0.26} />
      <Sfx name="chime" at={SETA_AT + 22} volume={0.26} />
    </Bg>
  );
};

/* ---------- Cena 8: integração ---------- */

const NODES = [
  { icon: 'users', t: 'CRM', a: -142 },
  { icon: 'layers', t: 'ERP', a: -38 },
  { icon: 'bolt', t: 'Automações', a: 142 },
  { icon: 'chat', t: 'Atendimento', a: 38 },
];
const HUB = { x: 540, y: 1040 };
const RADIUS = 340;

export const CenaIntegracao: React.FC = () => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const pulse = (frame % 40) / 40;
  return (
    <Bg focus={[50, 55]}>
      <Push from={1} to={1.04} origin="50% 55%">
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          {NODES.map((n, i) => {
            const rad = (n.a * Math.PI) / 180;
            const x1 = HUB.x + Math.cos(rad) * 150;
            const y1 = HUB.y + Math.sin(rad) * 150;
            const x2 = HUB.x + Math.cos(rad) * (RADIUS - 84);
            const y2 = HUB.y + Math.sin(rad) * (RADIUS - 84);
            const len = Math.hypot(x2 - x1, y2 - y1);
            const draw = tween(frame, 30 + i * 6, 20, EASE.out);
            return (
              <g key={n.t}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={alpha(K.white, 0.4)} strokeWidth={5} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
                {draw >= 1 &&
                  [0, 0.5].map((off) => {
                    const t = (((frame - 50) / 36 + off + i * 0.17) % 1 + 1) % 1;
                    const back = i % 2 === 1;
                    const q = back ? 1 - t : t;
                    return <circle key={off} cx={x1 + (x2 - x1) * q} cy={y1 + (y2 - y1) * q} r={10} fill={K.cyan} opacity={Math.sin(t * Math.PI)} />;
                  })}
              </g>
            );
          })}
        </svg>
        {[0, 1].map((k) => {
          const p = (pulse + k * 0.5) % 1;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: HUB.x - 150 - p * 120,
                top: HUB.y - 150 - p * 120,
                width: 300 + p * 240,
                height: 300 + p * 240,
                borderRadius: '50%',
                border: `3px solid ${alpha(K.cyan, 0.5 * (1 - p))}`,
                opacity: tween(frame, 20, 10),
              }}
            />
          );
        })}
        <div style={{ position: 'absolute', left: HUB.x - 130, top: HUB.y - 130, filter: `drop-shadow(0 0 40px ${alpha(K.cyan, 0.45)})` }}>
          <FrentyLogo height={260} parte="simbolo" delay={6} />
        </div>
        {NODES.map((n, i) => {
          const rad = (n.a * Math.PI) / 180;
          const x = HUB.x + Math.cos(rad) * RADIUS;
          const y = HUB.y + Math.sin(rad) * RADIUS;
          const p = sp(26 + i * 6, SPRING.bouncy);
          return (
            <div key={n.t} style={{ position: 'absolute', left: x - 84, top: y - 84, width: 168, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${p})` }}>
              <div style={{ width: 168, height: 168, borderRadius: '50%', background: K.white, boxShadow: '0 24px 50px rgba(16,6,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LineIcon name={n.icon} size={84} color={K.navy} strokeWidth={2.2} />
              </div>
              <div style={{ marginTop: 16, fontSize: 36, fontWeight: 900, whiteSpace: 'nowrap' }}>{n.t}</div>
            </div>
          );
        })}
        <Fade at={96} style={{ position: 'absolute', left: M, right: M, top: 1560, display: 'flex', gap: 20, justifyContent: 'center' }}>
          {['Tarefas automáticas', 'Resposta mais rápida'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, background: K.white, color: K.ink, borderRadius: 999, padding: '18px 26px', fontSize: 30, fontWeight: 900, boxShadow: '0 18px 40px rgba(16,6,48,0.4)' }}>
              <LineIcon name="check" size={32} color={K.green} strokeWidth={3} />
              {t}
            </div>
          ))}
        </Fade>
      </Push>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Integre e\n**automatize**'} at={2} size={128} />
      </div>
      <Sfx name="whoosh" at={2} volume={0.25} />
      <Sfx name="chime" at={14} volume={0.22} />
      {NODES.map((_, i) => (
        <Sfx key={i} name="pop" at={28 + i * 6} volume={0.24} />
      ))}
      <Sfx name="pop" at={98} volume={0.25} />
    </Bg>
  );
};

/* ---------- Cena 9: chamada para a demonstração ---------- */

const TAP9 = 96;

// Faixas de vidro com o que o módulo entrega, correndo em sentidos opostos embaixo da chamada.
const FAIXAS = [
  ['Organização', 'Menos erros', 'Custos sob controle', 'Relatórios', 'Clientes satisfeitos'],
  ['Prazo em tempo real', 'Histórico do cliente', 'Equipe conectada', 'Integração com CRM', 'Tarefas automáticas'],
];

const Faixa: React.FC<{ itens: string[]; top: number; dir: 1 | -1; at: number }> = ({ itens, top, dir, at }) => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const p = sp(at, SPRING.heavy);
  const x = dir * ((frame - at) * 2.2 + (1 - p) * 260);
  const fade = 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, height: 90, overflow: 'hidden', opacity: Math.min(1, p * 1.4) * 0.9, WebkitMaskImage: fade, maskImage: fade }}>
      <div style={{ position: 'absolute', left: '50%', top: 0, display: 'flex', gap: 22, whiteSpace: 'nowrap', transform: `translateX(calc(-50% + ${x}px))` }}>
        {[...itens, ...itens, ...itens].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 30px 14px 16px', borderRadius: 999, background: alpha(K.white, 0.1), border: `2px solid ${alpha(K.white, 0.2)}`, fontSize: 34, fontWeight: 800, color: K.white }}>
            <span style={{ width: 44, height: 44, borderRadius: 22, background: K.cyan, display: 'grid', placeItems: 'center' }}>
              <LineIcon name="check" size={28} color={K.bg0} strokeWidth={3.2} />
            </span>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CenaChamada: React.FC = () => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const btn = sp(60, SPRING.bouncy);
  const press = frame >= TAP9 - 2 && frame < TAP9 + 8 ? 0.94 : 1;
  const glow = 0.5 + 0.5 * Math.sin(frame / 8);
  const shine = ((frame - 60) % 50) / 50;
  return (
    <Bg focus={[50, 58]}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center' }}>
        <Kicker at={4} text="Comece hoje mesmo" />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 620 }}>
        <Title text={'Solicite uma\n**demonstração**\n**gratuita**'} at={8} size={122} align="center" />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1100, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            background: `linear-gradient(135deg, ${K.cyanText}, ${K.cyan})`,
            color: K.bg0,
            fontSize: 44,
            fontWeight: 900,
            padding: '34px 54px',
            borderRadius: 999,
            boxShadow: `0 0 ${50 + glow * 40}px ${alpha(K.cyan, 0.55)}, 0 20px 40px rgba(10,4,30,0.4)`,
            transform: `scale(${btn * press})`,
          }}
        >
          {frame >= 60 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '26%',
                left: `${-40 + shine * 180}%`,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                transform: 'skewX(-20deg)',
              }}
            />
          )}
          <span style={{ position: 'relative' }}>Quero minha demonstração</span>
          <span style={{ position: 'relative', display: 'flex' }}>
            <LineIcon name="arrow" size={46} color={K.bg0} strokeWidth={3} />
          </span>
        </div>
      </div>
      <Tap x={760} y={1168} at={TAP9} size={70} />
      <Burst x={540} y={1168} at={TAP9 + 2} count={18} radius={300} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', fontSize: 42, fontWeight: 800, color: alpha(K.white, 0.9), letterSpacing: 1 }}>
        <Typed text="frenty.com.br" at={TAP9 + 8} cps={20} />
      </div>
      <Faixa itens={FAIXAS[0]} top={1470} dir={-1} at={38} />
      <Faixa itens={FAIXAS[1]} top={1578} dir={1} at={44} />
      <Sfx name="whoosh" at={4} volume={0.25} />
      <Sfx name="pop" at={62} volume={0.32} />
      <Sfx name="click" at={TAP9 - 1} volume={0.55} />
      <Sfx name="chime" at={TAP9 + 3} volume={0.3} />
    </Bg>
  );
};

/* ---------- Cena 10: encerramento ---------- */

export const CenaFinal: React.FC = () => (
  <Bg focus={[50, 45]}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center' }}>
      <FrentyLogo height={200} delay={4} brilho />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 990 }}>
      <Title text={'Mais tempo para o seu\nnegócio **crescer.**'} at={40} size={64} align="center" lh={1.12} weight={800} />
    </div>
    <Fade at={62} style={{ position: 'absolute', left: 0, right: 0, top: 1210, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 30px', borderRadius: 999, background: alpha(K.white, 0.12), border: `2px solid ${alpha(K.white, 0.25)}`, fontSize: 34, fontWeight: 800 }}>
        <LineIcon name="globe" size={36} color={K.cyan} strokeWidth={2.4} />
        frenty.com.br
      </div>
    </Fade>
    <Sfx name="pop" at={12} volume={0.3} />
    <Sfx name="pop" at={18} volume={0.25} />
    <Sfx name="chime" at={28} volume={0.32} />
  </Bg>
);
