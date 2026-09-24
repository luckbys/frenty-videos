// Conversa com a IAF e chamada para ação com cursor clicando.
import React from 'react';
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { IafBot } from '../components/Logo';
import { Background } from '../motion/Background';
import { Camera, EASE, SPRING, Sfx, Stage, tween, useLayout } from '../motion/core';
import { Eyebrow, KineticText, Rich, textEnd } from '../motion/KineticText';
import { useBrand } from '../brand';
import { alpha } from '../color';
import type { ChatMessage, Scene } from '../types';

/* ---------- Conversa com a IAF ---------- */

type Timed = ChatMessage & { start: number; typeStart: number; typeEnd: number };

// Agenda cada mensagem: a pessoa aparece de uma vez; a IAF "digita" e depois escreve.
function schedule(messages: ChatMessage[], frames: number): Timed[] {
  const plain = (s: string) => s.replace(/\*\*/g, '');
  const need = messages.map((m) => (m.from === 'voce' ? 14 + plain(m.text).length * 0.35 : 22 + plain(m.text).length * 0.8 + 8));
  const available = frames - 16 - 30;
  const k = Math.min(1, available / need.reduce((a, b) => a + b, 0));
  let t = 16;
  return messages.map((m, i) => {
    const start = t;
    const typeStart = m.from === 'iaf' ? start + 22 * k : start;
    const typeEnd = m.from === 'iaf' ? typeStart + plain(m.text).length * 0.8 * k : start;
    t += need[i] * k;
    return { ...m, start, typeStart, typeEnd };
  });
}

const TypingDots: React.FC<{ u: number }> = ({ u }) => {
  const { C } = useBrand();
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 8 * u, padding: `${8 * u}px ${4 * u}px` }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 14 * u,
            height: 14 * u,
            borderRadius: '50%',
            background: i === 1 ? C.accent : '#fff',
            transform: `translateY(${Math.sin((frame - i * 4) / 3.5) * -6 * u}px)`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
};

