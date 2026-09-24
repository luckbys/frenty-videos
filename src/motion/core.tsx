// Linguagem de movimento Frenty: curvas, molas, câmera, palco e efeitos sonoros.
import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Easing, Html5Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-out: entradas
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // transições
  in: Easing.bezier(0.7, 0, 0.84, 0), // saídas
  soft: Easing.bezier(0.33, 1, 0.68, 1),
};

export const SPRING = {
  smooth: { damping: 200 },
  snappy: { damping: 18, stiffness: 160, mass: 0.8 },
  bouncy: { damping: 11, stiffness: 150, mass: 0.7 },
  heavy: { damping: 26, stiffness: 90, mass: 1.2 },
};

// Unidade relativa: 1 = 1px num quadro de 1080 no menor lado.
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  return { u, width, height, vertical: height > width, square: height === width };
};

export const useSpringAt = (delay = 0, config: Parameters<typeof spring>[0]['config'] = SPRING.smooth) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

// Interpolação 0→1 entre dois quadros, com curva.
export const tween = (frame: number, start: number, duration: number, easing = EASE.out) =>
  interpolate(frame, [start, start + duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

export const mix = (p: number, a: number, b: number) => a + (b - a) * p;

/* ---------- Efeitos sonoros ---------- */

export type SfxName = 'whoosh' | 'pop' | 'tick' | 'click' | 'chime' | 'type';
const SfxOn = createContext(true);
export const SfxProvider = SfxOn.Provider;

declare global {
  interface Window {
    FRENTY_ASSET_BASE?: string;
  }
}

const sfxSrc = (name: SfxName) =>
  typeof window !== 'undefined' && window.FRENTY_ASSET_BASE ? `${window.FRENTY_ASSET_BASE}sfx/${name}.wav` : staticFile(`sfx/${name}.wav`);

const SFX_LEN: Record<SfxName, number> = { whoosh: 24, pop: 6, tick: 3, click: 4, chime: 56, type: 3 };

export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 0.3 }) => {
  const on = useContext(SfxOn);
  if (!on) return null;
  return (
    <Sequence from={Math.max(0, Math.round(at))} durationInFrames={SFX_LEN[name]} layout="none">
      <Html5Audio src={sfxSrc(name)} volume={volume} />
    </Sequence>
  );
};

/* ---------- Câmera e palco ---------- */

// Empurrão lento de câmera durante a cena, para dar profundidade.
export const Camera: React.FC<{ children: React.ReactNode; zoom?: number }> = ({ children, zoom = 0.045 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp', easing: EASE.soft });
  return <AbsoluteFill style={{ transform: `scale(${1 + zoom * p})` }}>{children}</AbsoluteFill>;
};

export const Stage: React.FC<{ children: React.ReactNode; center?: boolean; gap?: number; top?: boolean }> = ({
  children,
  center,
  gap = 40,
  top,
}) => {
  const { u, vertical } = useLayout();
  return (
    <AbsoluteFill
      style={{
        padding: vertical ? `${240 * u}px ${90 * u}px` : `${110 * u}px ${150 * u}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: top ? 'flex-start' : 'center',
        alignItems: center ? 'center' : 'flex-start',
        textAlign: center ? 'center' : 'left',
        gap: gap * u,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
