// Composição livre: a IA posiciona títulos, textos, ícones, números, selos e formas numa grade 12×12
// dentro da área segura do quadro, com a entrada e a ordem de cada elemento.
import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LineIcon } from '../components/Icons';
import { Background } from '../motion/Background';
import { Camera, EASE, SPRING, Sfx, tween, useLayout } from '../motion/core';
import { KineticText, Rich } from '../motion/KineticText';
import { useBrand } from '../brand';
import { alpha } from '../color';
import type { CompositionElement, Scene } from '../types';
import { CornerLogo, useSurface } from './shared';

const SIZE = {
  titulo: { p: 48, m: 64, g: 92, gg: 128 },
  texto: { p: 26, m: 32, g: 40, gg: 52 },
  numero: { p: 72, m: 110, g: 160, gg: 220 },
  selo: { p: 22, m: 26, g: 32, gg: 40 },
};

// Reduz a fonte até o texto caber na caixa (estimativa pela largura média dos caracteres).
const fit = (text: string, size: number, boxW: number, boxH: number, lineHeight: number, charW = 0.56) => {
  const len = text.replace(/\*/g, '').length;
  let fs = size;
  for (let i = 0; i < 30; i++) {
    const perLine = Math.max(1, Math.floor(boxW / (fs * charW)));
    const lines = Math.ceil(len / perLine);
    if (lines * fs * lineHeight <= boxH || fs <= size * 0.35) break;
    fs *= 0.92;
  }
  return fs;
};

