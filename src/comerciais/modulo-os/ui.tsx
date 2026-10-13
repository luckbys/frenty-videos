// Peças visuais do comercial: fundo da marca, títulos cinéticos, cartões, celular, toque na tela.
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { alpha } from '../../color';
import { LineIcon } from '../../components/Icons';
import { EASE, SPRING, tween } from '../../motion/core';
import { FONT, K, SHADOW } from './tokens';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const useSpring = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: Parameters<typeof spring>[0]['config'] = SPRING.snappy) => spring({ frame: frame - at, fps, config });
};

/* ---------- Fundo ---------- */

// Roxo profundo em diagonal com brilho azul à direita e violeta embaixo (como o post da marca),
// bolhas de luz desfocadas e um brilho ciano que acompanha o foco da cena.
export const Bg: React.FC<{ children?: React.ReactNode; focus?: [number, number]; bokeh?: boolean }> = ({ children, focus = [50, 50], bokeh = true }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(168deg, ${K.bg0} 0%, ${K.bg1} 30%, ${K.bg2} 66%, ${K.bg3} 100%)`,
        fontFamily: FONT,
        color: K.white,
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(circle at ${104 + Math.sin(t * 0.3) * 3}% ${36 + Math.cos(t * 0.35) * 3}%, ${alpha(K.glowBlue, 0.6)} 0%, transparent 44%)`,
            `radial-gradient(circle at -8% ${102 + Math.sin(t * 0.25) * 2}%, ${alpha(K.glowViolet, 0.6)} 0%, transparent 50%)`,
            `radial-gradient(circle at ${focus[0] + Math.sin(t * 0.5) * 3}% ${focus[1] + Math.cos(t * 0.4) * 2}%, ${alpha(K.cyan, 0.13)} 0%, transparent 36%)`,
          ].join(','),
        }}
      />
      {bokeh && <Bokeh />}
      {children}
    </AbsoluteFill>
  );
};

