// Lista com ícones, números em destaque e gráfico de barras.
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { iconFor, LineIcon } from '../components/Icons';
import { Background } from '../motion/Background';
import { Camera, EASE, SPRING, Sfx, Stage, tween, useLayout } from '../motion/core';
import { KineticText, Rich, textEnd } from '../motion/KineticText';
import { useBrand } from '../brand';
import { alpha, ensureContrast } from '../color';
import type { Scene } from '../types';
import { CornerLogo, useTitleStyle } from './shared';

/* ---------- Lista ---------- */

const BulletItem: React.FC<{ text: string; icon?: string; i: number; delay: number; last: boolean }> = ({ text, icon: iconName, i, delay, last }) => {
  const { C, accents: ACCENTS, radius, pill } = useBrand();
  const { u } = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: SPRING.snappy });
  const icon = spring({ frame: frame - delay - 3, fps, config: SPRING.bouncy });
  const draw = tween(frame, delay + 6, 16);
  const line = tween(frame, delay + 10, 14);
  const color = ACCENTS[i % ACCENTS.length];
  const size = 76 * u;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 26 * u, position: 'relative' }}>
      {!last && (
        <div
          style={{
            position: 'absolute',
            left: size / 2 - 2 * u,
            top: size,
            width: 4 * u,
            height: 34 * u,
            borderRadius: 2 * u,
            background: alpha(color, 0.33),
            transform: `scaleY(${line})`,
            transformOrigin: 'top',
          }}
        />
      )}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: pill(12 * u),
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          background: color,
          boxShadow: `0 ${10 * u}px ${28 * u}px ${alpha(color, 0.33)}`,
          transform: `scale(${icon})`,
        }}
      >
        <LineIcon name={iconName || iconFor(text)} size={40 * u} color={C.onColor(color)} draw={draw} strokeWidth={2.2} />
      </div>
      <div
        style={{
          background: C.surface,
          borderRadius: radius(22) * u,
          padding: `${22 * u}px ${34 * u}px`,
          boxShadow: `0 ${14 * u}px ${40 * u}px ${alpha(C.primary, 0.12)}`,
          fontSize: 42 * u,
          fontWeight: 600,
          lineHeight: 1.25,
          opacity: Math.min(1, p * 1.5),
          transform: `perspective(${1400 * u}px) translateX(${(1 - p) * -60 * u}px) rotateY(${(1 - p) * 28}deg)`,
          transformOrigin: 'left center',
        }}
      >
        <Rich text={text} />
      </div>
    </div>
  );
};

export const Bullets: React.FC<Extract<Scene, { type: 'bullets' }>> = ({ title, items, icons, frames }) => {
  const titleStyle = useTitleStyle();
  const { u } = useLayout();
  const first = title ? Math.min(20, textEnd(title, 0, 2.5) - 6) : 6;
  const step = Math.max(7, Math.min(16, (frames - first - 50) / items.length));
  return (
    <Background variant="light">
      <CornerLogo />
      <Camera>
        <Stage gap={34}>
          {title && <KineticText text={title} delay={0} style={{ ...titleStyle, marginBottom: 10 * u }} />}
          {items.map((it, i) => (
            <BulletItem key={i} text={it} icon={icons?.[i]} i={i} delay={first + i * step} last={i === items.length - 1} />
          ))}
        </Stage>
      </Camera>
      {items.map((_, i) => (
        <Sfx key={i} name="pop" at={first + i * step + 2} volume={0.22} />
      ))}
    </Background>
  );
};

/* ---------- Números ---------- */