const Element: React.FC<{ el: CompositionElement; at: number; box: { w: number; h: number }; s: ReturnType<typeof useSurface> }> = ({ el, at, box, s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { C, fonts, radius, pill } = useBrand();
  const { u } = useLayout();
  const p = spring({ frame: frame - at, fps, config: el.enter === 'escala' ? SPRING.bouncy : SPRING.snappy });
  const draw = tween(frame, at + 2, 20, EASE.out);
  const color =
    el.color === 'texto'
      ? s.fg
      : el.color === 'primaria'
        ? s.dark
          ? s.accent
          : C.primaryOnLight
        : el.color === 'secundaria'
          ? s.dark
            ? s.accent
            : C.secondary
          : s.dark
            ? s.accent
            : C.accentOnLight;
  const fillColor = el.color === 'texto' ? (s.dark ? '#FFFFFF' : C.text) : el.color === 'primaria' ? C.primary : el.color === 'secundaria' ? C.secondary : C.accent;
  const justify = el.align === 'centro' ? 'center' : el.align === 'direita' ? 'flex-end' : 'flex-start';
  const enter: React.CSSProperties =
    el.enter === 'escala'
      ? { transform: `scale(${p})`, opacity: Math.min(1, p * 2) }
      : el.enter === 'deslizar'
        ? { transform: `translateX(${(1 - p) * -80 * u}px)`, opacity: Math.min(1, p * 1.5) }
        : el.enter === 'desenhar' || el.enter === 'digitar'
          ? { opacity: 1 }
          : { transform: `translateY(${(1 - p) * 60 * u}px)`, opacity: Math.min(1, p * 1.5) };
  const wrap: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: justify, textAlign: el.align === 'centro' ? 'center' : el.align === 'direita' ? 'right' : 'left' };

  switch (el.kind) {
    case 'titulo':
    case 'texto': {
      const title = el.kind === 'titulo';
      const lh = title ? 1.08 : 1.35;
      const fs = fit(el.text, SIZE[el.kind][el.size] * u, box.w, box.h, lh);
      const style: React.CSSProperties = {
        fontSize: fs,
        lineHeight: lh,
        fontWeight: title ? 800 : 500,
        letterSpacing: title ? -1.5 * u : 0,
        fontFamily: title ? fonts.heading : fonts.body,
        color: el.color === 'texto' ? (title ? s.fg : s.muted) : color,
        maxWidth: box.w,
      };
      if (el.enter === 'digitar' || (title && el.enter === 'subir'))
        return (
          <div style={wrap}>
            <KineticText text={el.text} delay={at} stagger={title ? 2.6 : 1.4} accent={s.accent} marker={s.marker} style={style} />
          </div>
        );
      return (
        <div style={{ ...wrap, ...enter }}>
          <div style={style}>
            <Rich text={el.text} accent={s.accent} />
          </div>
        </div>
      );
    }
    case 'numero': {
      const fs = fit(el.text, SIZE.numero[el.size] * u, box.w, box.h, 1, 0.62);
      return (
        <div style={{ ...wrap, ...enter }}>
          <div style={{ fontSize: fs, lineHeight: 1, fontWeight: 900, letterSpacing: -4 * u, fontFamily: fonts.heading, color, whiteSpace: 'nowrap' }}>{el.text.replace(/\*/g, '')}</div>
        </div>
      );
    }
    case 'selo': {
      const fs = SIZE.selo[el.size] * u;
      return (
        <div style={{ ...wrap, ...enter }}>
          <div
            style={{
              fontSize: fs,
              fontWeight: 800,
              letterSpacing: 1.4 * u,
              textTransform: 'uppercase',
              padding: `${fs * 0.45}px ${fs * 0.9}px`,
              borderRadius: pill(8 * u),
              background: fillColor,
              color: C.onColor(fillColor),
              fontFamily: fonts.heading,
              whiteSpace: 'nowrap',
              boxShadow: `0 ${8 * u}px ${22 * u}px ${alpha(fillColor, 0.35)}`,
            }}
          >
            {el.text.replace(/\*/g, '')}
          </div>
        </div>
      );
    }
    case 'icone':
    case 'ilustracao': {
      const big = el.kind === 'ilustracao';
      const side = Math.min(box.w, box.h);
      return (
        <div style={{ ...wrap, ...(el.enter === 'desenhar' ? {} : enter) }}>
          {big ? (
            <div style={{ position: 'relative', width: side, height: side, display: 'grid', placeItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 30%, ${alpha(fillColor, 0.35)}, ${alpha(fillColor, 0.08)} 70%)`,
                  transform: `scale(${spring({ frame: frame - at, fps, config: SPRING.heavy })})`,
                }}
              />
              <LineIcon name={el.icon} size={side * 0.62} color={color} draw={draw} strokeWidth={1.4} />
            </div>
          ) : (
            <div
              style={{
                width: side,
                height: side,
                borderRadius: radius(side * 0.28),
                background: fillColor,
                display: 'grid',
                placeItems: 'center',
                boxShadow: `0 ${10 * u}px ${28 * u}px ${alpha(fillColor, 0.35)}`,
                transform: el.enter === 'desenhar' ? `scale(${p})` : undefined,
              }}
            >
              <LineIcon name={el.icon} size={side * 0.55} color={C.onColor(fillColor)} draw={draw} strokeWidth={2.2} />
            </div>
          )}
        </div>
      );
    }
    case 'forma': {
      // Forma decorativa: bloco de cor com cantos da marca que se expande.
      const grow = tween(frame, at, 24, EASE.out);
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: radius(28) * u,
            background: `linear-gradient(135deg, ${alpha(fillColor, s.dark ? 0.35 : 0.2)}, ${alpha(fillColor, s.dark ? 0.12 : 0.06)})`,
            border: `${2 * u}px solid ${alpha(fillColor, 0.35)}`,
            transform: `scale(${grow})`,
            transformOrigin: el.align === 'direita' ? 'right center' : el.align === 'centro' ? 'center' : 'left center',
          }}
        />
      );
    }
  }
};

export const Composition: React.FC<Extract<Scene, { type: 'composition' }>> = ({ elements, surface, frames }) => {
  const s = useSurface(surface, 'primaria');
  const { u, width, height, vertical } = useLayout();
  const padX = (vertical ? 90 : 150) * u;
  const padY = (vertical ? 220 : 110) * u;
  const cw = (width - padX * 2) / 12;
  const ch = (height - padY * 2) / 12;
  const orders = [...new Set(elements.map((e) => e.order))].sort((a, b) => a - b);
  const step = Math.max(6, Math.min(18, (frames - 60) / Math.max(1, orders.length)));
  const at = (e: CompositionElement) => 4 + orders.indexOf(e.order) * step;
  // Formas primeiro (ficam atrás), depois o resto na ordem de entrada.
  const sorted = [...elements].sort((a, b) => (a.kind === 'forma' ? -1 : 0) - (b.kind === 'forma' ? -1 : 0) || a.order - b.order);
  return (
    <Background variant={s.variant}>
      {!s.dark && <CornerLogo />}
      <Camera>
        <AbsoluteFill>
          {sorted.map((el, i) => {
            const box = { w: el.w * cw, h: el.h * ch };
            return (
              <div key={i} style={{ position: 'absolute', left: padX + el.x * cw, top: padY + el.y * ch, width: box.w, height: box.h }}>
                <Element el={el} at={at(el)} box={box} s={s} />
              </div>
            );
          })}
        </AbsoluteFill>
      </Camera>
      {orders.map((o, i) => (
        <Sfx key={o} name={i === 0 ? 'whoosh' : 'pop'} at={4 + i * step} volume={i === 0 ? 0.16 : 0.18} />
      ))}
    </Background>
  );
};
