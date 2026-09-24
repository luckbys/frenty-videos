// Componentes que a montagem com IA combina: etapas, antes e depois, número em destaque,
// grade de ícones, frase de impacto e depoimento. Todos aceitam fundo claro, escuro ou cor da marca.
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LineIcon } from '../components/Icons';
import { Background } from '../motion/Background';
import { Camera, EASE, SPRING, Sfx, Stage, tween, useLayout } from '../motion/core';
import { Eyebrow, KineticText, Rich, textEnd } from '../motion/KineticText';
import { useBrand } from '../brand';
import { alpha } from '../color';
import type { Scene } from '../types';
import { CornerLogo, Shockwave, useSurface, useTitleStyle } from './shared';

type Of<T extends Scene['type']> = Extract<Scene, { type: T }>;

// No vertical (celular) os componentes crescem para ocupar a tela alta.
const useScale = () => {
  const { u, vertical } = useLayout();
  return { u: u * (vertical ? 1.28 : 1), vertical };
};

// Distribui as entradas dos itens pelo tempo da cena, deixando uns 2 s de leitura no fim.
const stepFor = (frames: number, first: number, n: number, min = 6, max = 16) =>
  Math.max(min, Math.min(max, (frames - first - 55) / Math.max(1, n)));

const SceneTitle: React.FC<{ text?: string; accent: string; marker: string; center?: boolean }> = ({ text, accent, marker, center }) => {
  const style = useTitleStyle();
  const { u, vertical } = useLayout();
  if (!text) return null;
  const fontSize = vertical ? (style.fontSize as number) * 1.2 : style.fontSize;
  return <KineticText text={text} delay={0} accent={accent} marker={marker} style={{ ...style, fontSize, marginBottom: 8 * u, textAlign: center ? 'center' : 'left' }} />;
};

const firstAfterTitle = (title?: string) => (title ? Math.min(22, textEnd(title, 0, 2.5) - 6) : 6);

/* ---------- Etapas ---------- */

