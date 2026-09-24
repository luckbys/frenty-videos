// Geometria e roteiro das telas de interface: onde cada bloco fica (em pixels "nativos" da tela,
// como num app de verdade) e em que quadro cada coisa acontece (entradas, cursor, digitação, zoom).
// Funções puras: o desenho (Interface.tsx) e o cursor usam as mesmas contas.
import type { FormatName } from '../theme';
import type { Scene, UiAction, UiBlock } from '../types';

export type UiScene = Extract<Scene, { type: 'ui' }>;
export type Rect = { x: number; y: number; w: number; h: number };

/* ---------- Medidas nativas ---------- */

export const PAD = { desktop: 24, mobile: 16 };
export const GAP = { desktop: 16, mobile: 12 };
export const CARD_PAD = 20;
export const FIELD = { label: 20, input: 40, gap: 14 };
export const BUTTON_H = 38;
export const ROW_H = 44; // linha de tabela/lista
export const TABLE_HEAD = 40;

// Largura aproximada de um texto de 14 px semi-negrito (para centralizar o cursor em botões).
export const textWidth = (s: string, size = 14) => s.length * size * 0.56;
export const buttonWidth = (label: string) => Math.round(textWidth(label) + 36);

// Cabeçalho de um cartão (título + descrição) — o mesmo cálculo que o desenho usa.
export const cardHeader = (b: Pick<UiBlock, 'title' | 'text'>) => (b.title ? 24 : 0) + (b.text ? 22 : 0) + (b.title || b.text ? 14 : 0);

export type UiGeometry = {
  mobile: boolean;
  native: { w: number; h: number }; // tela inteira, com a moldura
  chrome: number; // barra do navegador / barra de título / barra de status
  header: number; // cabeçalho do app
  sidebar: number; // largura da barra lateral (0 = sem)
  compact: boolean; // barra lateral só com ícones
  tabbar: number; // barra de abas do celular
  viewport: Rect; // área onde o conteúdo rola
  contentHeight: number;
  rects: Record<string, Rect>; // posição de cada bloco dentro do conteúdo (sem rolagem)
  grid: UiBlock[]; // blocos que vão na grade (notificações ficam por cima)
};

// Tamanho da tela nativa (sem a moldura do celular). Menor que um monitor real de propósito:
// no vídeo a tela é ampliada, e o texto de 14 px precisa ficar legível.
export const nativeSize = (device: UiScene['device'], format: FormatName) =>
  device === 'celular' ? { w: 390, h: 844 } : format === 'quadrado' ? { w: 800, h: 700 } : { w: 1100, h: 688 };

