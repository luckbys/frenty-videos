// Cena "interface": uma tela de produto no estilo shadcn/ui dentro de um navegador, janela de app ou celular,
// com motion design: a tela entra em 3D, os cartões sobem em sequência, o cursor clica e digita,
// a câmera aproxima do que importa e notificações aparecem por cima.
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LineIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { Background } from '../motion/Background';
import { EASE, SPRING, Sfx, tween, useLayout } from '../motion/core';
import { KineticText, textEnd } from '../motion/KineticText';
import { useBrand } from '../brand';
import { alpha } from '../color';
import type { FormatName } from '../theme';
import type { Scene } from '../types';
import { cameraKeys, keyed, nativeSize, scrollKeys, uiGeometry, uiTimeline, type Timed, type UiGeometry } from '../ui/geometry';
import { Block, Toast, useUiTokens, type Tokens } from '../ui/kit';
import { useSurface, useTitleStyle } from './shared';

type Of<T extends Scene['type']> = Extract<Scene, { type: T }>;

/* ---------- Molduras ---------- */

const TrafficLights: React.FC = () => (
  <div style={{ display: 'flex', gap: 8 }}>
    {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
      <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
    ))}
  </div>
);

const BrowserBar: React.FC<{ t: Tokens; url: string; h: number }> = ({ t, url, h }) => (
  <div style={{ height: h, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', background: t.sidebar, borderBottom: `1px solid ${t.border}` }}>
    <TrafficLights />
    <div style={{ display: 'flex', gap: 10, opacity: 0.55 }}>
      <LineIcon name="arrow" size={16} color={t.mutedFg} />
      <LineIcon name="refresh" size={15} color={t.mutedFg} />
    </div>
    <div
      style={{
        flex: 1,
        maxWidth: 560,
        margin: '0 auto',
        height: 28,
        borderRadius: 8,
        background: t.dark ? alpha('#FFFFFF', 0.06) : t.muted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        fontSize: 13,
        color: t.mutedFg,
      }}
    >
      <LineIcon name="lock" size={13} color={t.mutedFg} />
      {url}
    </div>
    <div style={{ width: 90 }} />
  </div>
);

const AppBar: React.FC<{ t: Tokens; name: string; h: number }> = ({ t, name, h }) => (
  <div style={{ height: h, display: 'flex', alignItems: 'center', padding: '0 14px', background: t.sidebar, borderBottom: `1px solid ${t.border}`, position: 'relative' }}>
    <TrafficLights />
    <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 13, fontWeight: 600, color: t.mutedFg }}>{name}</div>
  </div>
);

const StatusBar: React.FC<{ t: Tokens; h: number }> = ({ t, h }) => (
  <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 30px 0', fontSize: 15, fontWeight: 650, color: t.fg }}>
    <span>9:41</span>
    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <LineIcon name="wifi" size={16} color={t.fg} strokeWidth={2.4} />
      <span style={{ width: 24, height: 11, borderRadius: 3, border: `1.5px solid ${t.fg}`, padding: 1.5, boxSizing: 'border-box' }}>
        <span style={{ display: 'block', height: '100%', width: '75%', background: t.fg, borderRadius: 1 }} />
      </span>
    </span>
  </div>
);

/* ---------- Estrutura do app ---------- */

