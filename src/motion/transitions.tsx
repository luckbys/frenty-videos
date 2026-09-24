// Transições próprias da marca para o TransitionSeries.
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import React from 'react';
import { AbsoluteFill, interpolate, useVideoConfig } from 'remotion';
import { useBrand } from '../brand';
import { alpha } from '../color';
import { EASE } from './core';

type NoProps = Record<string, never>;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Três faixas diagonais (roxo, azul, verde) atravessam a tela e trocam a cena por trás delas.
const Bars: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress: p }) => {
  const { C } = useBrand();
  const { width, height } = useVideoConfig();
  if (presentationDirection === 'exiting') {
    const s = interpolate(p, [0, 0.5], [1, 1.06], { ...clamp, easing: EASE.in });
    return <AbsoluteFill style={{ opacity: p < 0.5 ? 1 : 0, transform: `scale(${s})` }}>{children}</AbsoluteFill>;
  }
  const enter = interpolate(p, [0.5, 1], [1.08, 1], { ...clamp, easing: EASE.out });
  const skew = Math.atan((height * 0.35) / width) * (180 / Math.PI);
  const bars = [C.secondary, C.accent, C.primary];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: p >= 0.5 ? 1 : 0, transform: `scale(${enter})` }}>{children}</AbsoluteFill>
      {bars.map((color, i) => {
        // A faixa do topo (roxa) fica exatamente no centro em p = 0.5, cobrindo a troca de cena.
        const lead = (2 - i) * 0.07;
        const x = interpolate(p, [-lead, 0.5 - lead, 1 - lead], [-120, 0, 120], { ...clamp, easing: EASE.inOut });
        return (
          <AbsoluteFill
            key={i}
            style={{
              left: '-60%',
              width: '220%',
              background: i === 2 ? `linear-gradient(90deg, ${C.primaryDeep}, ${color} 40%, ${color} 60%, ${C.primaryDeep})` : color,
              transform: `translateX(${x}%) skewX(${-skew}deg)`,
              transformOrigin: 'center',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Círculo que se abre do centro, com o anel do logo na borda.
const Ring: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress: p }) => {
  const { C } = useBrand();
  const { width, height } = useVideoConfig();
  const e = interpolate(p, [0, 1], [0, 1], { ...clamp, easing: EASE.inOut });
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{ transform: `scale(${1 - 0.08 * e})`, filter: `brightness(${1 - 0.35 * e})` }}>{children}</AbsoluteFill>
    );
  }
  const maxR = Math.hypot(width, height) / 2 + 40;
  const r = maxR * e;
  const ring = Math.min(width, height) * 0.035 * (1 - e * 0.6);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at 50% 50%)`, transform: `scale(${1.12 - 0.12 * e})` }}>{children}</AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: width / 2 - r - ring / 2,
          top: height / 2 - r - ring / 2,
          width: (r + ring / 2) * 2,
          height: (r + ring / 2) * 2,
          borderRadius: '50%',
          border: `${ring}px solid ${C.accent}`,
          boxShadow: `0 0 ${ring * 2}px ${alpha(C.accent, 0.55)}`,
          opacity: interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0], clamp),
        }}
      />
    </AbsoluteFill>
  );
};

// Empurra a cena para o lado com uma linha de cor na borda.
const Push: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress: p }) => {
  const { C } = useBrand();
  const e = interpolate(p, [0, 1], [0, 1], { ...clamp, easing: EASE.inOut });
  const { width } = useVideoConfig();
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{ transform: `translateX(${-30 * e}%) scale(${1 - 0.06 * e})`, opacity: 1 - 0.6 * e }}>{children}</AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ transform: `translateX(${(1 - e) * 100}%)`, boxShadow: `-40px 0 80px ${alpha(C.deepest, 0.35)}` }}>
      {children}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: width * 0.012,
          background: `linear-gradient(180deg, ${C.primary}, ${C.secondary}, ${C.accent})`,
          opacity: 1 - e,
        }}
      />
    </AbsoluteFill>
  );
};

const make = (component: React.FC<TransitionPresentationComponentProps<NoProps>>) => (): TransitionPresentation<NoProps> => ({
  component,
  props: {},
});

export const brandBars = make(Bars);
export const ringReveal = make(Ring);
export const push = make(Push);