// visibleH: quanto da tela aparece no quadro (o celular pode passar da borda de baixo do vídeo).
export function uiGeometry(scene: UiScene, format: FormatName, visibleH?: number): UiGeometry {
  const mobile = scene.device === 'celular';
  const grid = scene.blocks.filter((b) => b.kind !== 'notificacao');
  const hasMenu = scene.menu.length > 0;
  if (mobile) {
    const native = nativeSize('celular', format);
    const chrome = 44;
    const header = 56;
    const cut = visibleH != null && visibleH < native.h - 10;
    const tabbar = hasMenu && !cut ? 64 : 0;
    const viewport = { x: 0, y: chrome + header, w: native.w, h: Math.min(native.h, visibleH ?? native.h) - chrome - header - tabbar };
    const heights = grid.map((b) => Math.max(112 * b.h + GAP.mobile * (b.h - 1), minHeight(b)));
    // Linhas da tela: indicadores vão dois por linha, como num app de celular; o resto ocupa a largura toda.
    const rows: { ids: number[]; h: number; weight: number }[] = [];
    for (let i = 0; i < grid.length; i++) {
      if (grid[i].kind === 'indicador' && grid[i + 1]?.kind === 'indicador') {
        rows.push({ ids: [i, i + 1], h: Math.max(heights[i], heights[i + 1]), weight: grid[i].h });
        i++;
      } else rows.push({ ids: [i], h: heights[i], weight: grid[i].h });
    }
    // Pouco conteúdo: as linhas crescem até preencher a tela (proporcional à altura pedida).
    const used = rows.reduce((a, r) => a + r.h, 0) + GAP.mobile * (rows.length - 1) + PAD.mobile * 2;
    if (used < viewport.h) {
      const weight = rows.reduce((a, r) => a + r.weight, 0) || 1;
      for (const r of rows) r.h += ((viewport.h - used) * r.weight) / weight;
    }
    const rects: Record<string, Rect> = {};
    const full = native.w - PAD.mobile * 2;
    const half = (full - GAP.mobile) / 2;
    let y = PAD.mobile;
    for (const r of rows) {
      r.ids.forEach((i, k) => {
        rects[grid[i].id] = r.ids.length === 2 ? { x: PAD.mobile + k * (half + GAP.mobile), y, w: half, h: r.h } : { x: PAD.mobile, y, w: full, h: r.h };
      });
      y += r.h + GAP.mobile;
    }
    return { mobile, native, chrome, header, sidebar: 0, compact: false, tabbar, viewport, contentHeight: y - GAP.mobile + PAD.mobile, rects, grid };
  }

  const square = format === 'quadrado';
  const native = nativeSize(scene.device, format);
  const chrome = scene.device === 'navegador' ? 44 : 34;
  const header = 58;
  const compact = square;
  const sidebar = hasMenu ? (compact ? 64 : 216) : 0;
  const viewport = { x: sidebar, y: chrome + header, w: native.w - sidebar, h: native.h - chrome - header };
  const cols = 12;
  const colW = (viewport.w - PAD.desktop * 2 - GAP.desktop * (cols - 1)) / cols;

  // Altura de cada bloco em pixels: a altura pedida (em linhas) ou o que o conteúdo precisa, o que for maior.
  // A linha vale o que cabe na tela com as linhas pedidas pela IA.
  const spans = grid.map((b) => Math.max(1, Math.min(4, b.h)));
  const skyline = (hs: number[]) => {
    const heights = new Array(cols).fill(0);
    const cells = grid.map((b, i) => {
      const w = Math.max(1, Math.min(cols, b.w));
      let col = 0;
      let top = Infinity;
      for (let c = 0; c + w <= cols; c++) {
        const y = Math.max(...heights.slice(c, c + w));
        if (y < top - 0.5) {
          top = y;
          col = c;
        }
      }
      for (let c = col; c < col + w; c++) heights[c] = top + hs[i] + GAP.desktop;
      return { col, top, w, h: hs[i] };
    });
    return { cells, bottom: Math.max(0, ...heights) - GAP.desktop };
  };
  // Quantas linhas a IA empilhou na coluna mais alta.
  const stack = (() => {
    const hs = new Array(cols).fill(0);
    grid.forEach((b, i) => {
      const w = Math.max(1, Math.min(cols, b.w));
      let col = 0;
      let top = Infinity;
      for (let c = 0; c + w <= cols; c++) {
        const y = Math.max(...hs.slice(c, c + w));
        if (y < top) {
          top = y;
          col = c;
        }
      }
      for (let c = col; c < col + w; c++) hs[c] = top + spans[i];
    });
    return Math.max(1, ...hs);
  })();
  const avail = viewport.h - PAD.desktop * 2;
  const unit = Math.max(96, Math.min(230, (avail - GAP.desktop * (stack - 1)) / stack));
  const hs = grid.map((b, i) => Math.max(spans[i] * unit + (spans[i] - 1) * GAP.desktop, minHeight(b)));
  let { cells } = skyline(hs);
  const { bottom } = skyline(hs);
  // Sobrou espaço: estica tudo um pouco para a tela não ficar vazia embaixo (até 25%).
  if (bottom < avail) {
    const f = Math.min(1.25, avail / Math.max(1, bottom));
    ({ cells } = skyline(hs.map((h) => h * f)));
  }
  const rects: Record<string, Rect> = {};
  cells.forEach((c, i) => {
    rects[grid[i].id] = {
      x: PAD.desktop + c.col * (colW + GAP.desktop),
      y: PAD.desktop + c.top,
      w: c.w * colW + (c.w - 1) * GAP.desktop,
      h: c.h,
    };
  });
  const contentHeight = Math.max(...Object.values(rects).map((r) => r.y + r.h), 0) + PAD.desktop;
  return { mobile: false, native, chrome, header, sidebar, compact, tabbar: 0, viewport, contentHeight, rects, grid };
}