const Sidebar: React.FC<{ t: Tokens; geo: UiGeometry; scene: Of<'ui'>; active: number }> = ({ t, geo, scene, active }) => {
  const frame = useCurrentFrame();
  const { brand } = useBrand();
  const brandInitial = (brand.logo.texto || brand.nome).trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: geo.chrome,
        bottom: 0,
        width: geo.sidebar,
        background: t.sidebar,
        borderRight: `1px solid ${t.border}`,
        padding: geo.compact ? '16px 10px' : '18px 14px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: geo.compact ? 'center' : 'flex-start', padding: geo.compact ? 0 : '0 8px', marginBottom: 14, overflow: 'hidden' }}>
        {geo.compact ? (
          <div style={{ width: 34, height: 34, borderRadius: t.rs, background: t.primary, color: t.primaryFg, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 17, fontFamily: t.heading }}>
            {brandInitial}
          </div>
        ) : (
          <Logo size={22} animate={false} variant={t.dark ? 'dark' : 'light'} />
        )}
      </div>
      {!geo.compact && <div style={{ fontSize: 12, fontWeight: 600, color: t.mutedFg, padding: '0 10px 6px' }}>Menu</div>}
      {scene.menu.map((m, i) => {
        const on = i === active;
        const p = tween(frame, 8 + i * 2, 12);
        return (
          <div
            key={i}
            style={{
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: geo.compact ? 'center' : 'flex-start',
              gap: 11,
              padding: geo.compact ? 0 : '0 10px',
              borderRadius: t.rs,
              background: on ? t.accent : 'transparent',
              color: on ? t.accentFg : t.mutedFg,
              fontSize: 14,
              fontWeight: on ? 650 : 550,
              opacity: p,
              transform: `translateX(${(1 - p) * -10}px)`,
            }}
          >
            <LineIcon name={m.icon} size={18} color={on ? t.accentFg : t.mutedFg} />
            {!geo.compact && m.label}
          </div>
        );
      })}
    </div>
  );
};

const Header: React.FC<{ t: Tokens; geo: UiGeometry; scene: Of<'ui'>; brandName: string }> = ({ t, geo, scene, brandName }) => {
  const frame = useCurrentFrame();
  const p = tween(frame, 6, 16);
  if (geo.mobile)
    return (
      <div style={{ position: 'absolute', top: geo.chrome, left: 0, right: 0, height: geo.header, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12 }}>
        <div style={{ flex: 1, fontSize: 24, fontWeight: 750, letterSpacing: -0.5, fontFamily: t.heading, opacity: p, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {scene.screen || brandName}
        </div>
        <div style={{ position: 'relative' }}>
          <LineIcon name="alert" size={22} color={t.mutedFg} />
        </div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.accent, display: 'grid', placeItems: 'center' }}>
          <LineIcon name="users" size={17} color={t.accentFg} />
        </div>
      </div>
    );
  return (
    <div
      style={{
        position: 'absolute',
        top: geo.chrome,
        left: geo.sidebar,
        right: 0,
        height: geo.header,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 24px',
        borderBottom: `1px solid ${t.border}`,
        background: t.bg,
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: t.mutedFg, opacity: p, whiteSpace: 'nowrap' }}>
        {!geo.compact && (
          <>
            {brandName}
            <span style={{ opacity: 0.5 }}>/</span>
          </>
        )}
        <span style={{ color: t.fg, fontWeight: 650, fontSize: 16 }}>{scene.screen || 'Painel'}</span>
      </div>
      {!geo.compact && (
        <div style={{ width: 220, height: 34, borderRadius: t.rs, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', fontSize: 13, color: t.mutedFg }}>
          <LineIcon name="search" size={15} color={t.mutedFg} /> Buscar…
          <span style={{ marginLeft: 'auto', fontSize: 11, border: `1px solid ${t.border}`, borderRadius: 4, padding: '0 5px', background: t.muted }}>⌘K</span>
        </div>
      )}
      <div style={{ width: 34, height: 34, borderRadius: t.rs, border: `1px solid ${t.border}`, display: 'grid', placeItems: 'center', position: 'relative' }}>
        <LineIcon name="alert" size={16} color={t.mutedFg} />
      </div>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.accent, display: 'grid', placeItems: 'center' }}>
        <LineIcon name="users" size={16} color={t.accentFg} />
      </div>
    </div>
  );
};

const TabBar: React.FC<{ t: Tokens; geo: UiGeometry; scene: Of<'ui'>; active: number }> = ({ t, geo, scene, active }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: geo.tabbar,
      borderTop: `1px solid ${t.border}`,
      background: t.bg,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      paddingTop: 9,
    }}
  >
    {scene.menu.slice(0, 5).map((m, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: i === active ? t.accentFg : t.mutedFg, width: 70 }}>
        <LineIcon name={m.icon} size={22} color={i === active ? t.accentFg : t.mutedFg} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 70 }}>{m.label}</span>
      </div>
    ))}
  </div>
);

