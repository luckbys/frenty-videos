// Kit de interface no estilo shadcn/ui, recriado para vídeo: mesmos tokens (card, border, muted, ring…),
// tipografia e proporções de um app real, com as cores e a fonte da marca. Tudo em pixels "nativos"
// da tela (14 px de texto, cartões com 20 px de respiro) — a cena escala a tela inteira para o vídeo.
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LineIcon } from '../components/Icons';
import { useBrand } from '../brand';
import { alpha, ensureContrast, mix } from '../color';
import { EASE, SPRING, tween } from '../motion/core';
import type { UiBlock, UiItem, UiStatus } from '../types';
import {
  BUTTON_H,
  CARD_PAD,
  cardHeader,
  CPS,
  FIELD,
  isAssistant,
  ROW_H,
  TABLE_HEAD,
  type Rect,
  type Timed,
} from './geometry';

/* ---------- Tokens ---------- */

export function useUiTokens(dark: boolean) {
  const { C, radius, fonts } = useBrand();
  const bg = dark ? mix(C.deepest, '#09090B', 0.55) : '#FFFFFF';
  const fg = dark ? '#FAFAFA' : C.text;
  const primary = dark ? mix(C.primary, '#FFFFFF', 0.12) : C.primary;
  return {
    dark,
    bg,
    page: dark ? mix(bg, '#FFFFFF', 0.015) : mix(C.background, '#FFFFFF', 0.45),
    sidebar: dark ? mix(bg, '#FFFFFF', 0.03) : mix(C.background, '#FFFFFF', 0.25),
    card: dark ? mix(bg, '#FFFFFF', 0.035) : '#FFFFFF',
    fg,
    muted: dark ? mix(bg, '#FFFFFF', 0.09) : mix('#FFFFFF', C.text, 0.05),
    mutedFg: dark ? mix(bg, '#FFFFFF', 0.62) : mix(C.text, '#FFFFFF', 0.42),
    border: dark ? mix(bg, '#FFFFFF', 0.13) : mix('#FFFFFF', C.text, 0.12),
    primary,
    primaryFg: C.onColor(primary),
    accent: dark ? alpha(primary, 0.2) : mix('#FFFFFF', C.primary, 0.08),
    accentFg: dark ? mix(primary, '#FFFFFF', 0.5) : ensureContrast(C.primary, '#FFFFFF', 4.5),
    ring: alpha(primary, dark ? 0.55 : 0.4),
    chart: [primary, C.secondary, C.accent, mix(C.primary, C.secondary, 0.5), mix(C.primary, '#FFFFFF', 0.45)],
    status: {
      ok: dark ? mix(C.accent, '#FFFFFF', 0.25) : ensureContrast(C.accent, '#FFFFFF', 3.4),
      atencao: dark ? '#FBBF24' : '#B45309',
      erro: dark ? '#F87171' : '#DC2626',
      neutro: dark ? mix(bg, '#FFFFFF', 0.62) : mix(C.text, '#FFFFFF', 0.42),
    } as Record<UiStatus, string>,
    r: radius(10),
    rs: radius(7),
    font: fonts.body,
    heading: fonts.heading,
    shadow: dark ? '0 1px 2px rgba(0,0,0,0.4)' : `0 1px 2px ${alpha(C.text, 0.05)}, 0 1px 3px ${alpha(C.text, 0.04)}`,
    shadowLg: dark ? '0 18px 50px rgba(0,0,0,0.55)' : `0 12px 32px ${alpha(C.text, 0.14)}, 0 2px 6px ${alpha(C.text, 0.06)}`,
  };
}
export type Tokens = ReturnType<typeof useUiTokens>;

/* ---------- Números ---------- */

// "R$ 128.450,90", "35%", "1,2 mil" → número (formato brasileiro, e também 1,234.5).
export function parseNum(s: string): number | null {
  const m = s.match(/-?\d[\d.,]*/);
  if (!m) return null;
  let n = m[0];
  const lastComma = n.lastIndexOf(',');
  const lastDot = n.lastIndexOf('.');
  if (lastComma > lastDot) n = n.replace(/\./g, '').replace(',', '.');
  else if (lastDot > lastComma && lastComma >= 0) n = n.replace(/,/g, '');
  else if (lastDot >= 0 && /\.\d{3}(\D|$)/.test(m[0]) && !/\.\d{1,2}$/.test(m[0])) n = n.replace(/\./g, '');
  const v = parseFloat(n);
  return Number.isFinite(v) ? v : null;
}