// Altura mínima de alguns blocos: formulários, tabelas e listas não podem ficar cortados no meio.
export function minHeight(b: UiBlock) {
  const head = cardHeader(b);
  switch (b.kind) {
    case 'formulario':
      return CARD_PAD * 2 + head + b.items.length * (FIELD.label + FIELD.input + FIELD.gap) + (b.button ? BUTTON_H : 0);
    case 'tabela':
      return CARD_PAD * 2 + head + TABLE_HEAD + b.items.length * ROW_H;
    case 'lista':
      return CARD_PAD * 2 + head + b.items.length * (ROW_H + 8);
    case 'conversa':
      return CARD_PAD * 2 + head + 64 + b.items.length * 62;
    case 'busca':
      return CARD_PAD * 2 + FIELD.input + 12 + b.items.length * ROW_H;
    case 'progresso':
      return CARD_PAD * 2 + head + b.items.length * 46;
    case 'cartao':
      return CARD_PAD * 2 + 40 + (b.value ? 42 : 0) + (b.text ? 52 : 0) + (b.button ? BUTTON_H + 20 : 0);
    case 'alerta':
      return CARD_PAD * 2 + 24 + (b.text ? 44 : 0) + (b.button ? BUTTON_H + 12 : 0);
    case 'indicador':
      return CARD_PAD * 2 + 24 + 42 + 28 + (b.series.length >= 3 ? 44 : 0);
    case 'grafico':
      return CARD_PAD * 2 + head + (b.variant === 'rosca' ? Math.max(130, b.items.length * 28) : 150);
    default:
      return 0;
  }
}

/* ---------- Pontos de interação (onde o cursor vai) ---------- */

export const buttonRect = (b: UiBlock, r: Rect): Rect => {
  const w = buttonWidth(b.button ?? '');
  if (b.kind === 'formulario') return { x: r.x + CARD_PAD, y: r.y + CARD_PAD + cardHeader(b) + b.items.length * (FIELD.label + FIELD.input + FIELD.gap) + 4, w, h: BUTTON_H };
  return { x: r.x + CARD_PAD, y: r.y + r.h - CARD_PAD - BUTTON_H, w, h: BUTTON_H };
};

export const fieldRect = (b: UiBlock, r: Rect, i: number): Rect => ({
  x: r.x + CARD_PAD,
  y: r.y + CARD_PAD + cardHeader(b) + i * (FIELD.label + FIELD.input + FIELD.gap) + FIELD.label,
  w: r.w - CARD_PAD * 2,
  h: FIELD.input,
});

export const searchRect = (r: Rect): Rect => ({ x: r.x + CARD_PAD, y: r.y + CARD_PAD, w: r.w - CARD_PAD * 2, h: FIELD.input });
export const composerRect = (r: Rect): Rect => ({ x: r.x + CARD_PAD, y: r.y + r.h - CARD_PAD - 44, w: r.w - CARD_PAD * 2, h: 44 });
export const firstRowRect = (b: UiBlock, r: Rect): Rect => {
  const top = r.y + CARD_PAD + cardHeader(b) + (b.kind === 'tabela' ? TABLE_HEAD : 0);
  return { x: r.x + CARD_PAD, y: top, w: r.w - CARD_PAD * 2, h: ROW_H };
};

const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

// Onde o cursor para em cada ação (coordenadas do conteúdo, sem rolagem).
export function actionPoint(a: UiAction, b: UiBlock, r: Rect) {
  if (a.kind === 'digitar') {
    if (b.kind === 'formulario') {
      const f = fieldRect(b, r, 0);
      return { x: f.x + Math.min(f.w - 20, 90), y: f.y + f.h / 2 };
    }
    if (b.kind === 'busca') return { x: r.x + CARD_PAD + 90, y: searchRect(r).y + FIELD.input / 2 };
    if (b.kind === 'conversa') {
      const c = composerRect(r);
      return { x: c.x + Math.min(c.w - 30, 120), y: c.y + c.h / 2 };
    }
  }
  if (a.kind === 'clicar') {
    if (b.button && (b.kind === 'cartao' || b.kind === 'formulario' || b.kind === 'alerta')) {
      const br = buttonRect(b, r);
      return { x: br.x + br.w * 0.55, y: br.y + br.h * 0.6 };
    }
    if ((b.kind === 'tabela' || b.kind === 'lista') && b.items.length) {
      const row = firstRowRect(b, r);
      return { x: row.x + Math.min(row.w * 0.35, 180), y: row.y + row.h / 2 };
    }
  }
  const c = center(r);
  return { x: c.x + Math.min(40, r.w * 0.1), y: c.y + Math.min(24, r.h * 0.1) };
}