const Bokeh: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dots = useMemo(
    () =>
      new Array(9).fill(0).map((_, i) => ({
        x: random(`bx${i}`) * width,
        y: random(`by${i}`) * height,
        r: 30 + random(`br${i}`) * 110,
        c: [K.cyan, K.glowViolet, K.glowBlue][i % 3],
        a: 0.1 + random(`ba${i}`) * 0.16,
        s: 0.2 + random(`bs${i}`) * 0.5,
        ph: random(`bp${i}`) * 6.28,
      })),
    [width, height],
  );
  return (
    <AbsoluteFill>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: d.x + Math.sin(frame / 60 + d.ph) * 40 - d.r,
            top: ((d.y - frame * d.s * 1.4 + height * 3) % (height + 300)) - 150 - d.r,
            width: d.r * 2,
            height: d.r * 2,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(d.c, d.a)} 0%, ${alpha(d.c, d.a * 0.5)} 45%, transparent 70%)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// Grão de filme sutil por cima de tudo.
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile('comerciais/grao.png')})`,
        backgroundPosition: `${Math.floor(random(`gx${frame}`) * 512)}px ${Math.floor(random(`gy${frame}`) * 512)}px`,
        mixBlendMode: 'overlay',
        opacity: 0.06,
        pointerEvents: 'none',
      }}
    />
  );
};

/* ---------- Tipografia ---------- */

type Word = { w: string; accent: boolean };
const parse = (text: string): Word[][] =>
  text.split('\n').map((line) => {
    const out: Word[] = [];
    for (const m of line.matchAll(/\*\*([^*]+)\*\*([^\s*]*)|(\S+)/g)) {
      if (m[1]) {
        const ws = m[1].split(/\s+/);
        ws.forEach((w, i) => out.push({ w: i === ws.length - 1 ? w + (m[2] ?? '') : w, accent: true }));
      } else out.push({ w: m[3], accent: false });
    }
    return out;
  });

export const titleEnd = (text: string, at: number, stagger = 3) => at + parse(text).flat().length * stagger + 14;

// Título em Nunito Black: cada palavra sobe de trás de uma máscara; **trechos** em ciano.
export const Title: React.FC<{
  text: string;
  at?: number;
  size?: number;
  stagger?: number;
  out?: number;
  align?: 'left' | 'center';
  accent?: string;
  lh?: number;
  weight?: number;
  style?: React.CSSProperties;
}> = ({ text, at = 0, size = 118, stagger = 3, out, align = 'left', accent = K.cyanText, lh = 1, weight = 900, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = parse(text);
  let k = 0;
  return (
    <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: lh, letterSpacing: -0.028 * size, textAlign: align, color: K.white, ...style }}>
      {lines.map((ws, li) => (
        <div key={li} style={{ whiteSpace: 'nowrap' }}>
          {ws.map((w, wi) => {
            const i = k++;
            const p = spring({ frame: frame - at - i * stagger, fps, config: SPRING.snappy });
            const o = out === undefined ? 0 : tween(frame, out + i * 1.2, 12, EASE.in);
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  verticalAlign: 'top',
                  padding: '0.1em 0.05em 0.16em',
                  margin: '-0.1em -0.05em -0.16em',
                  marginRight: wi < ws.length - 1 ? '0.22em' : '-0.05em',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    transform: `translateY(${(1 - p) * 118 - o * 118}%) rotate(${(1 - p) * 7}deg)`,
                    transformOrigin: 'left bottom',
                    color: w.accent ? accent : undefined,
                  }}
                >
                  {w.w}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Texto de apoio que sobe e aparece.
export const Fade: React.FC<{ at: number; children: React.ReactNode; dy?: number; out?: number; style?: React.CSSProperties }> = ({ at, children, dy = 26, out, style }) => {
  const frame = useCurrentFrame();
  const p = tween(frame, at, 18, EASE.out);
  const o = out === undefined ? 0 : tween(frame, out, 10, EASE.in);
  return <div style={{ opacity: p * (1 - o), transform: `translateY(${(1 - p) * dy - o * dy}px)`, ...style }}>{children}</div>;
};

// Sobrelinha da marca: ponto + barra (o "F" do símbolo) e um rótulo.
export const Kicker: React.FC<{ at: number; text: string; color?: string; style?: React.CSSProperties }> = ({ at, text, color = K.cyan, style }) => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const dot = sp(at, SPRING.bouncy);
  const bar = tween(frame, at + 4, 16, EASE.out);
  const label = tween(frame, at + 8, 16, EASE.out);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...style }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: color, transform: `scale(${dot})` }} />
      <div style={{ width: 64 * bar, height: 22, borderRadius: 11, background: color }} />
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 30,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: K.white,
          opacity: label,
          transform: `translateX(${(1 - label) * -16}px)`,
          marginLeft: 6,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ---------- Cartões e ícones ---------- */

type From = 'left' | 'right' | 'bottom' | 'top' | 'scale';
const OFFSET: Record<From, [number, number]> = { left: [-1, 0], right: [1, 0], bottom: [0, 1], top: [0, -1], scale: [0, 0] };

// Cartão branco com sombra profunda: entra com mola, flutua de leve e pode sair.
export const Card: React.FC<{
  at: number;
  from?: From;
  dist?: number;
  rot?: number;
  float?: number;
  out?: number;
  radius?: number;
  pad?: number | string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  seed?: number;
  shine?: boolean;
}> = ({ at, from = 'bottom', dist = 160, rot = 0, float = 0, out, radius = 34, pad = 28, style, children, seed = 0, shine = true }) => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const p = sp(at, { damping: 15, stiffness: 140, mass: 0.8 });
  const [ox, oy] = OFFSET[from];
  const o = out === undefined ? 0 : tween(frame, out, 14, EASE.in);
  const bob = float ? Math.sin((frame + seed * 40) / 26) * float : 0;
  const sh = shine ? tween(frame, at + 8, 26, EASE.inOut) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        background: K.white,
        color: K.ink,
        borderRadius: radius,
        padding: pad,
        boxShadow: SHADOW,
        fontFamily: FONT,
        overflow: 'hidden',
        opacity: Math.min(1, p * 1.8) * (1 - o),
        transform: `translate(${ox * dist * (1 - p)}px, ${oy * dist * (1 - p) + bob - o * 60}px) scale(${(from === 'scale' ? 0.6 : 0.9) + (from === 'scale' ? 0.4 : 0.1) * p}) rotate(${rot * (1 - p)}deg)`,
        ...style,
      }}
    >
      {children}
      {sh > 0 && sh < 1 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(110deg, transparent ${sh * 160 - 50}%, rgba(255,255,255,0.75) ${sh * 160 - 35}%, transparent ${sh * 160 - 20}%)`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export const IconTile: React.FC<{ icon: string; size?: number; bg?: string; color?: string; stroke?: number; draw?: number; radius?: number }> = ({
  icon,
  size = 88,
  bg = K.navyTint,
  color = K.navy,
  stroke = 2.2,
  draw = 1,
  radius,
}) => (
  <div style={{ width: size, height: size, borderRadius: radius ?? size * 0.3, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <LineIcon name={icon} size={size * 0.56} color={color} strokeWidth={stroke} draw={draw} />
  </div>
);

// Selo verde de confirmação com borda branca (como no post da marca).
export const CheckBadge: React.FC<{ at: number; size?: number; style?: React.CSSProperties }> = ({ at, size = 72, style }) => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const p = sp(at, SPRING.bouncy);
  const draw = tween(frame, at + 5, 14, EASE.out);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: K.green,
        border: `${size * 0.09}px solid ${K.white}`,
        boxShadow: `0 10px 26px ${alpha(K.green, 0.45)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${p})`,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <LineIcon name="check" size={size * 0.58} color={K.white} strokeWidth={3.2} draw={draw} />
    </div>
  );
};

