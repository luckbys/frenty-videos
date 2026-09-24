import './fonts';
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { BrandProvider, useBrand } from './brand';
import { CustomIconsProvider } from './components/Icons';
import { Sfx, SfxProvider } from './motion/core';
import { brandBars, push, ringReveal } from './motion/transitions';
import { SceneView } from './scenes';
import { theme } from './theme';
import type { Rhythm, Scene, VideoSpec } from './types';

// Escolhe a transição de entrada de cada cena: o anel do logo abre e fecha o vídeo;
// no meio, alterna faixas de cor e empurrão. No ritmo calmo só empurrão; no enérgico, faixas
// sempre que a cena seguinte for de impacto.
const IMPACT = new Set<Scene['type']>(['statement', 'bignumber', 'cta']);
const transitionFor = (next: Scene, i: number, rhythm: Rhythm) => {
  if (i === 0 || next.type === 'outro') return ringReveal();
  if (rhythm === 'calmo') return push();
  if (rhythm === 'energico' && IMPACT.has(next.type)) return brandBars();
  return i % 2 ? brandBars() : push();
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, height } = useVideoConfig();
  const { brand, C } = useBrand();
  if (!brand.estilo.barraProgresso) return null;
  const h = Math.max(6, height / 180);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: h,
        width: `${interpolate(frame, [0, durationInFrames - 1], [0, 100])}%`,
        background: `linear-gradient(90deg, ${C.primary}, ${C.secondary}, ${C.accent})`,
      }}
    />
  );
};

// Segura a renderização até as fontes escolhidas no perfil estarem carregadas.
const useBrandFonts = () => {
  const { brand } = useBrand();
  const names = [...new Set([brand.fontes.titulos, brand.fontes.texto, brand.fontes.logo])].join('|');
  const [handle] = useState(() => delayRender('Carregando fontes da marca'));
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) (done = true), continueRender(handle);
    };
    const loads = names.split('|').flatMap((n) => [500, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px "${n}"`, 'Aa')));
    Promise.allSettled(loads).then(finish);
    const t = setTimeout(finish, 8000);
    return () => clearTimeout(t);
  }, [handle, names]);
};

const Frames: React.FC<{ scenes: Scene[]; rhythm: Rhythm }> = ({ scenes, rhythm }) => {
  useBrandFonts();
  const { C, fonts } = useBrand();
  const t = theme.video.transitionFrames;
  const starts: number[] = [];
  scenes.reduce((acc, s) => (starts.push(acc), acc + s.frames - t), 0);
  return (
    <AbsoluteFill style={{ background: C.primaryDeep, fontFamily: fonts.body }}>
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const els = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={scene.frames}>
              <SceneView scene={scene} />
            </TransitionSeries.Sequence>,
          ];
          if (i < scenes.length - 1) {
            els.push(
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={transitionFor(scenes[i + 1], i, rhythm)}
                timing={linearTiming({ durationInFrames: t })}
              />,
            );
          }
          return els;
        })}
      </TransitionSeries>
      <ProgressBar />
      {starts.slice(1).map((s, i) => (
        <Sfx key={i} name="whoosh" at={s - 4} volume={0.28} />
      ))}
    </AbsoluteFill>
  );
};

export const FrentyVideo: React.FC<VideoSpec> = ({ scenes, sfx = true, brand, icons, rhythm = 'equilibrado' }) => (
  <BrandProvider brand={brand}>
    <SfxProvider value={sfx}>
      <CustomIconsProvider icons={icons}>
        <Frames scenes={scenes} rhythm={rhythm} />
      </CustomIconsProvider>
    </SfxProvider>
  </BrandProvider>
);