/* ---------- Roteiro no tempo ---------- */

export type Timed = {
  action: UiAction;
  block: UiBlock;
  index: number; // índice no bloco-alvo (0 = primeira ação desse bloco)
  move: number; // cursor começa a andar
  at: number; // clique / início da digitação / início do zoom
  end: number; // fim do efeito
  point?: { x: number; y: number }; // no conteúdo
  typing?: string; // texto digitado
};

export type UiTimeline = {
  titleEnd: number;
  windowAt: number;
  blockAt: Record<string, number>;
  blocksEnd: number;
  actions: Timed[];
  toastAt: Record<string, number>; // notificações sem ação: aparecem sozinhas
};

export const CPS = 1.5; // quadros por caractere digitado

export function typedText(a: UiAction, b: UiBlock) {
  if (b.kind === 'formulario') return b.items.map((i) => i.value).join('');
  if (b.kind === 'busca') return a.text || b.value || '';
  if (b.kind === 'conversa') return a.text || [...b.items].reverse().find((m) => !isAssistant(m.label))?.value || '';
  return a.text || '';
}

export const isAssistant = (label: string) => /assist|ia\b|iaf|bot|^ia$/i.test(label.trim());

export function uiTimeline(scene: UiScene, geo: UiGeometry, titleEnd: number): UiTimeline {
  const frames = scene.frames;
  const windowAt = scene.title ? Math.min(14, Math.max(4, titleEnd - 18)) : 2;
  const n = geo.grid.length;
  const step = Math.max(3, Math.min(7, (frames * 0.18) / Math.max(1, n)));
  const blockAt: Record<string, number> = {};
  geo.grid.forEach((b, i) => (blockAt[b.id] = Math.round(windowAt + 14 + i * step)));
  const blocksEnd = Math.round(windowAt + 14 + (n - 1) * step + 20);

  const byId = new Map(scene.blocks.map((b) => [b.id, b]));
  const wanted = scene.actions.filter((a) => byId.has(a.target));
  const need = (a: UiAction) => {
    const b = byId.get(a.target)!;
    switch (a.kind) {
      case 'clicar':
        return { move: 20, effect: 26 };
      case 'digitar':
        return { move: 18, effect: Math.min(90, typedText(a, b).length * CPS) + (b.kind === 'conversa' ? 34 : 14) };
      case 'destacar':
        return { move: 16, effect: 44 };
      case 'zoom':
        return { move: 0, effect: 56 };
      case 'notificar':
        return { move: 0, effect: 40 };
    }
  };
  let t = blocksEnd + 6;
  const tail = 24;
  const total = wanted.reduce((s, a) => s + need(a).move + need(a).effect, 0);
  const avail = frames - t - tail;
  const k = total > avail ? Math.max(0.45, avail / Math.max(1, total)) : 1;
  const actions: Timed[] = [];
  const count = new Map<string, number>();
  for (const a of wanted) {
    const b = byId.get(a.target)!;
    const d = need(a);
    const move = Math.round(d.move * Math.min(1, k * 1.1));
    const effect = Math.round(d.effect * k);
    if (t + move + Math.min(effect, 12) > frames - 8) break; // não cabe: fica de fora
    const r = geo.rects[b.id];
    const index = count.get(b.id) ?? 0;
    count.set(b.id, index + 1);
    actions.push({
      action: a,
      block: b,
      index,
      move: t,
      at: t + move,
      end: Math.min(frames - 4, t + move + effect),
      point: r && a.kind !== 'notificar' && a.kind !== 'zoom' ? actionPoint(a, b, r) : undefined,
      typing: a.kind === 'digitar' ? typedText(a, b) : undefined,
    });
    t += move + effect;
  }
  const toastAt: Record<string, number> = {};
  for (const b of scene.blocks.filter((x) => x.kind === 'notificacao')) {
    const act = actions.find((x) => x.block.id === b.id);
    toastAt[b.id] = act ? act.at : Math.min(frames - 50, Math.max(blocksEnd + 8, Math.round(frames * 0.55)));
  }
  return { titleEnd, windowAt, blockAt, blocksEnd, actions, toastAt };
}