export const Pill: React.FC<{ text: string; color: string; tint: string; size?: number; dot?: boolean; pulse?: boolean; style?: React.CSSProperties }> = ({
  text,
  color,
  tint,
  size = 22,
  dot = true,
  pulse = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const a = pulse ? 0.45 + 0.55 * Math.abs(Math.sin(frame / 9)) : 1;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.4,
        background: tint,
        color,
        fontWeight: 800,
        fontSize: size,
        padding: `${size * 0.32}px ${size * 0.7}px`,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        fontFamily: FONT,
        ...style,
      }}
    >
      {dot && <span style={{ width: size * 0.45, height: size * 0.45, borderRadius: '50%', background: color, opacity: a }} />}
      {text}
    </span>
  );
};

export const Avatar: React.FC<{ initials: string; size?: number; bg?: string; ring?: string }> = ({ initials, size = 56, bg = K.purple, ring }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${bg}, ${alpha(bg, 0.75)})`,
      color: K.white,
      fontWeight: 900,
      fontSize: size * 0.38,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      border: ring ? `${size * 0.06}px solid ${ring}` : undefined,
      boxSizing: 'border-box',
      fontFamily: FONT,
    }}
  >
    {initials}
  </div>
);

/* ---------- Celular ---------- */

export const SCREEN_W = 390;
export const SCREEN_H = 844;
const BEZEL = 15;

// iPhone com ilha dinâmica; a tela é desenhada em 390×844 e escalada para a largura pedida.
export const Phone: React.FC<{ width: number; children: React.ReactNode; bg?: string; style?: React.CSSProperties; dark?: boolean }> = ({ width, children, bg = K.page, style }) => {
  const outerW = SCREEN_W + BEZEL * 2;
  const outerH = SCREEN_H + BEZEL * 2;
  const s = width / outerW;
  return (
    <div style={{ width, height: outerH * s, position: 'relative', ...style }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: outerW,
          height: outerH,
          transform: `scale(${s})`,
          transformOrigin: '0 0',
          borderRadius: 64,
          background: 'linear-gradient(145deg, #2B2838, #0D0C12 40%, #1B1A22)',
          boxShadow: `0 60px 120px rgba(10,4,30,0.6), 0 0 0 2px rgba(255,255,255,0.08) inset, 0 0 0 1px rgba(0,0,0,0.6)`,
        }}
      >
        <div style={{ position: 'absolute', left: BEZEL, top: BEZEL, width: SCREEN_W, height: SCREEN_H, borderRadius: 50, overflow: 'hidden', background: bg, fontFamily: FONT, color: K.ink }}>
          {children}
          <div style={{ position: 'absolute', top: 11, left: '50%', width: 122, height: 35, marginLeft: -61, borderRadius: 20, background: '#08070B' }} />
        </div>
        {/* Reflexo no vidro */}
        <div
          style={{
            position: 'absolute',
            left: BEZEL,
            top: BEZEL,
            width: SCREEN_W,
            height: SCREEN_H,
            borderRadius: 50,
            background: 'linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 32%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

// Barra de status do celular (hora, sinal, bateria) sobre o cabeçalho roxo do app.
export const StatusBar: React.FC<{ color?: string }> = ({ color = K.white }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 30px 0 34px', boxSizing: 'border-box', color, fontWeight: 800, fontSize: 16 }}>
    <span>9:41</span>
    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        {[5, 7, 9, 11].map((h) => (
          <span key={h} style={{ width: 3, height: h, borderRadius: 1, background: color }} />
        ))}
      </span>
      <span style={{ width: 24, height: 11, borderRadius: 3, border: `1.5px solid ${color}`, padding: 1.5, boxSizing: 'border-box' }}>
        <span style={{ display: 'block', width: '78%', height: '100%', borderRadius: 1.5, background: color }} />
      </span>
    </span>
  </div>
);

// Cabeçalho do app com o degradê da marca.
export const AppHeader: React.FC<{ title: string; sub?: string; right?: React.ReactNode; height?: number }> = ({ title, sub, right, height = 150 }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height, background: `linear-gradient(135deg, ${K.purple} 0%, ${K.deep} 100%)`, color: K.white }}>
    <StatusBar />
    <div style={{ position: 'absolute', left: 24, right: 24, bottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        {sub && <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.75, marginBottom: 2 }}>{sub}</div>}
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.4 }}>{title}</div>
      </div>
      {right}
    </div>
  </div>
);

/* ---------- Interação ---------- */

// Toque de dedo na tela: círculo que se aproxima, aperta e solta uma onda.
export const Tap: React.FC<{ x: number; y: number; at: number; size?: number }> = ({ x, y, at, size = 54 }) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [at - 12, at - 2], [0, 1], clamp);
  const press = interpolate(frame, [at - 2, at + 2, at + 8], [1, 0.78, 1], clamp);
  const ripple = tween(frame, at, 18, EASE.out);
  const gone = interpolate(frame, [at + 10, at + 18], [1, 0], clamp);
  if (appear <= 0 || gone <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, pointerEvents: 'none' }}>
      {ripple > 0 && ripple < 1 && (
        <div
          style={{
            position: 'absolute',
            left: -size * (0.5 + ripple),
            top: -size * (0.5 + ripple),
            width: size * (1 + ripple * 2),
            height: size * (1 + ripple * 2),
            borderRadius: '50%',
            border: `3px solid ${alpha(K.white, 0.9)}`,
            opacity: 1 - ripple,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: -size / 2,
          top: -size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: alpha(K.white, 0.55),
          border: `2px solid ${alpha(K.white, 0.95)}`,
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
          opacity: appear * gone,
          transform: `scale(${(1.35 - 0.35 * appear) * press})`,
        }}
      />
    </div>
  );
};

// Texto sendo digitado (com cursor piscando enquanto digita).
export const Typed: React.FC<{ text: string; at: number; cps?: number; caret?: string }> = ({ text, at, cps = 22, caret = K.cyan }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - at) / 30) * cps)));
  const typing = frame >= at && n < text.length;
  return (
    <span>
      {text.slice(0, n)}
      {typing && <span style={{ display: 'inline-block', width: 2, height: '1.05em', background: caret, verticalAlign: 'text-bottom', marginLeft: 1 }} />}
    </span>
  );
};
export const typedEnd = (text: string, at: number, cps = 22) => at + Math.ceil((text.length / cps) * 30);

// Explosão de pontinhos (ciano/branco/verde) a partir de um ponto.
export const Burst: React.FC<{ x: number; y: number; at: number; count?: number; radius?: number }> = ({ x, y, at, count = 14, radius = 170 }) => {
  const frame = useCurrentFrame();
  const p = tween(frame, at, 26, EASE.out);
  if (p <= 0 || p >= 1) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, pointerEvents: 'none' }}>
      {new Array(count).fill(0).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + random(`ba${at}${i}`) * 0.5;
        const d = radius * (0.6 + random(`bd${at}${i}`) * 0.5) * p;
        const s = (8 + random(`bs${at}${i}`) * 10) * (1 - p);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: Math.cos(a) * d - s / 2,
              top: Math.sin(a) * d - s / 2,
              width: s,
              height: s,
              borderRadius: i % 4 === 0 ? 3 : '50%',
              background: [K.cyan, K.white, K.green, K.cyanText][i % 4],
            }}
          />
        );
      })}
    </div>
  );
};

// Câmera da cena: aproximação lenta contínua.
export const Push: React.FC<{ children: React.ReactNode; from?: number; to?: number; origin?: string }> = ({ children, from = 1, to = 1.05, origin = '50% 50%' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { ...clamp, easing: EASE.soft });
  return <AbsoluteFill style={{ transform: `scale(${from + (to - from) * p})`, transformOrigin: origin }}>{children}</AbsoluteFill>;
};
