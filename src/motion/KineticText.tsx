// Tipografia cinética: palavras sobem de trás de uma máscara; **destaques** ganham marca-texto.
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBrand } from '../brand';
import { alpha } from '../color';
import { EASE, SPRING, tween, useLayout } from './core';

const tokens = (text: string) => text.match(/\*\*[^*]+\*\*[^\s*]*|\S+/g) ?? [];

// Quadro em que a última palavra termina de entrar (para encadear animações).
export const textEnd = (text: string, delay: number, stagger = 2.5) => delay + tokens(text).length * stagger + 14;

export const KineticText: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  accent?: string;
  marker?: string;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, stagger = 2.5, accent: accentProp, marker: markerProp, style }) => {
  const frame = useCurrentFrame();
  const { C } = useBrand();
  const accent = accentProp ?? C.primaryOnLight;
  const marker = markerProp ?? alpha(C.primary, 0.16);
  const { fps } = useVideoConfig();
  const list = tokens(text);
  return (
    <div style={style}>
      {list.map((tok, i) => {
        const start = delay + i * stagger;
        const p = spring({ frame: frame - start, fps, config: SPRING.snappy });
        const bold = tok.match(/^\*\*([^*]+)\*\*(.*)$/);
        const hl = bold ? tween(frame, start + 9, 14, EASE.out) : 0;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'top',
              padding: '0.1em 0.06em 0.16em',
              margin: '-0.1em -0.06em -0.16em',
              marginRight: '0.2em',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 5}deg)`,
                transformOrigin: 'left bottom',
                position: 'relative',
                isolation: 'isolate',
              }}
            >
              {bold ? (
                <>
                  <span style={{ color: accent, fontWeight: 800, position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '-0.05em',
                        right: '-0.05em',
                        bottom: '0.06em',
                        height: '0.36em',
                        borderRadius: '0.08em',
                        background: marker,
                        transform: `scaleX(${hl})`,
                        transformOrigin: 'left',
                        zIndex: -1,
                      }}
                    />
                    {bold[1]}
                  </span>
                  {bold[2]}
                </>
              ) : (
                tok
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
};

// Destaques estáticos (para textos que não animam palavra a palavra).
export const Rich: React.FC<{ text: string; accent?: string }> = ({ text, accent }) => {
  const { C } = useBrand();
  return (
  <>
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') ? (
        <span key={i} style={{ color: accent ?? C.primaryOnLight, fontWeight: 800 }}>
          {part.slice(2, -2)}
        </span>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    )}
  </>
  );
};

// Etiqueta com os três pontos do logo, que abre uma cena.
export const Eyebrow: React.FC<{ children: React.ReactNode; color?: string; delay?: number; dark?: boolean }> = ({
  children,
  color: colorProp,
  delay = 0,
  dark,
}) => {
  const frame = useCurrentFrame();
  const { C, pill } = useBrand();
  const color = colorProp ?? C.primaryOnLight;
  const { u } = useLayout();
  const p = tween(frame, delay, 18);
  const w = tween(frame, delay + 4, 20);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14 * u,
        padding: `${10 * u}px ${22 * u}px ${10 * u}px ${16 * u}px`,
        borderRadius: pill(8 * u),
        background: dark ? 'rgba(255,255,255,0.1)' : alpha(color, 0.08),
        border: `${1.5 * u}px solid ${dark ? 'rgba(255,255,255,0.18)' : alpha(color, 0.2)}`,
        fontSize: 28 * u,
        fontWeight: 800,
        letterSpacing: 1.6 * u,
        textTransform: 'uppercase',
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 24 * u}px)`,
        clipPath: `inset(0 ${(1 - w) * 100}% 0 0 round ${pill(8 * u)}px)`,
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3 * u }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6 * u,
              height: 6 * u,
              borderRadius: '50%',
              background: i === 1 ? C.accent : color,
              transform: `scale(${tween(frame, delay + 6 + i * 3, 10)})`,
            }}
          />
        ))}
      </span>
      {children}
    </div>
  );
};