/* ---------- Câmera e rolagem ---------- */

type Key = { f: number; v: number };
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const keyed = (keys: Key[], f: number) => {
  if (!keys.length) return 0;
  if (f <= keys[0].f) return keys[0].v;
  for (let i = 1; i < keys.length; i++)
    if (f <= keys[i].f) {
      const a = keys[i - 1];
      const b = keys[i];
      const p = b.f === a.f ? 1 : (f - a.f) / (b.f - a.f);
      return a.v + (b.v - a.v) * ease(p);
    }
  return keys[keys.length - 1].v;
};

// Rolagem do conteúdo: leva cada alvo para dentro da tela antes da ação; sem ações, desce devagar.
export function scrollKeys(geo: UiGeometry, tl: UiTimeline, frames: number): Key[] {
  const max = Math.max(0, geo.contentHeight - geo.viewport.h);
  if (max < 4) return [{ f: 0, v: 0 }];
  const keys: Key[] = [{ f: 0, v: 0 }, { f: tl.blocksEnd, v: 0 }];
  const targets = tl.actions.filter((a) => geo.rects[a.block.id] && a.action.kind !== 'notificar');
  if (!targets.length) {
    keys.push({ f: frames - 20, v: max });
    return keys;
  }
  let last = 0;
  let free = tl.blocksEnd; // a rolagem só começa depois da ação anterior
  for (const a of targets) {
    const r = geo.rects[a.block.id];
    // Rola só o necessário para o bloco (ou o ponto da ação) caber inteiro na tela.
    const top = a.point ? Math.min(r.y, a.point.y - 60) : r.y;
    const bottom = a.point ? Math.max(Math.min(r.y + r.h, a.point.y + 160), a.point.y + 60) : r.y + r.h;
    let v = last;
    if (bottom > v + geo.viewport.h - 16) v = bottom - geo.viewport.h + 16;
    if (top < v + 16) v = top - 16;
    v = Math.max(0, Math.min(max, v));
    if (Math.abs(v - last) > 2) {
      const from = Math.max(keys[keys.length - 1].f + 1, free, a.move - 16);
      keys.push({ f: from, v: last });
      keys.push({ f: Math.max(from + 12, a.move + 4), v });
      last = v;
    }
    free = a.end;
  }
  return keys;
}

export type Cam = { s: number; x: number; y: number }; // escala e ponto focado (tela nativa)

// Zoom: "zoom" e "destacar" aproximam do bloco; depois a câmera volta.
export function cameraKeys(geo: UiGeometry, tl: UiTimeline, scrollAt: (f: number) => number) {
  const home: Cam = { s: 1, x: geo.native.w / 2, y: geo.native.h / 2 };
  const S: Key[] = [{ f: 0, v: 1 }];
  const X: Key[] = [{ f: 0, v: home.x }];
  const Y: Key[] = [{ f: 0, v: home.y }];
  const push = (f: number, c: Cam) => {
    const at = Math.max(S[S.length - 1].f + 1, f);
    S.push({ f: at, v: c.s });
    X.push({ f: at, v: c.x });
    Y.push({ f: at, v: c.y });
  };
  let zoomed = false;
  tl.actions.forEach((a, i) => {
    const r = geo.rects[a.block.id];
    if (!r || (a.action.kind !== 'zoom' && a.action.kind !== 'destacar')) return;
    const vx = geo.viewport.x + r.x + r.w / 2;
    const vy = geo.viewport.y + r.y + r.h / 2 - scrollAt(a.at);
    const fit = Math.min(geo.native.w / (r.w + 80), geo.native.h / (r.h + 80));
    const s = Math.max(1.12, Math.min(a.action.kind === 'zoom' ? 1.9 : 1.35, fit));
    if (!zoomed) push(a.move, { ...home });
    push(a.at + 18, { s, x: vx, y: vy });
    push(a.end - 6, { s, x: vx, y: vy });
    const next = tl.actions[i + 1];
    const chained = next && (next.action.kind === 'zoom' || next.action.kind === 'destacar') && next.move - a.end < 10;
    if (!chained) {
      push(a.end + 14, home);
      zoomed = false;
    } else zoomed = true;
  });
  return { S, X, Y };
}