/* ---------- Cursor e toque ---------- */

const Pointer: React.FC<{ press: number }> = ({ press }) => (
  <svg width={26} height={30} viewBox="0 0 26 30" style={{ transform: `scale(${1 - 0.15 * press})`, transformOrigin: '3px 3px', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))' }}>
    <path d="M3 2.5v21l5.4-5.2 3.4 8.3 4-1.7-3.4-8.1H20L3 2.5z" fill="#111" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);

type Pt = { x: number; y: number };

// Onde o cursor está em cada quadro: anda em arco até cada alvo, clica e segue.
function cursorAt(frame: number, acts: Timed[], toScreen: (p: Pt, f: number) => Pt, rest: Pt) {
  const path = acts.filter((a) => a.point);
  if (!path.length) return null;
  let prev = rest;
  for (let i = 0; i < path.length; i++) {
    const a = path[i];
    const target = toScreen(a.point!, a.at);
    if (frame < a.at) {
      if (frame < a.move) return { ...prev, press: 0, a: null as Timed | null };
      const p = EASE.inOut(Math.min(1, (frame - a.move) / Math.max(1, a.at - a.move)));
      const arc = Math.sin(Math.PI * p) * Math.min(60, Math.hypot(target.x - prev.x, target.y - prev.y) * 0.18);
      return { x: prev.x + (target.x - prev.x) * p, y: prev.y + (target.y - prev.y) * p - arc, press: 0, a: null };
    }
    const next = path[i + 1];
    if (!next || frame < next.move) {
      const d = frame - a.at;
      const press = a.action.kind === 'clicar' ? (d < 4 ? d / 4 : d < 9 ? 1 - (d - 4) / 5 : 0) : 0;
      // Durante a digitação o cursor se afasta um pouco, como num computador de verdade.
      const off = a.action.kind === 'digitar' ? Math.min(1, d / 8) * 26 : 0;
      const live = toScreen(a.point!, frame);
      return { x: live.x + off, y: live.y + off, press, a };
    }
    prev = target;
  }
  return null;
}

const Cursor: React.FC<{ acts: Timed[]; geo: UiGeometry; scrollAt: (f: number) => number; t: Tokens }> = ({ acts, geo, scrollAt, t }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const toScreen = (p: Pt, f: number) => ({ x: geo.viewport.x + p.x, y: geo.viewport.y + p.y - scrollAt(f) });
  const first = acts.find((a) => a.point);
  if (!first) return null;
  const rest = { x: geo.native.w * (geo.mobile ? 0.7 : 0.82), y: geo.native.h * 0.95 };
  const c = cursorAt(frame, acts, toScreen, rest);
  if (!c) return null;
  const appear = tween(frame, first.move - 12, 12);
  const fade = 1 - tween(frame, durationInFrames - 14, 10);
  const clicks = acts.filter((a) => a.point && a.action.kind === 'clicar');
  if (geo.mobile) {
    // No celular: um toque (círculo) em vez de cursor.
    const a = acts.find((x) => x.point && frame >= x.at - 10 && frame <= x.at + 14);
    if (!a) return null;
    const pt = toScreen(a.point!, frame);
    const inP = tween(frame, a.at - 10, 8);
    const out = tween(frame, a.at + 4, 10);
    const ring = tween(frame, a.at, 14);
    return (
      <>
        <div style={{ position: 'absolute', left: pt.x - 22, top: pt.y - 22, width: 44, height: 44, borderRadius: '50%', background: 'rgba(20,20,30,0.28)', border: '2px solid rgba(255,255,255,0.8)', opacity: inP * (1 - out), transform: `scale(${1 - 0.2 * (1 - inP) - 0.12 * (ring > 0 && ring < 1 ? 1 : 0)})` }} />
        {ring > 0 && ring < 1 && <div style={{ position: 'absolute', left: pt.x - 30, top: pt.y - 30, width: 60, height: 60, borderRadius: '50%', border: `2px solid ${t.primary}`, opacity: 1 - ring, transform: `scale(${0.6 + ring})` }} />}
      </>
    );
  }
  return (
    <>
      {clicks.map((a, i) => {
        const r = tween(frame, a.at, 16);
        if (r <= 0 || r >= 1) return null;
        const pt = toScreen(a.point!, a.at);
        return <div key={i} style={{ position: 'absolute', left: pt.x - 22, top: pt.y - 22, width: 44, height: 44, borderRadius: '50%', border: `2px solid ${t.primary}`, opacity: (1 - r) * 0.8, transform: `scale(${0.4 + r})` }} />;
      })}
      <div style={{ position: 'absolute', left: c.x - 3, top: c.y - 3, opacity: appear * fade * (c.a?.action.kind === 'digitar' ? 0.7 : 1) }}>
        <Pointer press={c.press} />
      </div>
    </>
  );
};

