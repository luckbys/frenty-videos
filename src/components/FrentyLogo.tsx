import React, { useId } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { EASE, SPRING, tween } from '../motion/core';
import { BARRA, DISCO, HASTE, LETRAS, LOGO_CIANO, LOGO_CLARO, LOGO_VIEWBOX, PONTA_Y, PONTO_MEIO, PONTO_R } from './frenty-logo-data';

// Logo oficial Frenty (disco com o F de pontos + logotipo), vetorial e animada:
// o disco cresce, os pontos do F estalam um a um, a barra se estende, as letras sobem e a ponta do "y" brilha.
// `escuro` = para fundos escuros (como o arquivo oficial); `claro` = disco e letras na cor escura informada.
export type FrentyLogoProps = {
  height: number;
  variant?: 'escuro' | 'claro';
  parte?: 'completo' | 'simbolo' | 'logotipo';
  delay?: number;
  animate?: boolean;
  corEscura?: string;
  brilho?: boolean;
  style?: React.CSSProperties;
};

const SIMBOLO_X1 = DISCO.cx + DISCO.r + 0.5;
const LOGOTIPO_X0 = 325;

// Quadros (a partir do início) em que cada parte termina de entrar; útil para encadear animações.
export const FRENTY_LOGO_FIM = 46;

export const FrentyLogo: React.FC<FrentyLogoProps> = ({
  height,
  variant = 'escuro',
  parte = 'completo',
  delay = 0,
  animate = true,
  corEscura = '#2A1259',
  brilho = false,
  style,
}) => {
  const current = useCurrentFrame();
  const frame = (animate ? current : 10000) - delay;
  const { fps } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const base = variant === 'escuro' ? LOGO_CLARO : corEscura;
  const sp = (at: number, config = SPRING.bouncy) => spring({ frame: frame - at, fps, config });

  const x0 = parte === 'logotipo' ? LOGOTIPO_X0 : LOGO_VIEWBOX.x;
  const x1 = parte === 'simbolo' ? SIMBOLO_X1 : LOGO_VIEWBOX.x + LOGO_VIEWBOX.w;
  const vbW = x1 - x0;
  const width = (height * vbW) / LOGO_VIEWBOX.h;
  const showSym = parte !== 'logotipo';
  const showWord = parte !== 'simbolo';
  // Sem o símbolo, o logotipo começa logo.
  const wordAt = showSym ? 16 : 2;

  const disc = sp(0, { damping: 14, stiffness: 120, mass: 0.9 });
  const dots = [sp(8), sp(11), sp(14)];
  const mid = sp(18);
  const bar = spring({ frame: frame - 21, fps, config: SPRING.snappy });
  const tip = tween(frame, wordAt + LETRAS.length * 2.5 + 10, 10, EASE.out);
  const glow = brilho ? interpolate(frame, [wordAt + 26, wordAt + 34, wordAt + 60], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${x0} ${LOGO_VIEWBOX.y} ${vbW} ${LOGO_VIEWBOX.h}`}
      style={{ overflow: 'visible', display: 'block', filter: glow ? `drop-shadow(0 0 ${height * 0.18 * glow}px ${LOGO_CIANO})` : undefined, ...style }}
    >
      <defs>
        <clipPath id={`fl${id}`}>
          <rect x={LOGOTIPO_X0} y={LOGO_VIEWBOX.y - 30} width={520} height={LOGO_VIEWBOX.h + 60} />
        </clipPath>
      </defs>
      {showSym && (
        <g>
          <g transform={`translate(${DISCO.cx} ${DISCO.cy}) scale(${Math.max(0, disc)}) rotate(${(1 - Math.min(1, disc)) * -30}) translate(${-DISCO.cx} ${-DISCO.cy})`}>
            <circle cx={DISCO.cx} cy={DISCO.cy} r={DISCO.r} fill={base} />
          </g>
          {HASTE.map((p, i) => (
            <circle key={i} cx={p.cx} cy={p.cy - (1 - Math.min(1, dots[i])) * 14} r={PONTO_R * Math.max(0, dots[i])} fill={LOGO_CIANO} />
          ))}
          <circle cx={PONTO_MEIO.cx} cy={PONTO_MEIO.cy} r={PONTO_R * Math.max(0, mid)} fill={LOGO_CIANO} />
          {bar > 0.01 && (
            <rect
              x={BARRA.x}
              y={BARRA.y + (BARRA.h / 2) * (1 - Math.min(1, bar * 3))}
              width={Math.max(BARRA.h * Math.min(1, bar * 3), BARRA.w * Math.min(1.04, bar))}
              height={BARRA.h * Math.min(1, bar * 3)}
              rx={(BARRA.h / 2) * Math.min(1, bar * 3)}
              fill={LOGO_CIANO}
            />
          )}
        </g>
      )}
      {showWord && (
        <g clipPath={`url(#fl${id})`}>
          {LETRAS.map((l, i) => {
            const p = spring({ frame: frame - wordAt - i * 2.5, fps, config: SPRING.snappy });
            return <path key={l.letra + i} d={l.d} fill={base} fillRule="evenodd" transform={`translate(0 ${(1 - p) * 270})`} />;
          })}
          <g opacity={tip} transform={`translate(${791 + 23} ${83}) scale(${0.4 + 0.6 * tip}) translate(${-791 - 23} ${-83})`}>
            <path d={PONTA_Y} fill={LOGO_CIANO} />
          </g>
        </g>
      )}
    </svg>
  );
};