const parseValue = (value: string) => {
  const m = value.match(/^(.*?)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return null;
  const [, pre, num, post] = m;
  const decimals = /[.,]/.test(num) ? num.split(/[.,]/)[1].length : 0;
  return { pre, post, n: parseFloat(num.replace(',', '.')), decimals, comma: num.includes(',') };
};

const CountUp: React.FC<{ value: string; p: number }> = ({ value, p }) => {
  const v = parseValue(value);
  if (!v) return <>{value}</>;
  const shown = (v.n * p).toFixed(v.decimals);
  return (
    <>
      {v.pre}
      {v.comma ? shown.replace('.', ',') : shown}
      {v.post}
    </>
  );
};

const Gauge: React.FC<{ value: string; p: number; color: string; size: number }> = ({ value, p, color, size }) => {
  const v = parseValue(value);
  const pct = v && value.includes('%') ? Math.min(1, v.n / 100) : null;
  const neg = value.trim().startsWith('-') || value.trim().startsWith('−');
  if (pct == null) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: alpha(color, 0.1), display: 'grid', placeItems: 'center', transform: `scale(${p})` }}>
        <LineIcon name={neg ? 'down' : 'up'} size={size * 0.5} color={color} draw={p} strokeWidth={2.4} />
      </div>
    );
  }
  const r = 42;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke={alpha(color, 0.13)} strokeWidth="11" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct * p)} />
    </svg>
  );
};

