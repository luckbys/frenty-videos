// Transições do comercial. "barras" é a assinatura: pontos que se esticam em barras arredondadas
// (o ponto e a barra do F da logo), cobrem a tela e saem revelando a próxima cena.
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import React from 'react';
import { AbsoluteFill, interpolate, useVideoConfig } from 'remotion';
import { EASE } from '../../motion/core';
import { K } from './tokens';

type NoProps = Record<string, never>;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Barras: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress: p }) => {
  const { width, height } = useVideoConfig();
  if (presentationDirection === 'exiting') {
    const s = interpolate(p, [0, 0.5], [1, 1.05], { ...clamp, easing: EASE.in });
    return <AbsoluteFill style={{ opacity: p < 0.5 ? 1 : 0, transform: `scale(${s})` }}>{children}</AbsoluteFill>;
  }
  const enter = interpolate(p, [0.5, 1], [1.07, 1], { ...clamp, easing: EASE.out });
  const h = height * 0.38;
  const bars = [
    { c: K.cyan, y: height * 0.17 },
    { c: K.purple, y: height * 0.5 },
    { c: K.deep, y: height * 0.83 },
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: p >= 0.5 ? 1 : 0, transform: `scale(${enter})` }}>{children}</AbsoluteFill>
      {bars.map((b, i) => {
        const lead = interpolate(p, [0.02 + i * 0.05, 0.4 + i * 0.03], [-h, width + h], { ...clamp, easing: EASE.inOut });
        const tail = interpolate(p, [0.52 + i * 0.03, 0.96], [-h, width + h], { ...clamp, easing: EASE.inOut });
        const w = Math.max(0, lead - tail);
        if (w <= 0) return null;
        return <div key={i} style={{ position: 'absolute', left: tail, top: b.y - h / 2, width: Math.max(w, h * 0.3), height: h, borderRadius: h / 2, background: b.c }} />;
      })}
    </AbsoluteFill>
  );
};

const Zoom: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress: p }) => {
  const e = interpolate(p, [0, 1], [0, 1], { ...clamp, easing: EASE.inOut });
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{ transform: `scale(${1 + 0.35 * e})`, filter: `blur(${e * 14}px)`, opacity: 1 - e }}>{children}</AbsoluteFill>;
  }
  return <AbsoluteFill style={{ transform: `scale(${0.82 + 0.18 * e})`, filter: e < 1 ? `blur(${(1 - e) * 14}px)` : undefined, opacity: e }}>{children}</AbsoluteFill>;
};

const Deslizar: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress: p }) => {
  const e = interpolate(p, [0, 1], [0, 1], { ...clamp, easing: EASE.inOut });
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{ transform: `translateY(${-28 * e}%) scale(${1 - 0.08 * e})`, opacity: 1 - 0.7 * e }}>{children}</AbsoluteFill>;
  }
  return (
    <AbsoluteFill style={{ transform: `translateY(${(1 - e) * 100}%)`, boxShadow: '0 -40px 90px rgba(10,4,30,0.5)', borderRadius: (1 - e) * 60, overflow: 'hidden' }}>
      {children}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 10, background: `linear-gradient(90deg, ${K.cyan}, ${K.purple})`, opacity: 1 - e }} />
    </AbsoluteFill>
  );
};

const make = (component: React.FC<TransitionPresentationComponentProps<NoProps>>) => (): TransitionPresentation<NoProps> => ({ component, props: {} });

export const barras = make(Barras);
export const zoom = make(Zoom);
export const deslizar = make(Deslizar);
