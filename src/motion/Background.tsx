// Fundo animado com os elementos da marca: aurora de cor, anéis do logo, pontos e partículas.
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { useBrand } from '../brand';
import { alpha } from '../color';
import { useLayout } from './core';

const Aurora: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const { C } = useBrand();
  const t = frame / 30;
  const blobs = dark
    ? [
        { x: 78, y: 18, r: 55, c: alpha(C.secondary, 0.42), sp: 0.21 },
        { x: 12, y: 88, r: 60, c: alpha(C.accent, 0.22), sp: 0.17 },
        { x: 30, y: 10, r: 45, c: alpha(C.primaryLight, 0.55), sp: 0.26 },
      ]
    : [
        { x: 85, y: 15, r: 45, c: alpha(C.primary, 0.13), sp: 0.2 },
        { x: 8, y: 92, r: 55, c: alpha(C.secondary, 0.12), sp: 0.16 },
        { x: 60, y: 110, r: 40, c: alpha(C.accent, 0.08), sp: 0.23 },
      ];
  return (
    <AbsoluteFill
      style={{
        background: blobs
          .map((b) => {
            const x = b.x + Math.sin(t * b.sp * 2) * 6;
            const y = b.y + Math.cos(t * b.sp * 2.4) * 5;
            return `radial-gradient(circle at ${x}% ${y}%, ${b.c} 0%, transparent ${b.r}%)`;
          })
          .join(','),
      }}
    />
  );
};

// Anéis concêntricos inspirados no símbolo do logo.
const Rings: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const { u, width, height, vertical } = useLayout();
  const { C } = useBrand();
  const stroke = dark ? 'rgba(255,255,255,0.09)' : alpha(C.primary, 0.08);
  const size = 1100 * u;
  const cx = vertical ? width * 0.85 : width * 0.9;
  const cy = vertical ? height * 0.12 : height * 0.82;
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(${cx} ${cy}) rotate(${frame * 0.15})`}>
        <circle r={size * 0.5} fill="none" stroke={stroke} strokeWidth={2 * u} />
        <circle r={size * 0.36} fill="none" stroke={stroke} strokeWidth={28 * u} />
        <circle r={size * 0.62} fill="none" stroke={stroke} strokeWidth={2 * u} strokeDasharray={`${6 * u} ${22 * u}`} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={-size * 0.12} cy={(i - 1) * size * 0.1} r={14 * u} fill={stroke} />
        ))}
      </g>
    </svg>
  );
};

const Particles: React.FC<{ dark: boolean; count?: number }> = ({ dark, count = 26 }) => {
  const frame = useCurrentFrame();
  const { width, height, u } = useLayout();
  const { C } = useBrand();
  const colors = dark ? ['#FFFFFF', C.accent, C.secondary] : [C.primary, C.secondary, C.accent];
  const ps = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => ({
        x: random(`x${i}`) * width,
        y: random(`y${i}`) * height,
        r: (2 + random(`r${i}`) * 5) * u,
        speed: 0.25 + random(`s${i}`) * 0.6,
        phase: random(`p${i}`) * Math.PI * 2,
        color: colors[i % colors.length],
      })),
    [width, height, u, count, dark, C],
  );
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity: fadeIn * (dark ? 0.7 : 0.45) }}>
      {ps.map((p, i) => {
        const y = (p.y - frame * p.speed * u * 1.2 + height * 2) % (height + 40) - 20;
        const x = p.x + Math.sin(frame / 40 + p.phase) * 20 * u;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / 25 + p.phase));
        return (
          <div
            key={i}
            style={{ position: 'absolute', left: x, top: y, width: p.r, height: p.r, borderRadius: '50%', background: p.color, opacity: tw }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const DotGrid: React.FC<{ dark: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const { u } = useLayout();
  const size = 38 * u;
  const { C } = useBrand();
  const color = dark ? 'rgba(255,255,255,0.14)' : alpha(C.primary, 0.12);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${color} ${1.6 * u}px, transparent ${1.9 * u}px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${(frame * 0.25) % size}px ${(frame * 0.4) % size}px`,
        maskImage: 'radial-gradient(ellipse at 50% 45%, black 10%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, black 10%, transparent 70%)',
      }}
    />
  );
};

export const Background: React.FC<{ variant: 'dark' | 'light' | 'color'; children: React.ReactNode }> = ({ variant, children }) => {
  const dark = variant !== 'light';
  const color = variant === 'color';
  const frame = useCurrentFrame();
  const { C, fonts, brand } = useBrand();
  // Parallax: o fundo se move devagar em sentido contrário ao empurrão da câmera.
  const drift = interpolate(frame, [0, 300], [0, -18], { extrapolateRight: 'extend' });
  return (
    <AbsoluteFill
      style={{
        background: color
          ? `radial-gradient(circle at 20% 15%, ${C.primaryLight} 0%, ${C.primary} 45%, ${C.primaryDark} 100%)`
          : dark
          ? `radial-gradient(circle at 18% 12%, ${C.primaryLight} 0%, ${C.primaryDark} 32%, ${C.primaryDeep} 78%, ${C.deepest} 100%)`
          : `linear-gradient(160deg, ${C.surface} 0%, ${C.background} 55%, ${C.tint} 100%)`,
        fontFamily: fonts.body,
        color: color ? C.onColor(C.primary) : dark ? C.onDark : C.text,
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill style={{ transform: `translate(${drift}px, ${drift * 0.4}px) scale(1.05)` }}>
        <Aurora dark={dark} />
        <Rings dark={dark} />
        <DotGrid dark={dark} />
        {brand.estilo.particulas && <Particles dark={dark} />}
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};