// Conta de 0 até o valor mantendo prefixo, sufixo e o jeito de escrever (separadores, casas decimais).
export function countTo(value: string, p: number) {
  const m = value.match(/-?\d[\d.,]*/);
  const n = parseNum(value);
  if (!m || n == null || p >= 1) return value;
  const raw = m[0];
  const decSep = /,\d{1,2}$/.test(raw) ? ',' : /\.\d{1,2}$/.test(raw) ? '.' : '';
  const decimals = decSep ? raw.split(decSep).pop()!.length : 0;
  const thou = decSep === ',' ? '.' : decSep === '.' ? ',' : raw.includes('.') ? '.' : raw.includes(',') ? ',' : '';
  const cur = n * p;
  const [int, dec] = Math.abs(cur).toFixed(decimals).split('.');
  const grouped = thou ? int.replace(/\B(?=(\d{3})+(?!\d))/g, thou) : int;
  const shown = `${cur < 0 ? '-' : ''}${grouped}${dec ? decSep + dec : ''}`;
  return value.replace(raw, shown);
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/* ---------- Primitivas ---------- */

export const Card: React.FC<{ t: Tokens; style?: React.CSSProperties; children: React.ReactNode }> = ({ t, style, children }) => (
  <div
    style={{
      background: t.card,
      border: `1px solid ${t.border}`,
      borderRadius: t.r,
      boxShadow: t.shadow,
      color: t.fg,
      fontFamily: t.font,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ t: Tokens; status?: UiStatus; children: React.ReactNode; p?: number }> = ({ t, status = 'neutro', children, p = 1 }) => {
  const c = t.status[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 9px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '18px',
        color: status === 'neutro' ? t.fg : c,
        background: status === 'neutro' ? t.muted : alpha(c, t.dark ? 0.16 : 0.1),
        border: `1px solid ${status === 'neutro' ? t.border : alpha(c, 0.22)}`,
        whiteSpace: 'nowrap',
        transform: `scale(${0.6 + 0.4 * p})`,
        opacity: p,
      }}
    >
      {status !== 'neutro' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />}
      {children}
    </span>
  );
};

export const Spinner: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${frame * 18}deg)` }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={alpha(color, 0.3)} strokeWidth="3" />
      <path d="M12 3a9 9 0 019 9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

// Botão com os estados de um clique: pressionado, carregando e concluído.
export const Button: React.FC<{
  t: Tokens;
  label: string;
  variant?: 'default' | 'outline' | 'secondary';
  icon?: string;
  press?: number; // 0–1 (afunda no clique)
  state?: 'idle' | 'loading' | 'done';
  style?: React.CSSProperties;
}> = ({ t, label, variant = 'default', icon, press = 0, state = 'idle', style }) => {
  const solid = variant === 'default';
  const fg = solid ? t.primaryFg : t.fg;
  return (
    <div
      style={{
        height: BUTTON_H,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 18px',
        borderRadius: t.rs,
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        background: solid ? mix(t.primary, '#000000', 0.12 * press) : variant === 'secondary' ? t.muted : t.card,
        color: fg,
        border: solid ? 'none' : `1px solid ${t.border}`,
        boxShadow: solid ? `0 1px 2px ${alpha(t.primary, 0.3)}${press > 0 ? `, 0 0 0 ${3 * press}px ${t.ring}` : ''}` : t.shadow,
        transform: `scale(${1 - 0.05 * press})`,
        fontFamily: t.font,
        ...style,
      }}
    >
      {state === 'loading' ? (
        <Spinner size={16} color={fg} />
      ) : state === 'done' ? (
        <LineIcon name="check" size={16} color={fg} strokeWidth={2.6} />
      ) : icon ? (
        <LineIcon name={icon} size={16} color={fg} />
      ) : null}
      {label}
    </div>
  );
};

export const Input: React.FC<{ t: Tokens; value: string; placeholder?: string; focus?: number; caret?: boolean; icon?: string; kbd?: string }> = ({
  t,
  value,
  placeholder,
  focus = 0,
  caret,
  icon,
  kbd,
}) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 9) % 2 === 0;
  return (
    <div
      style={{
        height: FIELD.input,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        borderRadius: t.rs,
        border: `1px solid ${focus > 0.5 ? t.primary : t.border}`,
        background: t.dark ? alpha('#FFFFFF', 0.03) : t.card,
        boxShadow: `0 0 0 ${3 * focus}px ${t.ring}`,
        fontSize: 14,
        color: value ? t.fg : t.mutedFg,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <LineIcon name={icon} size={16} color={t.mutedFg} />}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'clip', display: 'flex', alignItems: 'center' }}>
        {value || placeholder}
        {caret && <span style={{ width: 1.5, height: 18, background: blink ? t.fg : 'transparent', marginLeft: 1 }} />}
      </span>
      {kbd && (
        <span style={{ fontSize: 11, fontWeight: 600, color: t.mutedFg, border: `1px solid ${t.border}`, borderRadius: 4, padding: '1px 6px', background: t.muted }}>
          {kbd}
        </span>
      )}
    </div>
  );
};

export const Avatar: React.FC<{ t: Tokens; name: string; i?: number; size?: number; icon?: string }> = ({ t, name, i = 0, size = 32, icon }) => {
  const c = t.chart[i % t.chart.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: c,
        background: alpha(c, t.dark ? 0.2 : 0.12),
      }}
    >
      {icon ? <LineIcon name={icon} size={size * 0.52} color={c} /> : initials(name)}
    </div>
  );
};

const CardHead: React.FC<{ t: Tokens; b: UiBlock; right?: React.ReactNode; noText?: boolean }> = ({ t, b, right, noText }) =>
  b.title || (b.text && !noText) ? (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {b.title && <div style={{ fontSize: 16, fontWeight: 650, lineHeight: '24px', letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>}
        {b.text && !noText && <div style={{ fontSize: 13.5, color: t.mutedFg, lineHeight: '22px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.text}</div>}
      </div>
      {right}
    </div>
  ) : null;

/* ---------- Estado das ações num bloco ---------- */

type Ctx = { t: Tokens; b: UiBlock; r: Rect; start: number; acts: Timed[]; frame: number; fps: number };

const clickState = (acts: Timed[], frame: number) => {
  const a = acts.find((x) => x.action.kind === 'clicar' && frame >= x.at - 2);
  if (!a) return { press: 0, state: 'idle' as const, clicked: false, at: -1 };
  const d = frame - a.at;
  const press = d < 0 ? 0 : d < 4 ? d / 4 : d < 10 ? 1 - (d - 4) / 6 : 0;
  return { press, state: d > 3 && d < 18 ? ('loading' as const) : d >= 18 ? ('done' as const) : ('idle' as const), clicked: d >= 2, at: a.at };
};

const typeState = (acts: Timed[], frame: number) => {
  const a = acts.find((x) => x.action.kind === 'digitar');
  if (!a) return null;
  const chars = Math.max(0, Math.floor((frame - a.at) / CPS));
  return { a, chars, typing: frame >= a.at - 4 && chars < (a.typing?.length ?? 0), done: chars >= (a.typing?.length ?? 0) && frame >= a.at };
};

const highlight = (acts: Timed[], frame: number) => {
  let v = 0;
  for (const a of acts)
    if (a.action.kind === 'destacar' || a.action.kind === 'zoom') v = Math.max(v, tween(frame, a.at, 12) * (1 - tween(frame, a.end, 12)));
  return v;
};

// Anel de foco (ring) ao destacar ou dar zoom num bloco.
export const blockRing = (t: Tokens, acts: Timed[], frame: number) => {
  const h = highlight(acts, frame);
  return h > 0 ? `0 0 0 ${2 + 3 * h}px ${alpha(t.primary, 0.5 * h)}, 0 ${10 * h}px ${30 * h}px ${alpha(t.primary, 0.18 * h)}` : undefined;
};

const enter = (frame: number, at: number, fps: number) => spring({ frame: frame - at, fps, config: SPRING.snappy });

/* ---------- Blocos ---------- */

const Indicator: React.FC<Ctx> = ({ t, b, r, start, frame }) => {
  const count = tween(frame, start + 6, 34, EASE.out);
  const trendColor = b.trend === 'sobe' ? t.status.ok : b.trend === 'desce' ? t.status.erro : t.mutedFg;
  const series = b.series.length >= 3 ? b.series : [];
  const sparkH = Math.max(0, r.h - CARD_PAD * 2 - 24 - 42 - 28 - 8);
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 550, color: t.mutedFg, lineHeight: '24px' }}>
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</span>
        <LineIcon name={b.icon} size={17} color={t.mutedFg} />
      </div>
      <div style={{ fontSize: r.w < 220 ? 26 : 32, fontWeight: 750, letterSpacing: -0.8, lineHeight: '42px', fontVariantNumeric: 'tabular-nums', fontFamily: t.heading, whiteSpace: 'nowrap' }}>
        {countTo(b.value ?? '', count)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: t.mutedFg, lineHeight: '28px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {b.delta && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: trendColor, fontWeight: 650, opacity: tween(frame, start + 20, 10) }}>
            {b.trend !== 'neutra' && <LineIcon name={b.trend === 'sobe' ? 'up' : 'down'} size={14} color={trendColor} strokeWidth={2.4} />}
            {b.delta}
          </span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.text}</span>
      </div>
      {series.length > 0 && sparkH > 24 && <Spark t={t} data={series} w={r.w - CARD_PAD * 2} h={sparkH} p={tween(frame, start + 10, 40, EASE.inOut)} color={t.chart[0]} />}
    </div>
  );
};

const smoothPath = (pts: [number, number][]) =>
  pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');

const Spark: React.FC<{ t: Tokens; data: number[]; w: number; h: number; p: number; color: string; labels?: string[] }> = ({ t, data, w, h, p, color, labels }) => {
  const id = React.useId().replace(/:/g, '');
  const lo = Math.min(...data, 0);
  const hi = Math.max(...data) || 1;
  const bottom = labels ? h - 24 : h;
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * w, 6 + (1 - (v - lo) / (hi - lo || 1)) * (bottom - 12)] as [number, number]);
  const line = smoothPath(pts);
  return (
    <svg width={w} height={h} style={{ marginTop: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.28} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <rect x={0} y={-10} width={w * p} height={h + 20} />
        </clipPath>
      </defs>
      {labels &&
        [0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={0} x2={w} y1={bottom * g} y2={bottom * g} stroke={t.border} strokeDasharray="3 4" />)}
      <g clipPath={`url(#c${id})`}>
        <path d={`${line} L${w},${bottom} L0,${bottom} Z`} fill={`url(#g${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      </g>
      {p > 0.98 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={4.5} fill={t.card} stroke={color} strokeWidth={2.4} />}
      {labels?.map((l, i) => (
        <text key={i} x={pts[i][0]} y={h - 4} fontSize={12} fill={t.mutedFg} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'} fontFamily={t.font}>
          {l}
        </text>
      ))}
    </svg>
  );
};

const ChartBlock: React.FC<Ctx> = ({ t, b, r, start, frame, fps }) => {
  const items = b.items.length ? b.items : b.series.map((v, i) => ({ label: String(i + 1), value: String(v) }));
  const vals = items.map((i) => parseNum(i.value) ?? 0);
  const innerW = r.w - CARD_PAD * 2;
  const innerH = r.h - CARD_PAD * 2 - cardHeader(b);
  if (b.variant === 'area')
    return (
      <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <CardHead t={t} b={b} right={b.value ? <span style={{ fontSize: 22, fontWeight: 750 }}>{countTo(b.value, tween(frame, start + 6, 30))}</span> : undefined} />
        <Spark t={t} data={vals} w={innerW} h={innerH} p={tween(frame, start + 8, 45, EASE.inOut)} color={t.chart[0]} labels={items.map((i) => i.label)} />
      </div>
    );
  if (b.variant === 'rosca') {
    const total = vals.reduce((a, v) => a + Math.max(0, v), 0) || 1;
    const size = Math.min(innerH, innerW * 0.45);
    const R = size / 2 - 12;
    const C = 2 * Math.PI * R;
    let acc = 0;
    return (
      <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <CardHead t={t} b={b} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={t.muted} strokeWidth={20} />
            {vals.map((v, i) => {
              const frac = Math.max(0, v) / total;
              const p = tween(frame, start + 8 + i * 6, 26, EASE.inOut);
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={R}
                  fill="none"
                  stroke={t.chart[i % t.chart.length]}
                  strokeWidth={20}
                  strokeDasharray={`${Math.max(0, frac * C * p - 3)} ${C}`}
                  strokeDashoffset={-acc * C}
                />
              );
              acc += frac;
              return el;
            })}
          </svg>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, opacity: tween(frame, start + 10 + i * 5, 12) }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: t.chart[i % t.chart.length], flexShrink: 0 }} />
                <span style={{ flex: 1, color: t.mutedFg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
                <span style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{it.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const max = Math.max(...vals, 1);
  const n = items.length;
  const gap = Math.max(8, innerW * 0.04);
  const barW = Math.min(64, (innerW - gap * (n - 1)) / n);
  const chartH = innerH - 26;
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <CardHead t={t} b={b} />
      <div style={{ position: 'relative', height: innerH }}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <div key={g} style={{ position: 'absolute', left: 0, right: 0, top: chartH * (1 - g), borderTop: `1px dashed ${t.border}` }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap }}>
          {items.map((it, i) => {
            const p = spring({ frame: frame - start - 8 - i * 3, fps, config: SPRING.snappy });
            const h = Math.max(4, (vals[i] / max) * (chartH - 22)) * Math.min(1, p);
            const top = vals[i] === max;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: barW }}>
                <div style={{ fontSize: 12, fontWeight: 650, marginBottom: 4, opacity: tween(frame, start + 20 + i * 3, 10), whiteSpace: 'nowrap' }}>{it.value}</div>
                <div
                  style={{
                    width: barW,
                    height: h,
                    borderRadius: `${Math.min(6, t.rs)}px ${Math.min(6, t.rs)}px 2px 2px`,
                    background: top ? t.chart[0] : alpha(t.chart[0], t.dark ? 0.5 : 0.35),
                  }}
                />
                <div style={{ height: 26, lineHeight: '26px', fontSize: 12, color: t.mutedFg, whiteSpace: 'nowrap' }}>{it.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Table: React.FC<Ctx> = ({ t, b, r, start, frame, acts }) => {
  const hasStatus = b.items.some((i) => i.status && i.status !== 'neutro') || b.columns.length >= 4;
  const hasDetail = b.items.some((i) => i.detail) && r.w >= 480; // tabela estreita (celular): sem a 3ª coluna
  const cols = [b.columns[0] || 'Item', b.columns[1] || 'Valor', ...(hasDetail ? [b.columns[2] || ''] : []), ...(hasStatus ? [b.columns[hasDetail ? 3 : 2] || 'Status'] : [])];
  const click = clickState(acts, frame);
  const tpl = hasDetail ? '1.6fr 1fr 1fr' : '1.8fr 1fr';
  const grid = `${tpl}${hasStatus ? ' 0.9fr' : ''}`;
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box' }}>
      <CardHead t={t} b={b} />
      <div style={{ display: 'grid', gridTemplateColumns: grid, height: TABLE_HEAD, alignItems: 'center', fontSize: 13, fontWeight: 550, color: t.mutedFg, borderBottom: `1px solid ${t.border}`, padding: '0 10px' }}>
        {cols.map((c, i) => (
          <span key={i} style={{ textAlign: i === 0 ? 'left' : i === cols.length - 1 && hasStatus ? 'right' : 'left' }}>
            {c}
          </span>
        ))}
      </div>
      {b.items.map((it, i) => {
        const p = tween(frame, start + 8 + i * 4, 14);
        const sel = click.clicked && i === 0;
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: grid,
              height: ROW_H,
              alignItems: 'center',
              fontSize: 14,
              padding: '0 10px',
              borderBottom: i < b.items.length - 1 ? `1px solid ${t.border}` : 'none',
              background: sel ? t.accent : 'transparent',
              borderRadius: sel ? t.rs : 0,
              opacity: p,
              transform: `translateY(${(1 - p) * 8}px)`,
            }}
          >
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>{it.label}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{it.value}</span>
            {hasDetail && <span style={{ color: t.mutedFg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.detail}</span>}
            {hasStatus && (
              <span style={{ textAlign: 'right' }}>
                {it.status && <Badge t={t} status={it.status} p={tween(frame, start + 14 + i * 4, 10)}>{statusLabel(it)}</Badge>}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const STATUS_WORD: Record<UiStatus, string> = { ok: 'OK', atencao: 'Atenção', erro: 'Crítico', neutro: '—' };
const statusLabel = (it: UiItem) => (it.detail && !it.value ? it.detail : STATUS_WORD[it.status ?? 'neutro']);

const List: React.FC<Ctx> = ({ t, b, r, start, frame, acts }) => {
  const click = clickState(acts, frame);
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box' }}>
      <CardHead t={t} b={b} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {b.items.map((it, i) => {
          const p = tween(frame, start + 8 + i * 4, 14);
          const sel = click.clicked && i === 0;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: ROW_H,
                padding: '0 8px',
                borderRadius: t.rs,
                background: sel ? t.accent : 'transparent',
                opacity: p,
                transform: `translateX(${(1 - p) * -12}px)`,
              }}
            >
              {r.w >= 380 && <Avatar t={t} name={it.label} i={i} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
                {it.detail && <div style={{ fontSize: 12.5, color: t.mutedFg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.detail}</div>}
              </div>
              {it.status && it.status !== 'neutro' ? (
                <Badge t={t} status={it.status} p={tween(frame, start + 14 + i * 4, 10)}>
                  {it.value || STATUS_WORD[it.status]}
                </Badge>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 650, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{it.value}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Form: React.FC<Ctx> = ({ t, b, frame, acts }) => {
  const ty = typeState(acts, frame);
  const click = clickState(acts, frame);
  // Com "digitar", os campos começam vazios e são preenchidos um depois do outro.
  let left = ty ? ty.chars : Infinity;
  const values = b.items.map((it) => {
    const v = it.value.slice(0, Math.max(0, left));
    left -= it.value.length;
    return v;
  });
  const active = ty && ty.typing ? values.findIndex((v, i) => v.length < b.items[i].value.length) : -1;
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <CardHead t={t} b={b} />
      {b.items.map((it, i) => (
        <div key={i} style={{ marginBottom: FIELD.gap }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, height: FIELD.label, lineHeight: `${FIELD.label - 4}px` }}>{it.label}</div>
          <Input t={t} value={values[i]} placeholder={it.detail || ''} focus={i === active ? 1 : 0} caret={i === active} />
        </div>
      ))}
      {b.button && (
        <div style={{ marginTop: 4 }}>
          <Button t={t} label={b.button} press={click.press} state={click.state} />
        </div>
      )}
    </div>
  );
};

const CardBlock: React.FC<Ctx> = ({ t, b, frame, acts }) => {
  const click = clickState(acts, frame);
  const c = t.status[b.status] && b.status !== 'neutro' ? t.status[b.status] : t.primary;
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: t.rs, background: alpha(c, t.dark ? 0.2 : 0.1), display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <LineIcon name={b.icon} size={21} color={c} />
        </div>
        <div style={{ fontSize: 16.5, fontWeight: 650, lineHeight: '22px', letterSpacing: -0.2 }}>{b.title}</div>
      </div>
      {b.value && <div style={{ fontSize: 28, fontWeight: 750, letterSpacing: -0.6, fontFamily: t.heading }}>{b.value}</div>}
      {b.text && <div style={{ fontSize: 14, color: t.mutedFg, lineHeight: '21px' }}>{b.text}</div>}
      {b.button && (
        <div style={{ marginTop: 'auto' }}>
          <Button t={t} label={b.button} press={click.press} state={click.state} />
        </div>
      )}
    </div>
  );
};

const Alert: React.FC<Ctx> = ({ t, b, frame, acts }) => {
  const c = t.status[b.status === 'neutro' ? 'atencao' : b.status];
  const click = clickState(acts, frame);
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box', display: 'flex', gap: 12, background: alpha(c, t.dark ? 0.1 : 0.05) }}>
      <LineIcon name={b.icon === 'check' && b.status !== 'ok' ? 'alert' : b.icon} size={20} color={c} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 650, color: t.dark ? t.fg : mix(c, t.fg, 0.35) }}>{b.title}</div>
        {b.text && <div style={{ fontSize: 14, color: t.mutedFg, lineHeight: '21px' }}>{b.text}</div>}
        {b.button && (
          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            <Button t={t} label={b.button} variant="outline" press={click.press} state={click.state} />
          </div>
        )}
      </div>
    </div>
  );
};

const Progress: React.FC<Ctx> = ({ t, b, start, frame }) => {
  const vals = b.items.map((i) => parseNum(i.value) ?? 0);
  const pct = b.items.some((i) => i.value.includes('%'));
  const max = pct ? 100 : Math.max(...vals, 1);
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box' }}>
      <CardHead t={t} b={b} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {b.items.map((it, i) => {
          const p = tween(frame, start + 8 + i * 5, 34, EASE.inOut);
          const c = it.status && it.status !== 'neutro' ? t.status[it.status] : t.chart[0];
          return (
            <div key={i}>
              <div style={{ display: 'flex', fontSize: 13.5, marginBottom: 7 }}>
                <span style={{ flex: 1, fontWeight: 550 }}>{it.label}</span>
                <span style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{countTo(it.value, p)}</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: t.muted, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (vals[i] / max) * 100) * p}%`, background: c, borderRadius: 99 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Search: React.FC<Ctx> = ({ t, b, start, frame, acts }) => {
  const ty = typeState(acts, frame);
  const query = ty ? (ty.a.typing ?? '').slice(0, ty.chars) : b.value || '';
  const showAt = ty ? ty.a.at + (ty.a.typing?.length ?? 0) * CPS * 0.5 : start + 10;
  const click = clickState(acts, frame);
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box' }}>
      <Input t={t} value={query} placeholder={b.text || 'Buscar…'} icon="search" kbd="⌘K" focus={ty?.typing ? 1 : 0} caret={!!ty?.typing} />
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        {b.items.map((it, i) => {
          const p = tween(frame, showAt + i * 4, 12);
          const sel = i === 0 && (click.clicked || p > 0.9);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: ROW_H,
                padding: '0 10px',
                borderRadius: t.rs,
                background: sel ? t.accent : 'transparent',
                opacity: p,
                transform: `translateY(${(1 - p) * 6}px)`,
              }}
            >
              <LineIcon name={b.icon} size={16} color={sel ? t.accentFg : t.mutedFg} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 550, color: sel ? t.accentFg : t.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
              <span style={{ fontSize: 12.5, color: t.mutedFg, whiteSpace: 'nowrap' }}>{it.detail || it.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Chat: React.FC<Ctx & { assistant: string }> = ({ t, b, start, frame, acts, assistant }) => {
  const ty = typeState(acts, frame);
  const typed = ty?.a.typing ?? '';
  const idx = ty ? b.items.findIndex((m, i) => !isAssistant(m.label) && m.value === typed && b.items.slice(i + 1).every((x) => isAssistant(x.label) || x.value !== typed)) : -1;
  const msgs = ty && idx < 0 ? [...b.items, { label: 'Você', value: typed }] : b.items;
  const sendIdx = ty ? (idx >= 0 ? idx : msgs.length - 1) : -1;
  const sentAt = ty ? ty.a.at + typed.length * CPS + 6 : -1;
  // Quando cada mensagem aparece: antes da digitada, em sequência; depois dela, a IA "digitando…" e responde.
  const at: number[] = [];
  let clock = start + 8;
  msgs.forEach((m, i) => {
    if (ty && i === sendIdx) clock = sentAt;
    else if (ty && i > sendIdx) clock += 26;
    else clock += i === 0 ? 0 : isAssistant(m.label) ? 26 : 16;
    at.push(clock);
  });
  const composer = ty && frame < sentAt ? typed.slice(0, ty.chars) : '';
  return (
    <div style={{ padding: CARD_PAD, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <CardHead
        t={t}
        b={{ ...b, title: b.title || assistant }}
        right={<Badge t={t} status="ok">online</Badge>}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 10, overflow: 'hidden' }}>
        {msgs.map((m, i) => {
          const ai = isAssistant(m.label);
          const thinking = ai && frame >= at[i] - 18 && frame < at[i];
          const p = tween(frame, at[i], 12);
          if (thinking)
            return (
              <div key={i} style={{ alignSelf: 'flex-start', display: 'flex', gap: 5, padding: '12px 14px', background: t.muted, borderRadius: 14, borderBottomLeftRadius: 4 }}>
                {[0, 1, 2].map((d) => (
                  <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: t.mutedFg, opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame + d * 4) / 5)) }} />
                ))}
              </div>
            );
          if (p <= 0) return null;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignSelf: ai ? 'flex-start' : 'flex-end', alignItems: 'flex-end', maxWidth: '86%', opacity: p, transform: `translateY(${(1 - p) * 10}px) scale(${0.96 + 0.04 * p})`, transformOrigin: ai ? 'left bottom' : 'right bottom' }}>
              {ai && <Avatar t={t} name={assistant} size={26} icon="spark" />}
              <div
                style={{
                  padding: '9px 13px',
                  fontSize: 14,
                  lineHeight: '20px',
                  borderRadius: 14,
                  [ai ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: 4,
                  background: ai ? t.muted : t.primary,
                  color: ai ? t.fg : t.primaryFg,
                }}
              >
                {m.value}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <Input t={t} value={composer} placeholder={`Pergunte à ${assistant}…`} focus={ty && frame >= ty.a.at - 4 && frame < sentAt ? 1 : 0} caret={!!ty && frame >= ty.a.at && frame < sentAt} />
        </div>
        <div
          style={{
            width: FIELD.input,
            height: FIELD.input,
            borderRadius: t.rs,
            background: t.primary,
            display: 'grid',
            placeItems: 'center',
            transform: `scale(${ty && Math.abs(frame - sentAt) < 4 ? 0.9 : 1})`,
          }}
        >
          <LineIcon name="arrow" size={18} color={t.primaryFg} />
        </div>
      </div>
    </div>
  );
};

// Notificação (toast), desenhada por cima da tela.
export const Toast: React.FC<{ t: Tokens; b: UiBlock; at: number; width: number; mobile: boolean }> = ({ t, b, at, width, mobile }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: SPRING.snappy });
  const c = t.status[b.status === 'neutro' ? 'ok' : b.status];
  if (frame < at) return null;
  return (
    <div
      style={{
        width,
        display: 'flex',
        gap: 12,
        padding: '14px 16px',
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: t.r,
        boxShadow: t.shadowLg,
        color: t.fg,
        fontFamily: t.font,
        opacity: Math.min(1, p * 1.4),
        transform: mobile ? `translateY(${(1 - p) * -90}px)` : `translateY(${(1 - p) * 60}px) scale(${0.94 + 0.06 * p})`,
      }}
    >
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: alpha(c, 0.14), display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <LineIcon name={b.icon} size={17} color={c} draw={tween(frame, at + 6, 14)} strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 650, lineHeight: '20px' }}>{b.title}</div>
        {b.text && <div style={{ fontSize: 13.5, color: t.mutedFg, lineHeight: '19px', marginTop: 2 }}>{b.text}</div>}
      </div>
      {b.button && <Button t={t} label={b.button} variant="outline" style={{ height: 32, alignSelf: 'center', fontSize: 13, padding: '0 12px' }} />}
    </div>
  );
};