export const Steps: React.FC<Of<'steps'>> = ({ title, items, surface, tint, frames }) => {
  const s = useSurface(surface, tint);
  const { radius, fonts } = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, vertical } = useScale();
  const first = firstAfterTitle(title);
  const step = stepFor(frames, first, items.length, 8, 20);
  const row = !vertical && items.length <= 5;
  const badge = (row ? 92 : 78) * u;
  const lineP = tween(frame, first, step * (items.length - 1) + 16, EASE.inOut);
  return (
    <Background variant={s.variant}>
      {!s.dark && <CornerLogo />}
      <Camera>
        <Stage gap={row ? 56 : 30}>
          <SceneTitle text={title} accent={s.accent} marker={s.marker} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: row ? 'row' : 'column', gap: (row ? 34 : 26) * u, width: '100%' }}>
            {/* Trilho que liga as etapas e avança conforme elas entram. */}
            <div
              style={{
                position: 'absolute',
                background: s.line,
                ...(row
                  ? { left: badge / 2, right: badge / 2, top: badge / 2 - 3 * u, height: 6 * u }
                  : { top: badge / 2, bottom: badge / 2, left: badge / 2 - 3 * u, width: 6 * u }),
                borderRadius: 3 * u,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: s.fill,
                  borderRadius: 3 * u,
                  transform: row ? `scaleX(${lineP})` : `scaleY(${lineP})`,
                  transformOrigin: row ? 'left' : 'top',
                }}
              />
            </div>
            {items.map((it, i) => {
              const d = first + i * step;
              const p = spring({ frame: frame - d, fps, config: SPRING.snappy });
              const pop = spring({ frame: frame - d, fps, config: SPRING.bouncy });
              const draw = tween(frame, d + 6, 16);
              return (
                <div
                  key={i}
                  style={{
                    flex: row ? 1 : undefined,
                    display: 'flex',
                    flexDirection: row ? 'column' : 'row',
                    alignItems: row ? 'flex-start' : 'center',
                    gap: (row ? 26 : 24) * u,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: badge,
                      height: badge,
                      flexShrink: 0,
                      borderRadius: '50%',
                      background: s.fill,
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: `0 0 0 ${10 * u}px ${s.dark ? 'rgba(255,255,255,0.06)' : alpha(s.fill, 0.12)}, 0 ${12 * u}px ${30 * u}px ${alpha(s.fill, 0.35)}`,
                      transform: `scale(${pop})`,
                      position: 'relative',
                    }}
                  >
                    <LineIcon name={it.icon} size={badge * 0.48} color={s.onFill} draw={draw} strokeWidth={2.2} />
                    <div
                      style={{
                        position: 'absolute',
                        right: -6 * u,
                        top: -6 * u,
                        width: 34 * u,
                        height: 34 * u,
                        borderRadius: '50%',
                        background: s.dark ? '#FFFFFF' : s.fg,
                        color: s.dark ? s.fill : '#FFFFFF',
                        fontSize: 19 * u,
                        fontWeight: 800,
                        display: 'grid',
                        placeItems: 'center',
                        fontFamily: fonts.heading,
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div
                    style={{
                      opacity: Math.min(1, p * 1.4),
                      transform: `translate${row ? 'Y' : 'X'}(${(1 - p) * 40 * u}px)`,
                      background: row ? 'transparent' : s.card,
                      borderRadius: radius(20) * u,
                      padding: row ? 0 : `${18 * u}px ${28 * u}px`,
                      boxShadow: row || s.dark ? 'none' : `0 ${12 * u}px ${34 * u}px ${s.shadow}`,
                      flex: row ? undefined : 1,
                    }}
                  >
                    <div style={{ fontSize: (row ? 40 : 38) * u, fontWeight: 800, lineHeight: 1.15, fontFamily: fonts.heading, color: s.fg }}>
                      <Rich text={it.title} accent={s.accent} />
                    </div>
                    {it.text && (
                      <div style={{ fontSize: (row ? 28 : 27) * u, lineHeight: 1.35, marginTop: 8 * u, color: s.muted, fontWeight: 500 }}>
                        <Rich text={it.text} accent={s.accent} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Stage>
      </Camera>
      {items.map((_, i) => (
        <Sfx key={i} name="pop" at={first + i * step} volume={0.22} />
      ))}
    </Background>
  );
};

/* ---------- Antes e depois ---------- */

export const Compare: React.FC<Of<'compare'>> = ({ title, before, after, surface, frames }) => {
  const s = useSurface(surface, 'destaque');
  const { C, radius, fonts, pill } = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, vertical } = useScale();
  const first = firstAfterTitle(title);
  const leftAt = first;
  const n = Math.max(before.items.length, after.items.length);
  const itemStep = Math.max(4, Math.min(9, (frames - first - 90) / (2 * n + 2)));
  const rightAt = leftAt + before.items.length * itemStep + 18;
  const good = C.accent;
  // Função (não componente) para não remontar a cada quadro.
  const column = ({ side, data, at }: { side: 'antes' | 'depois'; data: { label: string; items: string[] }; at: number }) => {
    const win = side === 'depois';
    const p = spring({ frame: frame - at, fps, config: win ? SPRING.bouncy : SPRING.snappy });
    const bg = win ? (s.dark ? 'rgba(255,255,255,0.12)' : C.surface) : s.dark ? 'rgba(0,0,0,0.18)' : alpha(C.text, 0.05);
    return (
      <div
        style={{
          flex: 1,
          background: bg,
          borderRadius: radius(28) * u,
          padding: `${34 * u}px ${38 * u}px`,
          border: `${3 * u}px solid ${win ? good : 'transparent'}`,
          boxShadow: win ? `0 ${20 * u}px ${50 * u}px ${alpha(good, 0.28)}` : 'none',
          opacity: Math.min(1, p * 1.5) * (win ? 1 : interpolate(frame, [rightAt, rightAt + 20], [1, 0.72], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })),
          transform: `translateY(${(1 - p) * 60 * u}px) scale(${win ? 0.94 + 0.06 * p : 1})`,
          display: 'flex',
          flexDirection: 'column',
          gap: 20 * u,
        }}
      >
        <div
          style={{
            alignSelf: 'flex-start',
            fontSize: 26 * u,
            fontWeight: 800,
            letterSpacing: 1.5 * u,
            textTransform: 'uppercase',
            padding: `${8 * u}px ${20 * u}px`,
            borderRadius: pill(8 * u),
            background: win ? good : s.dark ? 'rgba(255,255,255,0.12)' : alpha(C.text, 0.1),
            color: win ? C.onAccent : s.muted,
            fontFamily: fonts.heading,
          }}
        >
          {data.label}
        </div>
        {data.items.map((it, i) => {
          const d = at + 10 + i * itemStep;
          const q = tween(frame, d, 14);
          return (
            <div key={i} style={{ display: 'flex', gap: 18 * u, alignItems: 'flex-start', opacity: q, transform: `translateX(${(1 - q) * 24 * u}px)` }}>
              <div
                style={{
                  width: 44 * u,
                  height: 44 * u,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: win ? alpha(good, 0.18) : s.dark ? 'rgba(255,255,255,0.08)' : alpha(C.text, 0.08),
                  marginTop: 2 * u,
                }}
              >
                <LineIcon name={win ? 'check' : 'x'} size={26 * u} color={win ? (s.dark ? good : C.accentOnLight) : s.muted} draw={tween(frame, d + 4, 12)} strokeWidth={2.6} />
              </div>
              <div style={{ fontSize: 34 * u, lineHeight: 1.3, fontWeight: win ? 700 : 500, color: win ? s.fg : s.muted }}>
                <Rich text={it} accent={win ? s.accent : s.muted} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const arrowP = spring({ frame: frame - (rightAt - 8), fps, config: SPRING.bouncy });
  return (
    <Background variant={s.variant}>
      {!s.dark && <CornerLogo />}
      <Camera>
        <Stage gap={40}>
          <SceneTitle text={title} accent={s.accent} marker={s.marker} />
          <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: 30 * u, width: '100%', alignItems: 'stretch', position: 'relative' }}>
            {column({ side: 'antes', data: before, at: leftAt })}
            <div style={{ display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <div
                style={{
                  width: 84 * u,
                  height: 84 * u,
                  borderRadius: '50%',
                  background: good,
                  display: 'grid',
                  placeItems: 'center',
                  transform: `scale(${arrowP}) rotate(${vertical ? 90 : 0}deg)`,
                  boxShadow: `0 ${10 * u}px ${30 * u}px ${alpha(good, 0.4)}`,
                }}
              >
                <LineIcon name="arrow" size={44 * u} color={C.onAccent} strokeWidth={2.6} />
              </div>
            </div>
            {column({ side: 'depois', data: after, at: rightAt })}
          </div>
        </Stage>
      </Camera>
      <Sfx name="pop" at={leftAt} volume={0.2} />
      <Sfx name="whoosh" at={rightAt - 8} volume={0.22} />
      <Sfx name="chime" at={rightAt + 4} volume={0.3} />
    </Background>
  );
};

/* ---------- Número em destaque ---------- */

const splitNumber = (value: string) => {
  const m = value.match(/^(.*?)(\d+(?:[.,]\d+)*)(.*)$/);
  if (!m) return null;
  const [, pre, num, post] = m;
  // "1.200" (milhar pt-BR) vs "2,5" (decimal)
  const dec = num.includes(',') ? num.split(',')[1].length : 0;
  const n = Number(num.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? { pre, post, n, dec, thousands: /\.\d{3}/.test(num) } : null;
};

const formatNumber = (n: number, dec: number, thousands: boolean) => {
  const s = n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: thousands });
  return s;
};

export const BigNumber: React.FC<Of<'bignumber'>> = ({ value, label, context, trend, icon, surface, tint, frames }) => {
  const s = useSurface(surface, tint);
  const { fonts } = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, vertical, width, height } = useLayout();
  const count = tween(frame, 10, Math.min(50, frames * 0.35), EASE.out);
  const pop = spring({ frame: frame - 6, fps, config: SPRING.heavy });
  const v = splitNumber(value);
  const shown = v ? `${v.pre}${formatNumber(v.n * count, v.dec, v.thousands)}${v.post}` : value;
  const labelAt = 34;
  const ringR = Math.min(width, height) * (vertical ? 0.42 : 0.4);
  const ring = tween(frame, 8, 60, EASE.inOut);
  const arrow = trend === 'sobe' ? 'up' : trend === 'desce' ? 'down' : icon;
  const big = (value.length > 7 ? 180 : value.length > 5 ? 220 : 270) * u;
  return (
    <Background variant={s.variant}>
      {!s.dark && <CornerLogo />}
      {/* Anel que se fecha atrás do número. */}
      <AbsoluteFill style={{ display: 'grid', placeItems: 'center' }}>
        <svg width={ringR * 2 + 40 * u} height={ringR * 2 + 40 * u} style={{ opacity: 0.9 }}>
          <circle cx={ringR + 20 * u} cy={ringR + 20 * u} r={ringR} fill="none" stroke={s.line} strokeWidth={4 * u} />
          <circle
            cx={ringR + 20 * u}
            cy={ringR + 20 * u}
            r={ringR}
            fill="none"
            stroke={s.fill}
            strokeWidth={10 * u}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 * (1 - ring * 0.78)}
            transform={`rotate(-90 ${ringR + 20 * u} ${ringR + 20 * u})`}
          />
        </svg>
      </AbsoluteFill>
      <Shockwave at={16} color={s.fill} count={1} />
      <Camera zoom={0.035}>
        <Stage center gap={18}>
          <div
            style={{
              width: 96 * u,
              height: 96 * u,
              borderRadius: '50%',
              background: s.fill,
              display: 'grid',
              placeItems: 'center',
              transform: `scale(${spring({ frame: frame - 2, fps, config: SPRING.bouncy })})`,
              boxShadow: `0 ${12 * u}px ${30 * u}px ${alpha(s.fill, 0.4)}`,
            }}
          >
            <LineIcon name={arrow} size={50 * u} color={s.onFill} draw={tween(frame, 8, 18)} strokeWidth={2.4} />
          </div>
          <div
            style={{
              fontSize: big,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -6 * u,
              fontFamily: fonts.heading,
              color: s.accent,
              transform: `scale(${0.7 + 0.3 * pop})`,
              opacity: Math.min(1, pop * 2),
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {shown}
          </div>
          <KineticText
            text={label}
            delay={labelAt}
            stagger={2}
            accent={s.accent}
            marker={s.marker}
            style={{ fontSize: 50 * u, fontWeight: 800, lineHeight: 1.15, maxWidth: 1200 * u, fontFamily: fonts.heading, color: s.fg }}
          />
          {context && (
            <div style={{ fontSize: 32 * u, lineHeight: 1.4, maxWidth: 1000 * u, color: s.muted, fontWeight: 500, opacity: tween(frame, textEnd(label, labelAt, 2), 18) }}>
              <Rich text={context} accent={s.accent} />
            </div>
          )}
        </Stage>
      </Camera>
      <Sfx name="tick" at={12} volume={0.2} />
      <Sfx name="chime" at={10 + Math.min(50, frames * 0.35)} volume={0.32} />
    </Background>
  );
};

/* ---------- Grade de ícones ---------- */

export const IconGrid: React.FC<Of<'icongrid'>> = ({ title, items, surface, tint, frames }) => {
  const s = useSurface(surface, tint);
  const { accents, C, radius, fonts } = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, vertical } = useScale();
  const { square } = useLayout();
  const first = firstAfterTitle(title);
  const step = stepFor(frames, first, items.length, 5, 12);
  const cols = vertical ? 2 : square ? Math.min(3, items.length <= 4 ? 2 : 3) : items.length === 4 ? 4 : Math.min(3, items.length);
  const withText = items.some((i) => i.text);
  return (
    <Background variant={s.variant}>
      {!s.dark && <CornerLogo />}
      <Camera>
        <Stage gap={44} center={!withText}>
          <SceneTitle text={title} accent={s.accent} marker={s.marker} center={!withText} />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 28 * u, width: '100%' }}>
            {items.map((it, i) => {
              const d = first + i * step;
              const p = spring({ frame: frame - d, fps, config: SPRING.bouncy });
              const color = tint === 'primaria' && !s.dark ? accents[i % accents.length] : s.fill;
              return (
                <div
                  key={i}
                  style={{
                    background: s.card,
                    borderRadius: radius(26) * u,
                    padding: `${34 * u}px ${30 * u}px`,
                    boxShadow: s.dark ? 'none' : `0 ${16 * u}px ${40 * u}px ${s.shadow}`,
                    border: s.dark ? `${1.5 * u}px solid ${s.line}` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: withText ? 'flex-start' : 'center',
                    textAlign: withText ? 'left' : 'center',
                    gap: 18 * u,
                    opacity: Math.min(1, p * 1.6),
                    transform: `translateY(${(1 - p) * 50 * u}px) scale(${0.85 + 0.15 * p})`,
                  }}
                >
                  <div
                    style={{
                      width: 88 * u,
                      height: 88 * u,
                      borderRadius: radius(24) * u,
                      background: color,
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: `0 ${10 * u}px ${24 * u}px ${alpha(color, 0.35)}`,
                    }}
                  >
                    <LineIcon name={it.icon} size={48 * u} color={C.onColor(color)} draw={tween(frame, d + 4, 16)} strokeWidth={2.2} />
                  </div>
                  <div style={{ fontSize: 36 * u, fontWeight: 800, lineHeight: 1.15, fontFamily: fonts.heading, color: s.fg }}>
                    <Rich text={it.label} accent={s.accent} />
                  </div>
                  {it.text && (
                    <div style={{ fontSize: 26 * u, lineHeight: 1.35, color: s.muted, fontWeight: 500 }}>
                      <Rich text={it.text} accent={s.accent} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Stage>
      </Camera>
      {items.map((_, i) => (
        <Sfx key={i} name="pop" at={first + i * step} volume={0.18} />
      ))}
    </Background>
  );
};

/* ---------- Frase de impacto ---------- */

export const Statement: React.FC<Of<'statement'>> = ({ kicker, text, surface, tint }) => {
  const s = useSurface(surface, tint);
  const { fonts } = useBrand();
  const frame = useCurrentFrame();
  const { u, vertical } = useLayout();
  const words = text.replace(/\*/g, '').split(/\s+/).length;
  const size = (words <= 5 ? 150 : words <= 9 ? 116 : words <= 14 ? 92 : 74) * u * (vertical ? 0.85 : 1);
  const start = kicker ? 16 : 6;
  const end = textEnd(text, start, 3.2);
  const sweep = tween(frame, end - 4, 22, EASE.inOut);
  return (
    <Background variant={s.variant}>
      {!s.dark && <CornerLogo />}
      <Camera zoom={0.06}>
        <Stage center gap={34}>
          {kicker && (
            <Eyebrow delay={0} dark={s.dark} color={s.dark ? '#FFFFFF' : s.accent}>
              {kicker}
            </Eyebrow>
          )}
          <KineticText
            text={text}
            delay={start}
            stagger={3.2}
            accent={s.accent}
            marker={s.marker}
            style={{ fontSize: size, fontWeight: 900, lineHeight: 1.04, letterSpacing: -3 * u, maxWidth: 1600 * u, fontFamily: fonts.heading, color: s.fg }}
          />
          <div style={{ width: 260 * u, height: 10 * u, borderRadius: 5 * u, background: s.fill, transform: `scaleX(${sweep})` }} />
        </Stage>
      </Camera>
      <Sfx name="whoosh" at={start - 2} volume={0.18} />
      <Sfx name="pop" at={end - 4} volume={0.2} />
    </Background>
  );
};

/* ---------- Depoimento ---------- */

export const Testimonial: React.FC<Of<'testimonial'>> = ({ quote, author, role, surface, tint }) => {
  const s = useSurface(surface, tint);
  const { fonts, radius } = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, vertical } = useScale();
  const qP = spring({ frame, fps, config: SPRING.bouncy });
  const end = textEnd(quote, 10, 1.6);
  const who = spring({ frame: frame - end + 6, fps, config: SPRING.snappy });
  const initials = author
    .replace(/\*/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  const long = quote.length > 140;
  return (
    <Background variant={s.variant}>
      {!s.dark && <CornerLogo />}
      <Camera>
        <Stage gap={36}>
          <div style={{ fontSize: 260 * u, lineHeight: 0.6, height: 110 * u, fontWeight: 900, color: s.fill, fontFamily: 'Georgia, serif', transform: `scale(${qP})`, transformOrigin: 'left top' }}>
            “
          </div>
          <KineticText
            text={quote}
            delay={10}
            stagger={1.6}
            accent={s.accent}
            marker={s.marker}
            style={{ fontSize: (long ? 50 : vertical ? 58 : 66) * u, fontWeight: 700, lineHeight: 1.22, maxWidth: 1500 * u, fontFamily: fonts.heading, color: s.fg, letterSpacing: -0.8 * u }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 * u, opacity: Math.min(1, who * 1.4), transform: `translateY(${(1 - who) * 30 * u}px)` }}>
            <div
              style={{
                width: 84 * u,
                height: 84 * u,
                borderRadius: radius(42) * u,
                background: s.fill,
                color: s.onFill,
                display: 'grid',
                placeItems: 'center',
                fontSize: 32 * u,
                fontWeight: 800,
                fontFamily: fonts.heading,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 34 * u, fontWeight: 800, color: s.fg }}>{author.replace(/\*/g, '')}</div>
              {role && <div style={{ fontSize: 26 * u, color: s.muted, fontWeight: 500, marginTop: 2 * u }}>{role.replace(/\*/g, '')}</div>}
            </div>
          </div>
        </Stage>
      </Camera>
      <Sfx name="pop" at={2} volume={0.18} />
      <Sfx name="click" at={end - 6} volume={0.2} />
    </Background>
  );
};