const StatCard: React.FC<{ value: string; label: string; i: number; delay: number; width: number }> = ({ value, label, i, delay, width }) => {
  const { C, accents: ACCENTS, fonts, radius } = useBrand();
  const { u } = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: SPRING.snappy });
  const count = tween(frame, delay + 6, 34, EASE.out);
  const color = ACCENTS[i % ACCENTS.length];
  // Número na cor da marca, escurecida se precisar para ler bem sobre o cartão.
  const numberColor = ensureContrast(color, C.surface, 2.6);
  return (
    <div
      style={{
        width,
        background: C.surface,
        borderRadius: radius(30) * u,
        padding: `${40 * u}px ${36 * u}px`,
        boxShadow: `0 ${18 * u}px ${50 * u}px ${alpha(C.primary, 0.14)}`,
        opacity: Math.min(1, p * 1.4),
        transform: `perspective(${1600 * u}px) rotateX(${(1 - p) * 65}deg) translateY(${(1 - p) * 40 * u}px)`,
        transformOrigin: 'bottom center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 10 * u, background: color, transform: `scaleX(${count})`, transformOrigin: 'left' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 * u }}>
        <div style={{ fontSize: 94 * u, fontWeight: 800, color: numberColor, fontFamily: fonts.heading, letterSpacing: -2 * u, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          <CountUp value={value} p={count} />
        </div>
        <Gauge value={value} p={count} color={color} size={78 * u} />
      </div>
      <div style={{ fontSize: 32 * u, fontWeight: 500, color: C.textMuted, marginTop: 20 * u, lineHeight: 1.3 }}>
        <Rich text={label} />
      </div>
    </div>
  );
};

export const Stats: React.FC<Extract<Scene, { type: 'stats' }>> = ({ title, items }) => {
  const titleStyle = useTitleStyle();
  const { u, width, vertical } = useLayout();
  const cols = vertical ? 1 : Math.min(items.length, width === 1080 ? 2 : 4);
  const inner = width - (vertical ? 180 : 300) * u;
  const cardW = (inner - (cols - 1) * 34 * u) / cols;
  const first = title ? 14 : 4;
  return (
    <Background variant="light">
      <CornerLogo />
      <Camera>
        <Stage gap={52}>
          {title && <KineticText text={title} delay={0} style={titleStyle} />}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 34 * u, width: inner }}>
            {items.map((s, i) => (
              <StatCard key={i} {...s} i={i} delay={first + i * 9} width={cardW} />
            ))}
          </div>
        </Stage>
      </Camera>
      {items.map((_, i) => (
        <React.Fragment key={i}>
          <Sfx name="pop" at={first + i * 9} volume={0.2} />
          {[0, 5, 10, 16, 24].map((t) => (
            <Sfx key={t} name="tick" at={first + i * 9 + 8 + t} volume={0.07} />
          ))}
        </React.Fragment>
      ))}
    </Background>
  );
};

/* ---------- Gráfico de barras ---------- */

export const Chart: React.FC<Extract<Scene, { type: 'chart' }>> = ({ title, items }) => {
  const { C, radius } = useBrand();
  const titleStyle = useTitleStyle();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, width, height, vertical } = useLayout();
  const first = title ? 14 : 4;
  const W = width - (vertical ? 180 : 300) * u;
  const H = vertical ? height * 0.42 : height * 0.5;
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  const peak = items.reduce((a, b, i) => (Math.abs(b.value) > Math.abs(items[a].value) ? i : a), 0);
  const slot = W / items.length;
  const barW = Math.min(slot * 0.56, 150 * u);
  const grid = tween(frame, first, 24);
  const bars = items.map((it, i) => spring({ frame: frame - first - 8 - i * 5, fps, config: SPRING.heavy }));
  const lineStart = first + 8 + items.length * 5 + 10;
  const line = tween(frame, lineStart, 26, EASE.inOut);
  const pts = items.map((it, i) => ({ x: slot * i + slot / 2, y: H - (Math.abs(it.value) / max) * H * 0.86 * Math.min(1, bars[i]) }));
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const len = pts.reduce((a, p, i) => (i ? a + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
  return (
    <Background variant="light">
      <CornerLogo />
      <Camera>
        <Stage gap={40}>
          {title && <KineticText text={title} delay={0} style={titleStyle} />}
          <div style={{ position: 'relative', width: W, height: H + 70 * u }}>
            {[0, 0.25, 0.5, 0.75, 1].map((g) => (
              <div
                key={g}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: H - g * H * 0.86,
                  height: 2 * u,
                  width: W,
                  background: g === 0 ? alpha(C.text, 0.25) : alpha(C.primary, 0.12),
                  transform: `scaleX(${grid})`,
                  transformOrigin: 'left',
                }}
              />
            ))}
            {items.map((it, i) => {
              const h = (Math.abs(it.value) / max) * H * 0.86 * bars[i];
              const hot = i === peak;
              const color = hot ? C.accent : i % 2 ? C.secondary : C.primary;
              return (
                <React.Fragment key={i}>
                  <div
                    style={{
                      position: 'absolute',
                      left: slot * i + (slot - barW) / 2,
                      top: H - h,
                      width: barW,
                      height: Math.max(0, h),
                      borderRadius: `${radius(14) * u}px ${radius(14) * u}px ${4 * u}px ${4 * u}px`,
                      background: `linear-gradient(180deg, ${color}, ${alpha(color, 0.73)})`,
                      boxShadow: hot ? `0 0 ${40 * u}px ${alpha(C.accent, 0.53)}` : undefined,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: slot * i,
                      width: slot,
                      top: H - h - (hot ? 80 : 72) * u,
                      textAlign: 'center',
                      fontSize: (hot ? 38 : 32) * u,
                      fontWeight: 800,
                      color: hot ? C.accentOnLight : C.text,
                      opacity: Math.min(1, bars[i] * 1.5),
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {it.display.replace(/[\d.,]+/, (n) => {
                      const v = parseValue(n);
                      return v ? (v.n * Math.min(1, bars[i])).toFixed(v.decimals).replace('.', v.comma ? ',' : '.') : n;
                    })}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: slot * i,
                      width: slot,
                      top: H + 16 * u,
                      textAlign: 'center',
                      fontSize: 28 * u,
                      fontWeight: 600,
                      color: C.textMuted,
                      opacity: grid,
                    }}
                  >
                    {it.label}
                  </div>
                </React.Fragment>
              );
            })}
            <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
              <path d={path} fill="none" stroke={C.primaryDeep} strokeWidth={4 * u} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - line)} opacity={0.75} />
              {pts.map((p, i) => {
                const s = interpolate(line * (pts.length - 1), [i - 0.2, i + 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                return <circle key={i} cx={p.x} cy={p.y} r={9 * u * s} fill="#fff" stroke={C.primaryDeep} strokeWidth={4 * u} />;
              })}
            </svg>
          </div>
        </Stage>
      </Camera>
      {items.map((_, i) => (
        <Sfx key={i} name="pop" at={first + 8 + i * 5} volume={0.14} />
      ))}
      <Sfx name="whoosh" at={lineStart - 4} volume={0.12} />
    </Background>
  );
};
