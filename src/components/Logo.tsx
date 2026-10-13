import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { EASE, SPRING, tween } from '../motion/core';
import { usaLogoFrenty, useBrand } from '../brand';
import { FrentyLogo } from './FrentyLogo';

// Logo da marca. Com arquivo enviado no perfil, usa o arquivo (com revelação animada);
// sem arquivo, a marca Frenty usa a logo oficial vetorizada e as outras marcas ganham o símbolo
// desenhado (anel com três pontos) e a palavra do logotipo: o anel se desenha, os pontos caem e as letras sobem.
export const Logo: React.FC<{ size: number; variant?: 'dark' | 'light'; delay?: number; animate?: boolean; glow?: boolean }> = ({
  size,
  variant = 'light',
  delay = 0,
  animate = true,
  glow = false,
}) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const { brand, C, fonts } = useBrand();
  const f = animate ? frame : 1000;
  const dark = variant === 'dark';
  const color = dark ? '#FFFFFF' : C.primaryOnLight;
  const pulse = glow ? interpolate(f, [30, 42, 60], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;

  const file = dark ? brand.logo.arquivoEscuro ?? brand.logo.arquivoClaro : brand.logo.arquivoClaro ?? brand.logo.arquivoEscuro;
  if (file) {
    // Sem versão para fundo escuro, o logo claro vira silhueta branca.
    const silhouette = dark && !brand.logo.arquivoEscuro;
    const p = spring({ frame: f, fps, config: SPRING.snappy });
    const wipe = tween(f, 4, 22, EASE.out);
    return (
      <Img
        src={file}
        style={{
          height: size * 1.1,
          maxWidth: size * 7,
          objectFit: 'contain',
          transform: `scale(${0.85 + 0.15 * p})`,
          opacity: Math.min(1, p * 2),
          clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
          filter: [silhouette ? 'brightness(0) invert(1)' : '', pulse ? `drop-shadow(0 0 ${size * 0.2 * pulse}px ${C.accent})` : '']
            .filter(Boolean)
            .join(' ') || undefined,
        }}
      />
    );
  }

  if (usaLogoFrenty(brand)) {
    return <FrentyLogo height={size} variant={dark ? 'escuro' : 'claro'} corEscura={C.primaryDeep} delay={delay} animate={animate} brilho={glow} />;
  }

  const ring = tween(f, 0, 22, EASE.out);
  const CIRC = 2 * Math.PI * 42;
  const dot = (i: number) => spring({ frame: f - 12 - i * 4, fps, config: SPRING.bouncy });
  const letters = brand.logo.texto.split('');
  const wordDelay = brand.logo.simbolo ? 14 : 2;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.26 }}>
      {brand.logo.simbolo && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={{ overflow: 'visible', filter: pulse ? `drop-shadow(0 0 ${size * 0.25 * pulse}px ${C.accent})` : undefined }}
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - ring)}
            transform={`rotate(${-90 - (1 - ring) * 120} 50 50)`}
          />
          {[0, 1, 2].map((i) => {
            const d = dot(i);
            return (
              <circle
                key={i}
                cx="36"
                cy={31 + i * 19 - (1 - Math.min(1, d)) * 18}
                r={7.5 * Math.max(0, d)}
                fill={i === 1 ? C.accent : color}
              />
            );
          })}
        </svg>
      )}
      <span
        style={{
          fontFamily: fonts.logo,
          fontWeight: 900,
          fontSize: size * 0.95,
          letterSpacing: -size * 0.02,
          color,
          lineHeight: 1,
          marginTop: -size * 0.08,
          display: 'inline-flex',
          overflow: 'hidden',
          padding: `${size * 0.05}px 0 ${size * 0.2}px`,
          marginBottom: -size * 0.15,
          whiteSpace: 'pre',
        }}
      >
        {letters.map((l, i) => {
          const p = spring({ frame: f - wordDelay - i * 2, fps, config: SPRING.snappy });
          return (
            <span key={i} style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)` }}>
              {l}
            </span>
          );
        })}
      </span>
    </div>
  );
};

// Assistente IAF: robô amigável em balão de fala roxo/azul. Pisca e acena a antena.
export const IafBot: React.FC<{ size: number; talking?: boolean }> = ({ size, talking }) => {
  const frame = useCurrentFrame();
  const { C } = useBrand();
  const blink = frame % 70 > 64 ? 0.15 : 1;
  const mouth = talking ? 4 + Math.abs(Math.sin(frame / 3)) * 6 : 8;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <defs>
        <linearGradient id="iafg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.primary} />
          <stop offset="1" stopColor={C.secondary} />
        </linearGradient>
      </defs>
      <path d="M20 10h80a14 14 0 0 1 14 14v56a14 14 0 0 1-14 14H52l-22 18v-18H20A14 14 0 0 1 6 80V24A14 14 0 0 1 20 10z" fill="url(#iafg)" />
      <g transform={`rotate(${Math.sin(frame / 8) * 8} 60 32)`}>
        <line x1="60" y1="22" x2="60" y2="32" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <circle cx="60" cy="20" r="5" fill={C.accent} />
      </g>
      <rect x="30" y="32" width="60" height="44" rx="16" fill="#fff" />
      <ellipse cx="47" cy="52" rx="6" ry={6 * blink} fill={C.primaryDeep} />
      <ellipse cx="73" cy="52" rx="6" ry={6 * blink} fill={C.primaryDeep} />
      <path d={`M49 64q11 ${mouth} 22 0`} stroke={C.primaryDeep} strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
};
