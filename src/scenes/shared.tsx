import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Logo } from '../components/Logo';
import { EASE, tween, useLayout } from '../motion/core';
import { useBrand } from '../brand';
import { alpha, ensureContrast, mix } from '../color';
import type { Surface, Tint } from '../types';

// Marca d'água no canto das cenas claras (pode ser desligada no perfil da marca).
export const CornerLogo: React.FC = () => {
  const { u } = useLayout();
  const frame = useCurrentFrame();
  const { brand } = useBrand();
  const p = tween(frame, 4, 16);
  if (!brand.estilo.marcaDagua) return null;
  return (
    <div style={{ position: 'absolute', top: 56 * u, right: 66 * u, opacity: p * 0.9, transform: `translateY(${(1 - p) * -12 * u}px)` }}>
      <Logo size={42 * u} animate={false} variant="light" />
    </div>
  );
};

// Onda circular que se expande (usada quando o logo termina de se montar).
export const Shockwave: React.FC<{ at: number; color?: string; count?: number }> = ({ at, color: colorProp, count = 2 }) => {
  const frame = useCurrentFrame();
  const { C } = useBrand();
  const color = colorProp ?? C.accent;
  const { u, width, height } = useLayout();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {new Array(count).fill(0).map((_, i) => {
        const p = tween(frame, at + i * 7, 40, EASE.out);
        if (p <= 0 || p >= 1) return null;
        const r = p * Math.max(width, height) * 0.55;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: width / 2 - r,
              top: height / 2 - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              border: `${(1 - p) * 10 * u + 1}px solid ${color}`,
              opacity: interpolate(p, [0, 0.2, 1], [0, 0.55, 0]),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Título de cena padrão (claro), na fonte de títulos da marca.
export const useTitleStyle = (): React.CSSProperties => {
  const { u } = useLayout();
  const { fonts } = useBrand();
  return { fontSize: 66 * u, fontWeight: 800, letterSpacing: -1.2 * u, lineHeight: 1.08, fontFamily: fonts.heading };
};

// Cores de uma cena conforme o fundo escolhido (claro, escuro ou cor da marca) e a cor de destaque.
export const useSurface = (surface: Surface = 'claro', tint: Tint = 'primaria') => {
  const { C } = useBrand();
  const base = { primaria: C.primary, secundaria: C.secondary, destaque: C.accent }[tint];
  if (surface === 'claro') {
    const accent = ensureContrast(base, C.background, 3);
    return {
      variant: 'light' as const,
      dark: false,
      fg: C.text,
      muted: C.textMuted,
      accent,
      fill: base,
      onFill: C.onColor(base),
      card: C.surface,
      cardFg: C.text,
      line: alpha(C.primary, 0.14),
      marker: alpha(base, 0.18),
      shadow: alpha(C.primary, 0.12),
    };
  }
  const bg = surface === 'cor' ? C.primary : C.primaryDeep;
  const fg = surface === 'cor' ? C.onColor(C.primary) : C.onDark;
  // Sobre a cor cheia da marca, o destaque não pode ser a própria primária.
  const pick = surface === 'cor' && tint === 'primaria' ? C.accent : base;
  const accent = ensureContrast(mix(pick, '#FFFFFF', 0.2), bg, 3);
  return {
    variant: surface === 'cor' ? ('color' as const) : ('dark' as const),
    dark: true,
    fg,
    muted: alpha(fg, 0.72),
    accent,
    fill: pick,
    onFill: C.onColor(pick),
    card: 'rgba(255,255,255,0.09)',
    cardFg: fg,
    line: 'rgba(255,255,255,0.18)',
    marker: alpha(pick, 0.3),
    shadow: 'rgba(0,0,0,0.25)',
  };
};