// Um bloco da grade: cartão com entrada animada, anel de destaque e o conteúdo do tipo.
export const Block: React.FC<{ t: Tokens; b: UiBlock; r: Rect; start: number; acts: Timed[]; assistant: string }> = ({ t, b, r, start, acts, assistant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, start, fps);
  const blur = interpolate(p, [0, 1], [8, 0], { extrapolateRight: 'clamp' });
  const ctx: Ctx = { t, b, r, start, acts, frame, fps };
  const body = (() => {
    switch (b.kind) {
      case 'indicador':
        return <Indicator {...ctx} />;
      case 'grafico':
        return <ChartBlock {...ctx} />;
      case 'tabela':
        return <Table {...ctx} />;
      case 'lista':
        return <List {...ctx} />;
      case 'formulario':
        return <Form {...ctx} />;
      case 'cartao':
        return <CardBlock {...ctx} />;
      case 'alerta':
        return <Alert {...ctx} />;
      case 'progresso':
        return <Progress {...ctx} />;
      case 'busca':
        return <Search {...ctx} />;
      case 'conversa':
        return <Chat {...ctx} assistant={assistant} />;
      default:
        return null;
    }
  })();
  return (
    <Card
      t={t}
      style={{
        position: 'absolute',
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        boxSizing: 'border-box',
        opacity: Math.min(1, p * 1.3),
        transform: `translateY(${(1 - p) * 18}px) scale(${0.97 + 0.03 * p})`,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        boxShadow: blockRing(t, acts, frame) ?? t.shadow,
        borderColor: b.kind === 'alerta' ? alpha(t.status[b.status === 'neutro' ? 'atencao' : b.status], 0.35) : t.border,
      }}
    >
      {body}
    </Card>
  );
};
