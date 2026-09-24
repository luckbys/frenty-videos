// Abertura, encerramento e texto de impacto.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Logo } from '../components/Logo';
import { Background } from '../motion/Background';
import { Camera, EASE, Sfx, Stage, tween, useLayout } from '../motion/core';
import { Eyebrow, KineticText, textEnd } from '../motion/KineticText';
import { useBrand } from '../brand';
import { alpha } from '../color';
import type { Scene } from '../types';
import { CornerLogo, Shockwave } from './shared';

export const Intro: React.FC<Extract<Scene, { type: 'intro' }>> = ({ title, subtitle }) => {
  const { C, fonts } = useBrand();
  const frame = useCurrentFrame();
  const { u, vertical } = useLayout();
  const tStart = 26;
  const tEnd = textEnd(title, tStart, 3);
  const line = tween(frame, tEnd - 6, 20);
  const sub = tween(frame, tEnd, 22);
  return (
    <Background variant="dark">
      <Shockwave at={20} />
      <Camera>
        <Stage center gap={44}>
          <Logo size={92 * u} variant="dark" delay={2} glow />
          <KineticText
            text={title}
            delay={tStart}
            stagger={3}
            accent={C.accent}
            marker={alpha(C.accent, 0.22)}
            style={{ fontSize: (vertical ? 92 : 104) * u, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 * u, maxWidth: 1500 * u, fontFamily: fonts.heading }}
          />
          <div
            style={{
              width: 180 * u,
              height: 8 * u,
              borderRadius: 4 * u,
              background: `linear-gradient(90deg, ${C.accent}, ${C.secondary})`,
              transform: `scaleX(${line})`,
            }}
          />
          {subtitle && (
            <div
              style={{
                fontSize: 40 * u,
                fontWeight: 500,
                maxWidth: 1300 * u,
                lineHeight: 1.4,
                opacity: 0.9 * sub,
              }}
            >
              <KineticText text={subtitle} delay={tEnd} stagger={1.2} accent={C.accentOnDark} marker="transparent" />
            </div>
          )}
        </Stage>
      </Camera>
      <Sfx name="pop" at={14} volume={0.2} />
      <Sfx name="chime" at={20} volume={0.35} />
    </Background>
  );
};

export const Outro: React.FC<Extract<Scene, { type: 'outro' }>> = ({ slogan: sloganProp, url: urlProp }) => {
  const { brand, C, pill } = useBrand();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { u } = useLayout();
  const slogan = sloganProp || brand.slogan;
  const url = urlProp || brand.site || undefined;
  const urlIn = tween(frame, 48, 18);
  const fade = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Background variant="dark">
      <Shockwave at={22} count={3} />
      <Camera zoom={0.03}>
        <Stage center gap={46}>
          <Logo size={150 * u} variant="dark" delay={4} glow />
          {slogan && (
            <KineticText
              text={slogan}
              delay={34}
              stagger={1.8}
              style={{ fontSize: 44 * u, fontWeight: 600, maxWidth: 1200 * u, lineHeight: 1.35, opacity: 0.92 }}
            />
          )}
          {url && (
            <div
              style={{
                fontSize: 30 * u,
                fontWeight: 700,
                letterSpacing: 1 * u,
                padding: `${12 * u}px ${28 * u}px`,
                borderRadius: pill(8 * u),
                background: 'rgba(255,255,255,0.1)',
                border: `${1.5 * u}px solid rgba(255,255,255,0.22)`,
                opacity: urlIn,
                transform: `translateY(${(1 - urlIn) * 20 * u}px)`,
              }}
            >
              {url}
            </div>
          )}
        </Stage>
      </Camera>
      <AbsoluteFill style={{ background: C.primaryDeep, opacity: fade }} />
      <Sfx name="chime" at={22} volume={0.45} />
    </Background>
  );
};

export const Text: React.FC<Extract<Scene, { type: 'text' }>> = ({ title, body }) => {
  const { C, fonts } = useBrand();
  const frame = useCurrentFrame();
  const { u, vertical } = useLayout();
  const long = body.length > 140;
  const bar = tween(frame, 6, 26, EASE.out);
  return (
    <Background variant="light">
      <CornerLogo />
      <Camera>
        <Stage gap={40}>
          {title && <Eyebrow delay={2}>{title}</Eyebrow>}
          <div style={{ display: 'flex', gap: 40 * u, alignItems: 'stretch' }}>
            <div
              style={{
                width: 10 * u,
                borderRadius: 5 * u,
                flexShrink: 0,
                background: `linear-gradient(180deg, ${C.primary}, ${C.secondary}, ${C.accent})`,
                transform: `scaleY(${bar})`,
                transformOrigin: 'top',
              }}
            />
            <KineticText
              text={body}
              delay={10}
              stagger={2.2}
              style={{ fontSize: (long ? 58 : vertical ? 74 : 84) * u, fontWeight: 700, lineHeight: 1.16, maxWidth: 1450 * u, letterSpacing: -1 * u, fontFamily: fonts.heading }}
            />
          </div>
        </Stage>
      </Camera>
      <Sfx name="pop" at={4} volume={0.18} />
    </Background>
  );
};