const Bubble: React.FC<{ m: Timed; maxW: number }> = ({ m, maxW }) => {
  const { C, radius } = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useLayout();
  const iaf = m.from === 'iaf';
  const p = spring({ frame: frame - m.start, fps, config: SPRING.snappy });
  if (frame < m.start) return null;
  const typing = iaf && frame < m.typeStart;
  const plain = m.text.replace(/\*\*/g, '');
  const chars = iaf ? Math.floor(interpolate(frame, [m.typeStart, m.typeEnd], [0, plain.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })) : plain.length;
  const done = chars >= plain.length;
  return (
    <div
      style={{
        alignSelf: iaf ? 'flex-start' : 'flex-end',
        maxWidth: maxW,
        background: iaf ? `linear-gradient(135deg, ${C.primary}, ${C.bubble})` : 'rgba(255,255,255,0.96)',
        color: iaf ? C.onPrimary : C.text,
        borderRadius: iaf ? `${6 * u}px ${radius(34) * u}px ${radius(34) * u}px ${radius(34) * u}px` : `${radius(34) * u}px ${6 * u}px ${radius(34) * u}px ${radius(34) * u}px`,
        padding: typing ? `${18 * u}px ${26 * u}px` : `${24 * u}px ${34 * u}px`,
        fontSize: 42 * u,
        fontWeight: 600,
        lineHeight: 1.32,
        boxShadow: `0 ${14 * u}px ${36 * u}px ${alpha(C.deepest, 0.35)}`,
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 30 * u}px) scale(${0.85 + 0.15 * p})`,
        transformOrigin: iaf ? 'top left' : 'top right',
      }}
    >
      {typing ? (
        <TypingDots u={u} />
      ) : done ? (
        <Rich text={m.text} accent={iaf ? C.accentOnDark : C.primaryOnLight} />
      ) : (
        <>
          {plain.slice(0, chars)}
          <span style={{ color: C.accent }}>▍</span>
          <span style={{ opacity: 0 }}>{plain.slice(chars)}</span>
        </>
      )}
    </div>
  );
};

export const Quote: React.FC<Extract<Scene, { type: 'quote' }>> = ({ title, messages, frames }) => {
  const { brand, C, radius } = useBrand();
  const frame = useCurrentFrame();
  const { u, vertical } = useLayout();
  const timed = schedule(messages, frames);
  const panel = spring({ frame: frame - 4, fps: 30, config: SPRING.snappy });
  const panelW = vertical ? 920 * u : 1250 * u;
  const talking = timed.some((m) => m.from === 'iaf' && frame >= m.typeStart && frame < m.typeEnd);
  return (
    <Background variant="dark">
      <Camera zoom={0.03}>
        <Stage center gap={34}>
          <Eyebrow color="#FFFFFF" delay={0} dark>
            {title ?? `Assistente ${brand.assistente}`}
          </Eyebrow>
          <div
            style={{
              width: panelW,
              borderRadius: radius(40) * u,
              background: 'rgba(255,255,255,0.08)',
              border: `${2 * u}px solid rgba(255,255,255,0.16)`,
              boxShadow: `0 ${40 * u}px ${100 * u}px ${alpha(C.deepest, 0.45)}`,
              overflow: 'hidden',
              opacity: panel,
              transform: `translateY(${(1 - panel) * 60 * u}px) scale(${0.94 + 0.06 * panel})`,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 * u, padding: `${22 * u}px ${32 * u}px`, background: 'rgba(255,255,255,0.08)' }}>
              <IafBot size={78 * u} talking={talking} />
              <div>
                <div style={{ fontSize: 34 * u, fontWeight: 800 }}>{brand.assistente}</div>
                <div style={{ fontSize: 24 * u, opacity: 0.75, display: 'flex', alignItems: 'center', gap: 10 * u }}>
                  <span style={{ width: 12 * u, height: 12 * u, borderRadius: '50%', background: C.accent, boxShadow: `0 0 ${10 * u}px ${C.accent}` }} />
                  {talking ? 'digitando…' : `assistente ${brand.nome} · online`}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 * u, padding: `${34 * u}px ${32 * u}px ${40 * u}px`, minHeight: 260 * u }}>
              {timed.map((m, i) => (
                <Bubble key={i} m={m} maxW={panelW * 0.8} />
              ))}
            </div>
          </div>
        </Stage>
      </Camera>
      {timed.map((m, i) => (
        <React.Fragment key={i}>
          <Sfx name="pop" at={m.start} volume={0.22} />
          {m.from === 'iaf' &&
            new Array(Math.min(24, Math.floor((m.typeEnd - m.typeStart) / 4))).fill(0).map((_, k) => (
              <Sfx key={k} name="type" at={m.typeStart + k * 4 + (random(`t${i}${k}`) * 2)} volume={0.06} />
            ))}
        </React.Fragment>
      ))}
    </Background>
  );
};

/* ---------- Chamada para ação ---------- */

const Cursor: React.FC<{ size: number }> = ({ size }) => {
  const { C } = useBrand();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))' }}>
      <path d="M6 3l20 12-9 2.2L13 26z" fill="#fff" stroke={C.primaryDeep} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
};

export const Cta: React.FC<Extract<Scene, { type: 'cta' }>> = ({ title, body, button, url }) => {
  const { C, fonts, pill } = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useLayout();
  const tEnd = textEnd(title, 0, 3);
  const b = tween(frame, tEnd - 4, 20);
  const btnIn = spring({ frame: frame - tEnd, fps, config: SPRING.bouncy });
  const moveStart = tEnd + 12;
  const clickAt = moveStart + 24;
  const move = tween(frame, moveStart, 24, EASE.inOut);
  const press = interpolate(frame, [clickAt - 2, clickAt + 2, clickAt + 10], [1, 0.92, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ripple = tween(frame, clickAt, 26, EASE.out);
  const shine = ((frame - tEnd) % 60) / 60;
  const urlChars = url ? Math.floor(interpolate(frame, [clickAt + 6, clickAt + 6 + url.length * 1.2], [0, url.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })) : 0;
  // O cursor sai de baixo à direita e pousa no botão, fazendo um arco.
  const cx = interpolate(move, [0, 1], [560 * u, 60 * u]);
  const cy = interpolate(move, [0, 1], [420 * u, 6 * u]) + Math.sin(move * Math.PI) * -70 * u;
  const cursorIn = tween(frame, moveStart - 6, 8);
  return (
    <Background variant="dark">
      <Camera zoom={0.03}>
        <Stage center gap={40}>
          <KineticText
            text={title}
            delay={0}
            stagger={3}
            accent={C.accent}
            marker={alpha(C.accent, 0.22)}
            style={{ fontSize: 96 * u, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 * u, maxWidth: 1500 * u, fontFamily: fonts.heading }}
          />
          {body && (
            <div style={{ fontSize: 40 * u, fontWeight: 500, maxWidth: 1200 * u, lineHeight: 1.35, opacity: 0.88 * b, transform: `translateY(${(1 - b) * 20 * u}px)` }}>
              <Rich text={body} accent={C.accentOnDark} />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 700 * u * ripple,
                height: 700 * u * ripple,
                marginLeft: -350 * u * ripple,
                marginTop: -350 * u * ripple,
                borderRadius: '50%',
                border: `${4 * u}px solid ${C.accent}`,
                opacity: ripple > 0 && ripple < 1 ? 1 - ripple : 0,
              }}
            />
            {new Array(12).fill(0).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const d = ripple * 260 * u;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 14 * u,
                    height: 14 * u,
                    borderRadius: '50%',
                    background: [C.accent, C.secondary, '#fff'][i % 3],
                    transform: `translate(${Math.cos(a) * d * 1.6 - 7 * u}px, ${Math.sin(a) * d - 7 * u}px) scale(${1 - ripple})`,
                    opacity: ripple > 0 && ripple < 1 ? 1 : 0,
                  }}
                />
              );
            })}
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: C.accent,
                color: C.onAccent,
                fontSize: 48 * u,
                fontWeight: 800,
                fontFamily: fonts.heading,
                padding: `${30 * u}px ${72 * u}px`,
                borderRadius: pill(12 * u),
                boxShadow: `0 0 ${60 * u}px ${alpha(C.accent, 0.5)}, 0 ${14 * u}px ${30 * u}px rgba(0,0,0,0.25)`,
                transform: `scale(${btnIn * press})`,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '30%',
                  left: `${-40 + shine * 180}%`,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                  transform: 'skewX(-20deg)',
                }}
              />
              <span style={{ position: 'relative' }}>{button} →</span>
            </div>
            <div style={{ position: 'absolute', left: '50%', top: '50%', opacity: cursorIn, transform: `translate(${cx}px, ${cy}px) scale(${press})`, zIndex: 2 }}>
              <Cursor size={64 * u} />
            </div>
          </div>
          {url && (
            <div style={{ fontSize: 34 * u, fontWeight: 600, opacity: 0.85, letterSpacing: 1 * u, minHeight: 44 * u }}>
              {url.slice(0, urlChars)}
              {urlChars > 0 && urlChars < url.length && <span style={{ color: C.accent }}>▍</span>}
            </div>
          )}
        </Stage>
      </Camera>
      <Sfx name="pop" at={tEnd + 2} volume={0.25} />
      <Sfx name="click" at={clickAt - 1} volume={0.5} />
      <Sfx name="chime" at={clickAt + 2} volume={0.18} />
    </Background>
  );
};