/* ---------- Cena ---------- */

const formatOf = (w: number, h: number): FormatName => (h > w ? 'vertical' : h === w ? 'quadrado' : 'horizontal');

export const Interface: React.FC<Of<'ui'>> = (props) => {
  const { width: vw, height: vh } = useVideoConfig();
  // No vídeo vertical a tela é sempre de celular (um navegador ficaria pequeno demais para ler).
  const scene = useMemo(() => (vh > vw && props.device !== 'celular' ? { ...props, device: 'celular' as const } : props), [props, vw, vh]);
  return <InterfaceScene {...scene} />;
};

const InterfaceScene: React.FC<Of<'ui'>> = (scene) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const { u, vertical } = useLayout();
  const { brand } = useBrand();
  const s = useSurface(scene.surface, scene.tint);
  const t = useUiTokens(scene.surface === 'escuro');
  const titleStyle = useTitleStyle();
  const format = formatOf(width, height);
  // Onde a tela fica no quadro do vídeo. Celular no horizontal: texto à esquerda, aparelho à direita.
  // No vertical e no quadrado o celular fica grande, abaixo do título, e pode passar da borda de baixo.
  const mobile = scene.device === 'celular';
  const side = mobile && format === 'horizontal';
  const bezel = mobile ? 14 : 0;
  const native = nativeSize(scene.device, format);
  const outerW = native.w + bezel * 2;
  const outerH = native.h + bezel * 2;
  const titleH = scene.title && !side ? (vertical ? 300 : format === 'quadrado' ? 170 : 120) * u : 0;
  const top = (vertical ? 110 : 50) * u;
  const padX = (vertical ? 70 : side ? 200 : 110) * u;
  let scale: number;
  let devX: number;
  let devY: number;
  if (side) {
    scale = Math.min((height * 1.12) / outerH, (width * 0.4) / outerW);
    devX = width - padX - outerW * scale;
    devY = 64 * u;
  } else if (mobile) {
    scale = (width * (vertical ? 0.8 : 0.6)) / outerW;
    devX = (width - outerW * scale) / 2;
    devY = top + titleH + (scene.title ? 10 : 40) * u;
  } else {
    const boxW = width - padX * 2;
    const boxH = height - top - titleH - 50 * u;
    // Sem título a tela ocuparia o quadro todo: deixa folga para a inclinação 3D não cortar a borda de baixo.
    scale = Math.min(boxW / outerW, boxH / outerH) * (scene.title ? 1 : 0.9);
    devX = (width - outerW * scale) / 2;
    devY = top + titleH + (boxH - outerH * scale) / 2;
  }
  const devW = outerW * scale;
  const devH = outerH * scale;
  const visibleH = mobile ? (height - devY) / scale - bezel : undefined;
  const geo = useMemo(() => uiGeometry(scene, format, visibleH), [scene, format, visibleH]);
  const titleEnd = scene.title ? textEnd(scene.title, 0, 2.2) : 0;
  const tl = useMemo(() => uiTimeline(scene, geo, titleEnd), [scene, geo, titleEnd]);
  const sKeys = useMemo(() => scrollKeys(geo, tl, scene.frames), [geo, tl, scene.frames]);
  const scrollAt = (f: number) => keyed(sKeys, f);
  const cam = useMemo(() => cameraKeys(geo, tl, (f) => keyed(sKeys, f)), [geo, tl, sKeys]);

  // Entrada em 3D, deriva lenta e achatamento durante o zoom.
  const inP = spring({ frame: frame - tl.windowAt, fps, config: { damping: 22, stiffness: 70, mass: 1.1 } });
  const camS = keyed(cam.S, frame);
  const flat = interpolate(camS, [1, 1.2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const drift = interpolate(frame, [0, durationInFrames], [0, 1]);
  const rotX = (1 - inP) * 26 + inP * (geo.mobile ? 4 : 7) * flat;
  const rotY = (1 - inP) * (side ? -24 : -10) + inP * (side ? -12 + drift * 6 : mobile ? -5 + drift * 5 : -6 + drift * 4) * flat;
  const lift = (1 - inP) * 160 * u;
  const floatY = geo.mobile ? Math.sin(frame / 22) * 5 * u * flat : 0;
  const camX = keyed(cam.X, frame);
  const camY = keyed(cam.Y, frame);
  // Câmera: aproxima do ponto focado (coordenadas nativas da tela) mantendo-o no centro do aparelho.
  const focusX = devX + (bezel + camX) * scale;
  const focusY = devY + (bezel + camY) * scale;
  // Ponto do quadro para onde a câmera leva o foco: o centro da parte visível do aparelho.
  const cx = devX + devW / 2;
  const cy = (Math.max(0, devY) + Math.min(height, devY + devH)) / 2;
  const zoomIn = interpolate(camS, [1, 1.12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const active = Math.max(
    0,
    scene.menu.findIndex((m) => scene.screen && m.label.toLowerCase() === scene.screen.toLowerCase()),
  );
  const scroll = scrollAt(frame);
  const toasts = scene.blocks.filter((b) => b.kind === 'notificacao');
  const url = scene.url || `app.${brand.site || 'frenty.com.br'}`.replace(/^app\.app\./, 'app.');

  const content = (
    <div
      style={{
        position: 'absolute',
        left: bezel,
        top: bezel,
        width: geo.native.w,
        height: geo.native.h,
        background: t.bg,
        borderRadius: geo.mobile ? 44 : 12,
        overflow: 'hidden',
        fontFamily: t.font,
        color: t.fg,
      }}
    >
      {geo.mobile ? (
        <StatusBar t={t} h={geo.chrome} />
      ) : scene.device === 'navegador' ? (
        <BrowserBar t={t} url={url} h={geo.chrome} />
      ) : (
        <AppBar t={t} name={brand.nome} h={geo.chrome} />
      )}
      {geo.sidebar > 0 && <Sidebar t={t} geo={geo} scene={scene} active={active} />}
      <Header t={t} geo={geo} scene={scene} brandName={brand.nome} />
      <div style={{ position: 'absolute', left: geo.viewport.x, top: geo.viewport.y, width: geo.viewport.w, height: geo.viewport.h, background: t.page, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: geo.viewport.w, height: geo.contentHeight, transform: `translateY(${-scroll}px)` }}>
          {geo.grid.map((b) => (
            <Block key={b.id} t={t} b={b} r={geo.rects[b.id]} start={tl.blockAt[b.id]} acts={tl.actions.filter((a) => a.block.id === b.id)} assistant={brand.assistente} />
          ))}
        </div>
      </div>
      {geo.tabbar > 0 && <TabBar t={t} geo={geo} scene={scene} active={active} />}
      {toasts.map((b, i) => {
        const w = geo.mobile ? geo.native.w - 24 : 380;
        const pos: React.CSSProperties = geo.mobile ? { left: 12, top: geo.chrome + 6 + i * 84 } : { right: 24, bottom: 24 + i * 96 };
        return (
          <div key={b.id} style={{ position: 'absolute', ...pos }}>
            <Toast t={t} b={b} at={tl.toastAt[b.id]} width={w} mobile={geo.mobile} />
          </div>
        );
      })}
      <Cursor acts={tl.actions} geo={geo} scrollAt={scrollAt} t={t} />
      {geo.mobile && <div style={{ position: 'absolute', top: 11, left: '50%', width: 120, height: 34, marginLeft: -60, borderRadius: 20, background: '#0B0B0F' }} />}
    </div>
  );

  // Brilho que passa pelo vidro na entrada.
  const shine = tween(frame, tl.windowAt + 10, 34, EASE.inOut);

  return (
    <Background variant={s.variant}>
      {scene.title && (
        <div
          style={
            side
              ? { position: 'absolute', left: padX, top: 0, bottom: 0, width: width - devW - padX * 2.6, display: 'flex', alignItems: 'center' }
              : { position: 'absolute', left: padX, right: padX, top, height: titleH, display: 'flex', alignItems: 'center', justifyContent: vertical || (mobile && !side) ? 'center' : 'flex-start' }
          }
        >
          <KineticText
            text={scene.title}
            stagger={2.2}
            accent={s.accent}
            marker={s.marker}
            style={{
              ...titleStyle,
              fontSize: (side ? 84 : vertical ? 78 : format === 'quadrado' ? 60 : 56) * u,
              color: s.fg,
              textAlign: vertical || (mobile && !side) ? 'center' : 'left',
              opacity: 1 - 0.35 * interpolate(camS, [1, 1.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}
          />
        </div>
      )}
      <AbsoluteFill
        style={{
          perspective: 2600 * u,
          transformOrigin: `${cx}px ${cy}px`,
          transform: `translate(${(cx - focusX) * zoomIn}px, ${(cy - focusY) * zoomIn}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: devX,
            top: devY,
            width: devW,
            height: devH,
            transformOrigin: `${focusX - devX}px ${focusY - devY}px`,
            transform: `translateY(${lift + floatY}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${(0.86 + 0.14 * inP) * camS})`,
            opacity: Math.min(1, inP * 1.6),
          }}
        >
          {/* Sombra no "chão" */}
          <div
            style={{
              position: 'absolute',
              left: '6%',
              right: '6%',
              bottom: -30 * u,
              height: 60 * u,
              borderRadius: '50%',
              background: s.dark ? 'rgba(0,0,0,0.45)' : alpha('#1a1040', 0.22),
              filter: `blur(${34 * u}px)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: geo.native.w + bezel * 2,
              height: geo.native.h + bezel * 2,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
              borderRadius: geo.mobile ? 58 : 14,
              background: geo.mobile ? '#0B0B0F' : 'transparent',
              boxShadow: s.dark
                ? `0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)`
                : `0 40px 100px ${alpha('#1a1040', 0.22)}, 0 0 0 1px ${alpha('#1a1040', 0.06)}`,
              overflow: 'hidden',
            }}
          >
            {content}
            {shine > 0 && shine < 1 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(105deg, transparent ${shine * 140 - 40}%, rgba(255,255,255,0.28) ${shine * 140 - 25}%, transparent ${shine * 140 - 10}%)`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </div>
      </AbsoluteFill>
      <Sounds tl={tl} />
    </Background>
  );
};

const Sounds: React.FC<{ tl: ReturnType<typeof uiTimeline> }> = ({ tl }) => (
  <>
    <Sfx name="whoosh" at={tl.windowAt} volume={0.22} />
    {tl.actions.map((a, i) => {
      if (a.action.kind === 'clicar') return <Sfx key={i} name="click" at={a.at} volume={0.4} />;
      if (a.action.kind === 'notificar') return <Sfx key={i} name="pop" at={a.at} volume={0.35} />;
      if (a.action.kind === 'digitar')
        return (
          <React.Fragment key={i}>
            {new Array(Math.min(24, Math.ceil((a.typing?.length ?? 0) / 3))).fill(0).map((_, k) => (
              <Sfx key={k} name="type" at={a.at + k * 3 * 1.5} volume={0.16} />
            ))}
          </React.Fragment>
        );
      if (a.action.kind === 'zoom') return <Sfx key={i} name="whoosh" at={a.at} volume={0.14} />;
      return null;
    })}
    {Object.entries(tl.toastAt)
      .filter(([id]) => !tl.actions.some((a) => a.block.id === id))
      .map(([id, at]) => (
        <Sfx key={id} name="chime" at={at} volume={0.2} />
      ))}
  </>
);
