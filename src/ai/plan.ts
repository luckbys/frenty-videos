// Plano de vídeo montado pela IA: o formato que ela devolve (JSON Schema) e a conversão,
// com validação, para as cenas que o Remotion desenha. Nada aqui confia no que a IA mandou:
// tamanhos de lista, números, ícones e posições são conferidos e ajustados.
import { ICON_NAMES, iconFor } from '../components/Icons';
import { fitToLimit } from '../parse';
import { totalFrames } from '../parse-duration';
import { theme } from '../theme';
import type { CompositionElement, CustomIcon, Rhythm, Scene, Surface, Tint, UiAction, UiBlock, UiBlockKind, UiItem, UiStatus } from '../types';

const FPS = theme.video.fps;

/* ---------- Esquema (o que a IA preenche) ---------- */

type Schema = Record<string, unknown>;
const str: Schema = { type: 'string' };
const num: Schema = { type: 'number' };
const int: Schema = { type: 'integer' };
const en = (...values: string[]): Schema => ({ type: 'string', enum: values });
const arr = (items: Schema): Schema => ({ type: 'array', items });
const obj = (properties: Record<string, Schema>): Schema => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const FUNDOS = ['claro', 'escuro', 'cor'] as const;
export const CORES = ['primaria', 'secundaria', 'destaque'] as const;

export const UI_BLOCKS = ['indicador', 'grafico', 'tabela', 'lista', 'formulario', 'cartao', 'alerta', 'notificacao', 'conversa', 'progresso', 'busca'] as const;
export const UI_ACTIONS = ['clicar', 'digitar', 'destacar', 'zoom', 'notificar'] as const;
const STATUS = ['ok', 'atencao', 'erro', 'neutro'] as const;

const base = (tipo: string, extra: Record<string, Schema>) =>
  obj({ tipo: { type: 'string', const: tipo }, segundos: num, ...extra });

const SCENES: Record<string, Schema> = {
  abertura: base('abertura', { titulo: str, subtitulo: str }),
  texto: base('texto', { rotulo: str, texto: str }),
  lista: base('lista', { titulo: str, itens: arr(obj({ texto: str, icone: str })) }),
  numeros: base('numeros', { titulo: str, itens: arr(obj({ valor: str, rotulo: str })) }),
  grafico: base('grafico', { titulo: str, itens: arr(obj({ rotulo: str, valor: num, exibicao: str })) }),
  conversa: base('conversa', { titulo: str, mensagens: arr(obj({ quem: en('pessoa', 'assistente'), texto: str })) }),
  chamada: base('chamada', { titulo: str, texto: str, botao: str, url: str }),
  etapas: base('etapas', { fundo: en(...FUNDOS), cor: en(...CORES), titulo: str, itens: arr(obj({ titulo: str, texto: str, icone: str })) }),
  comparacao: base('comparacao', {
    fundo: en(...FUNDOS),
    titulo: str,
    antes: obj({ rotulo: str, itens: arr(str) }),
    depois: obj({ rotulo: str, itens: arr(str) }),
  }),
  numero_destaque: base('numero_destaque', {
    fundo: en(...FUNDOS),
    cor: en(...CORES),
    valor: str,
    rotulo: str,
    contexto: str,
    tendencia: en('sobe', 'desce', 'neutra'),
    icone: str,
  }),
  grade_icones: base('grade_icones', { fundo: en(...FUNDOS), cor: en(...CORES), titulo: str, itens: arr(obj({ icone: str, rotulo: str, texto: str })) }),
  impacto: base('impacto', { fundo: en(...FUNDOS), cor: en(...CORES), chamada: str, texto: str }),
  depoimento: base('depoimento', { fundo: en(...FUNDOS), cor: en(...CORES), citacao: str, autor: str, cargo: str }),
  composicao: base('composicao', {
    fundo: en(...FUNDOS),
    elementos: arr(
      obj({
        tipo: en('titulo', 'texto', 'icone', 'numero', 'selo', 'ilustracao', 'forma'),
        texto: str,
        icone: str,
        x: int,
        y: int,
        largura: int,
        altura: int,
        alinhamento: en('esquerda', 'centro', 'direita'),
        cor: en('primaria', 'secundaria', 'destaque', 'texto'),
        tamanho: en('p', 'm', 'g', 'gg'),
        entrada: en('subir', 'escala', 'desenhar', 'deslizar', 'digitar'),
        ordem: int,
      }),
    ),
  }),
  interface: base('interface', {
    fundo: en(...FUNDOS),
    cor: en(...CORES),
    titulo: str,
    moldura: en('navegador', 'app', 'celular'),
    endereco: str,
    tela: str,
    menu: arr(obj({ rotulo: str, icone: str })),
    blocos: arr(
      obj({
        id: str,
        tipo: en(...UI_BLOCKS),
        largura: int,
        altura: int,
        titulo: str,
        texto: str,
        icone: str,
        valor: str,
        variacao: str,
        tendencia: en('sobe', 'desce', 'neutra'),
        variante: en('barras', 'area', 'rosca'),
        status: en(...STATUS),
        itens: arr(obj({ rotulo: str, valor: str, detalhe: str, status: en(...STATUS) })),
        serie: arr(num),
        colunas: arr(str),
        botao: str,
      }),
    ),
    acoes: arr(obj({ alvo: str, acao: en(...UI_ACTIONS), texto: str })),
  }),
  encerramento: base('encerramento', { slogan: str, url: str }),
};

export const SCENE_KINDS = Object.keys(SCENES);

export const PLAN_SCHEMA: Schema = obj({
  resumo: str,
  ritmo: en('calmo', 'equilibrado', 'energico'),
  icones: arr(obj({ nome: str, caminhos: arr(str) })),
  cenas: arr({ anyOf: Object.values(SCENES) }),
});

// Uma cena só (para "refazer esta cena").
export const SCENE_SCHEMA: Schema = obj({
  icones: arr(obj({ nome: str, caminhos: arr(str) })),
  cena: { anyOf: Object.values(SCENES) },
});

/* ---------- Tipos do plano ---------- */

type Item<T> = T[];
export type PlanScene =
  | { tipo: 'abertura'; segundos: number; titulo: string; subtitulo: string }
  | { tipo: 'texto'; segundos: number; rotulo: string; texto: string }
  | { tipo: 'lista'; segundos: number; titulo: string; itens: Item<{ texto: string; icone: string }> }
  | { tipo: 'numeros'; segundos: number; titulo: string; itens: Item<{ valor: string; rotulo: string }> }
  | { tipo: 'grafico'; segundos: number; titulo: string; itens: Item<{ rotulo: string; valor: number; exibicao: string }> }
  | { tipo: 'conversa'; segundos: number; titulo: string; mensagens: Item<{ quem: 'pessoa' | 'assistente'; texto: string }> }
  | { tipo: 'chamada'; segundos: number; titulo: string; texto: string; botao: string; url: string }
  | { tipo: 'etapas'; segundos: number; fundo: Surface; cor: Tint; titulo: string; itens: Item<{ titulo: string; texto: string; icone: string }> }
  | { tipo: 'comparacao'; segundos: number; fundo: Surface; titulo: string; antes: { rotulo: string; itens: string[] }; depois: { rotulo: string; itens: string[] } }
  | { tipo: 'numero_destaque'; segundos: number; fundo: Surface; cor: Tint; valor: string; rotulo: string; contexto: string; tendencia: 'sobe' | 'desce' | 'neutra'; icone: string }
  | { tipo: 'grade_icones'; segundos: number; fundo: Surface; cor: Tint; titulo: string; itens: Item<{ icone: string; rotulo: string; texto: string }> }
  | { tipo: 'impacto'; segundos: number; fundo: Surface; cor: Tint; chamada: string; texto: string }
  | { tipo: 'depoimento'; segundos: number; fundo: Surface; cor: Tint; citacao: string; autor: string; cargo: string }
  | {
      tipo: 'composicao';
      segundos: number;
      fundo: Surface;
      elementos: Item<{
        tipo: CompositionElement['kind'];
        texto: string;
        icone: string;
        x: number;
        y: number;
        largura: number;
        altura: number;
        alinhamento: CompositionElement['align'];
        cor: CompositionElement['color'];
        tamanho: CompositionElement['size'];
        entrada: CompositionElement['enter'];
        ordem: number;
      }>;
    }
  | {
      tipo: 'interface';
      segundos: number;
      fundo: Surface;
      cor: Tint;
      titulo: string;
      moldura: 'navegador' | 'app' | 'celular';
      endereco: string;
      tela: string;
      menu: Item<{ rotulo: string; icone: string }>;
      blocos: Item<PlanUiBlock>;
      acoes: Item<{ alvo: string; acao: (typeof UI_ACTIONS)[number]; texto: string }>;
    }
  | { tipo: 'encerramento'; segundos: number; slogan: string; url: string };

export type PlanUiBlock = {
  id: string;
  tipo: UiBlockKind;
  largura: number;
  altura: number;
  titulo: string;
  texto: string;
  icone: string;
  valor: string;
  variacao: string;
  tendencia: 'sobe' | 'desce' | 'neutra';
  variante: 'barras' | 'area' | 'rosca';
  status: UiStatus;
  itens: Item<{ rotulo: string; valor: string; detalhe: string; status: UiStatus }>;
  serie: number[];
  colunas: string[];
  botao: string;
};

export type PlanIcon = { nome: string; caminhos: string[] };
export type Plan = { resumo: string; ritmo: Rhythm; icones: PlanIcon[]; cenas: PlanScene[] };

// O que fica salvo ao lado do roteiro.
export type StoredPlan = {
  versao: 1;
  geradoEm: string;
  modelo: string;
  formato: string;
  fonte: string; // hash do conteúdo do roteiro usado (sem o cabeçalho)
  instrucao?: string;
  plano: Plan;
};

/* ---------- Validação ---------- */

const text = (v: unknown, max = 220) =>
  typeof v === 'string'
    ? v
        .replace(/\s+/g, ' ')
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, max)
    : '';
const opt = (v: unknown, max?: number) => text(v, max) || undefined;
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const list = <T>(v: unknown, max: number): T[] => (Array.isArray(v) ? (v.slice(0, max) as T[]) : []);
const clampInt = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.max(lo, Math.min(hi, n));
};
const seconds = (v: unknown, fallback: number) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.round(Math.max(2.5, Math.min(14, n)) * FPS);
};

// Traços de SVG: só comandos de caminho e números (nada de scripts, estilos ou links).
const PATH_RE = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]{2,800}$/;
const BUILTIN = new Set(ICON_NAMES);

export function sanitizeIcons(raw: unknown): CustomIcon[] {
  const out: CustomIcon[] = [];
  for (const ic of list<PlanIcon>(raw, 10)) {
    const name = text(ic?.nome, 40)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    if (!name || BUILTIN.has(name) || out.some((o) => o.name === name)) continue;
    const paths = list<string>(ic?.caminhos, 8).filter((d) => typeof d === 'string' && PATH_RE.test(d.trim()));
    if (paths.length) out.push({ name, paths: paths.map((d) => d.trim()) });
  }
  return out;
}

const iconName = (v: unknown, context: string, custom: Set<string>) => {
  const n = text(v, 40).toLowerCase();
  return BUILTIN.has(n) || custom.has(n) ? n : iconFor(context);
};

// Converte uma cena do plano em cena desenhável; devolve null se estiver vazia demais.
// Problemas encontrados na conversão (para pedir à IA que corrija o plano).
type Report = (msg: string) => void;
const quiet: Report = () => undefined;

export function toScene(p: PlanScene, custom: Set<string>, report: Report = quiet): Scene | null {
  const surface = pick((p as { fundo?: string }).fundo, FUNDOS, 'claro');
  const tint = pick((p as { cor?: string }).cor, CORES, 'primaria');
  switch (p.tipo) {
    case 'abertura': {
      const title = text(p.titulo, 120);
      return title ? { type: 'intro', title, subtitle: opt(p.subtitulo, 200), frames: seconds(p.segundos, 4.5) } : null;
    }
    case 'texto': {
      const body = text(p.texto, 260);
      return body ? { type: 'text', title: opt(p.rotulo, 60), body, frames: seconds(p.segundos, 5) } : null;
    }
    case 'lista': {
      const items = list<{ texto: string; icone: string }>(p.itens, 6).filter((i) => text(i?.texto));
      if (!items.length) return null;
      return {
        type: 'bullets',
        title: opt(p.titulo, 90),
        items: items.map((i) => text(i.texto, 120)),
        icons: items.map((i) => iconName(i.icone, i.texto, custom)),
        frames: seconds(p.segundos, 7),
      };
    }
    case 'numeros': {
      const items = list<{ valor: string; rotulo: string }>(p.itens, 4).filter((i) => text(i?.valor));
      if (!items.length) return null;
      return { type: 'stats', title: opt(p.titulo, 90), items: items.map((i) => ({ value: text(i.valor, 16), label: text(i.rotulo, 70) })), frames: seconds(p.segundos, 6) };
    }
    case 'grafico': {
      const items = list<{ rotulo: string; valor: number; exibicao: string }>(p.itens, 8).filter((i) => text(i?.rotulo) && Number.isFinite(i?.valor));
      if (items.length < 2) return null;
      return {
        type: 'chart',
        title: opt(p.titulo, 90),
        items: items.map((i) => ({ label: text(i.rotulo, 24), value: i.valor, display: text(i.exibicao, 16) || String(i.valor) })),
        frames: seconds(p.segundos, 7),
      };
    }
    case 'conversa': {
      const messages = list<{ quem: string; texto: string }>(p.mensagens, 4).filter((m) => text(m?.texto));
      if (!messages.length) return null;
      return {
        type: 'quote',
        title: opt(p.titulo, 90),
        messages: messages.map((m) => ({ from: m.quem === 'pessoa' ? ('voce' as const) : ('iaf' as const), text: text(m.texto, 200) })),
        frames: seconds(p.segundos, 9),
      };
    }
    case 'chamada': {
      const button = text(p.botao, 40) || text(p.titulo, 40);
      if (!button) return null;
      const url = text(p.url, 80).replace(/^https?:\/\//, '').replace(/\/$/, '');
      return { type: 'cta', title: text(p.titulo, 90) || button, body: opt(p.texto, 160), button, url: url || undefined, frames: seconds(p.segundos, 5.5) };
    }
    case 'etapas': {
      const items = list<{ titulo: string; texto: string; icone: string }>(p.itens, 5).filter((i) => text(i?.titulo));
      if (items.length < 2) return null;
      return {
        type: 'steps',
        title: opt(p.titulo, 90),
        items: items.map((i) => ({ title: text(i.titulo, 50), text: opt(i.texto, 110), icon: iconName(i.icone, `${i.titulo} ${i.texto}`, custom) })),
        surface,
        tint,
        frames: seconds(p.segundos, 8),
      };
    }
    case 'comparacao': {
      const side = (s: { rotulo: string; itens: string[] } | undefined, fallback: string) => ({
        label: text(s?.rotulo, 30) || fallback,
        items: list<string>(s?.itens, 4)
          .map((i) => text(i, 90))
          .filter(Boolean),
      });
      const before = side(p.antes, 'Antes');
      const after = side(p.depois, 'Depois');
      if (!before.items.length || !after.items.length) return null;
      return { type: 'compare', title: opt(p.titulo, 90), before, after, surface, frames: seconds(p.segundos, 8) };
    }
    case 'numero_destaque': {
      const value = text(p.valor, 14);
      if (!value) return null;
      return {
        type: 'bignumber',
        value,
        label: text(p.rotulo, 90),
        context: opt(p.contexto, 140),
        trend: pick(p.tendencia, ['sobe', 'desce', 'neutra'] as const, 'neutra'),
        icon: iconName(p.icone, p.rotulo, custom),
        surface,
        tint,
        frames: seconds(p.segundos, 5),
      };
    }
    case 'grade_icones': {
      const items = list<{ icone: string; rotulo: string; texto: string }>(p.itens, 6).filter((i) => text(i?.rotulo));
      if (items.length < 2) return null;
      return {
        type: 'icongrid',
        title: opt(p.titulo, 90),
        items: items.map((i) => ({ icon: iconName(i.icone, `${i.rotulo} ${i.texto}`, custom), label: text(i.rotulo, 40), text: opt(i.texto, 90) })),
        surface,
        tint,
        frames: seconds(p.segundos, 7),
      };
    }
    case 'impacto': {
      const t = text(p.texto, 140);
      return t ? { type: 'statement', kicker: opt(p.chamada, 40), text: t, surface, tint, frames: seconds(p.segundos, 4.5) } : null;
    }
    case 'depoimento': {
      const quote = text(p.citacao, 240);
      const author = text(p.autor, 50);
      return quote && author ? { type: 'testimonial', quote, author, role: opt(p.cargo, 60), surface, tint, frames: seconds(p.segundos, 7) } : null;
    }
    case 'composicao': {
      const elements: CompositionElement[] = [];
      for (const e of list<Extract<PlanScene, { tipo: 'composicao' }>['elementos'][number]>(p.elementos, 10)) {
        const kind = pick(e?.tipo, ['titulo', 'texto', 'icone', 'numero', 'selo', 'ilustracao', 'forma'] as const, 'texto');
        const t = text(e.texto, 160);
        if (['titulo', 'texto', 'numero', 'selo'].includes(kind) && !t) continue;
        const x = clampInt(e.x, 0, 11, 0);
        const y = clampInt(e.y, 0, 11, 0);
        elements.push({
          kind,
          text: t,
          icon: iconName(e.icone, t, custom),
          x,
          y,
          w: clampInt(e.largura, 1, 12 - x, 12 - x),
          h: clampInt(e.altura, 1, 12 - y, 2),
          align: pick(e.alinhamento, ['esquerda', 'centro', 'direita'] as const, 'esquerda'),
          color: pick(e.cor, ['primaria', 'secundaria', 'destaque', 'texto'] as const, 'texto'),
          size: pick(e.tamanho, ['p', 'm', 'g', 'gg'] as const, 'm'),
          enter: pick(e.entrada, ['subir', 'escala', 'desenhar', 'deslizar', 'digitar'] as const, 'subir'),
          order: clampInt(e.ordem, 0, 20, elements.length),
        });
      }
      return elements.some((e) => e.kind !== 'forma') ? { type: 'composition', elements, surface, frames: seconds(p.segundos, 6) } : null;
    }
    case 'interface':
      return uiScene(p, custom, surface, tint, report);
    case 'encerramento': {
      const url = text(p.url, 80).replace(/^https?:\/\//, '').replace(/\/$/, '');
      return { type: 'outro', slogan: opt(p.slogan, 120), url: url || undefined, frames: seconds(p.segundos, 4.5) };
    }
  }
  return null;
}

/* ---------- Tela de interface ---------- */

// Tamanho padrão de cada bloco na grade de 12 colunas (quando a IA manda algo fora do lugar).
const UI_SIZE: Record<UiBlockKind, [number, number]> = {
  indicador: [3, 1],
  grafico: [8, 2],
  tabela: [12, 2],
  lista: [6, 2],
  formulario: [6, 3],
  cartao: [4, 2],
  alerta: [12, 1],
  notificacao: [4, 1],
  conversa: [6, 3],
  progresso: [6, 2],
  busca: [8, 2],
};
const UI_MAX_ITEMS: Record<UiBlockKind, number> = {
  indicador: 0,
  grafico: 8,
  tabela: 6,
  lista: 6,
  formulario: 4,
  cartao: 0,
  alerta: 0,
  notificacao: 0,
  conversa: 6,
  progresso: 5,
  busca: 5,
};
// Em que blocos cada ação faz sentido.
const ACTION_ON: Record<UiAction['kind'], UiBlockKind[] | null> = {
  clicar: null,
  digitar: ['formulario', 'busca', 'conversa'],
  destacar: null,
  zoom: null,
  notificar: ['notificacao'],
};

function uiScene(p: Extract<PlanScene, { tipo: 'interface' }>, custom: Set<string>, surface: Surface, tint: Tint, report: Report): Scene | null {
  const ids = new Set<string>();
  const blocks: UiBlock[] = [];
  for (const raw of list<PlanUiBlock>(p.blocos, 12)) {
    if (!raw || typeof raw !== 'object') continue;
    const kind = pick(raw.tipo, UI_BLOCKS, 'cartao');
    const max = UI_MAX_ITEMS[kind];
    const chat = kind === 'conversa';
    const items: UiItem[] = list<PlanUiBlock['itens'][number]>(raw.itens, max)
      .filter((i) => text(i?.rotulo) || text(i?.valor))
      .map((i) => ({
        label: text(i.rotulo, chat ? 30 : 42),
        value: text(i.valor, chat ? 170 : 44),
        detail: opt(i.detalhe, 44),
        status: i.status && STATUS.includes(i.status) ? i.status : undefined,
      }));
    const title = opt(raw.titulo, 48);
    const value = opt(raw.valor, 26);
    // Bloco sem nada para mostrar fica de fora.
    if (!title && !value && !items.length && !text(raw.texto)) {
      report(`bloco "${text(raw.id, 24)}" (${kind}) está vazio`);
      continue;
    }
    if ((kind === 'tabela' || kind === 'lista' || kind === 'grafico' || kind === 'progresso' || kind === 'formulario') && !items.length && !(kind === 'grafico' && Array.isArray(raw.serie) && raw.serie.length > 1)) {
      report(`bloco "${text(raw.id, 24)}" (${kind}) precisa de itens`);
      continue;
    }
    let id = text(raw.id, 24).toLowerCase().replace(/[^a-z0-9_-]/g, '') || `b${blocks.length + 1}`;
    while (ids.has(id)) id += 'x';
    ids.add(id);
    const [dw, dh] = UI_SIZE[kind];
    blocks.push({
      id,
      kind,
      w: clampInt(raw.largura, 2, 12, dw),
      h: clampInt(raw.altura, 1, 4, dh),
      title,
      text: opt(raw.texto, 130),
      icon: iconName(raw.icone, `${raw.titulo} ${raw.texto}`, custom),
      value,
      delta: opt(raw.variacao, 16),
      trend: pick(raw.tendencia, ['sobe', 'desce', 'neutra'] as const, 'neutra'),
      variant: pick(raw.variante, ['barras', 'area', 'rosca'] as const, 'barras'),
      status: pick(raw.status, STATUS, 'neutro'),
      items,
      series: list<number>(raw.serie, 24).filter((n) => typeof n === 'number' && Number.isFinite(n)),
      columns: list<string>(raw.colunas, 4).map((c) => text(c, 24)),
      button: opt(raw.botao, 28),
    });
    if (blocks.filter((b) => b.kind !== 'notificacao').length >= 8) break;
  }
  if (!blocks.some((b) => b.kind !== 'notificacao')) return null;
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const actions: UiAction[] = [];
  for (const a of list<{ alvo: string; acao: string; texto: string }>(p.acoes, 6)) {
    const target = text(a?.alvo, 24).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const kind = pick(a?.acao, UI_ACTIONS, 'destacar');
    const b = byId.get(target);
    if (!b) {
      report(`ação "${kind}" aponta para o bloco "${target}", que não existe`);
      continue;
    }
    const allowed = ACTION_ON[kind];
    if ((allowed && !allowed.includes(b.kind)) || (kind !== 'notificar' && b.kind === 'notificacao')) {
      report(`ação "${kind}" não serve para o bloco "${target}" (${b.kind})`);
      continue;
    }
    actions.push({ target, kind, text: opt(a.texto, 120) });
  }
  const url = text(p.endereco, 60).replace(/^https?:\/\//, '').replace(/\/$/, '');
  return {
    type: 'ui',
    title: opt(p.titulo, 90),
    device: pick(p.moldura, ['navegador', 'app', 'celular'] as const, 'navegador'),
    url: url || undefined,
    screen: opt(p.tela, 30),
    menu: list<{ rotulo: string; icone: string }>(p.menu, 6)
      .filter((m) => text(m?.rotulo))
      .map((m) => ({ label: text(m.rotulo, 20), icon: iconName(m.icone, m.rotulo, custom) })),
    blocks,
    actions,
    surface,
    tint,
    frames: seconds(p.segundos, 8),
  };
}

// Revisão do plano: o que foi descartado ou não cabe. Vazio = plano bom.
export function planIssues(plan: Plan, opts: PlanOptions = {}): string[] {
  const issues: string[] = [];
  const custom = new Set(sanitizeIcons(plan?.icones).map((i) => i.name));
  const cenas = list<PlanScene>(plan?.cenas, 24);
  if (!cenas.length) return ['o plano não tem cenas'];
  const scenes: Scene[] = [];
  cenas.forEach((p, i) => {
    const where = `cena ${i + 1}`;
    if (!p || typeof p !== 'object' || !SCENE_KINDS.includes(p.tipo)) {
      issues.push(`${where}: tipo "${(p as { tipo?: string })?.tipo}" não existe`);
      return;
    }
    const scene = toScene(p, custom, (m) => issues.push(`${where} (${p.tipo}): ${m}`));
    if (!scene) issues.push(`${where} (${p.tipo}) ficou vazia: faltam os campos principais`);
    else scenes.push(scene);
    if (i > 0 && cenas[i - 1]?.tipo === p.tipo && p.tipo !== 'interface') issues.push(`${where} repete o tipo "${p.tipo}" da cena anterior`);
  });
  // Mesma conta do vídeo final: com o encerramento da marca e a sobreposição das transições.
  if (opts.closing !== false && !scenes.some((s) => s.type === 'outro')) scenes.push({ type: 'outro', frames: Math.round(4.5 * FPS) });
  const total = totalFrames(scenes) / FPS;
  const max = opts.maxSeconds ?? theme.video.maxSeconds;
  if (total > max + 1) issues.push(`o vídeo soma ${Math.round(total)} s e o limite é ${max} s: encurte ou tire cenas`);
  return issues;
}

export type PlanOptions = { closing?: boolean; maxSeconds?: number };

// Plano → cenas prontas para o vídeo (com encerramento da marca e limite de duração garantidos).
// `origin` diz de qual cena do plano veio cada cena do vídeo (-1 = encerramento acrescentado).
export function planToScenes(plan: Plan, opts: PlanOptions = {}): { scenes: Scene[]; origin: number[]; icons: CustomIcon[]; rhythm: Rhythm } {
  const icons = sanitizeIcons(plan?.icones);
  const custom = new Set(icons.map((i) => i.name));
  const converted = list<PlanScene>(plan?.cenas, 24)
    .map((p, i) => ({ scene: p && typeof p === 'object' ? toScene(p, custom) : null, i }))
    .filter((x): x is { scene: Scene; i: number } => x.scene !== null);
  // O encerramento com a marca fica sempre no fim (a não ser que o roteiro peça "encerramento: false").
  const body = converted.filter((x) => x.scene.type !== 'outro');
  const outro = converted.find((x) => x.scene.type === 'outro') ?? { scene: { type: 'outro' as const, frames: Math.round(4.5 * FPS) }, i: -1 };
  const all = opts.closing === false ? body : [...body, outro];
  if (!all.length) throw new Error('A IA não devolveu nenhuma cena utilizável. Tente de novo.');
  const out = all.map((x) => x.scene);
  fitToLimit(out, opts.maxSeconds ?? theme.video.maxSeconds);
  return {
    scenes: out,
    origin: all.map((x) => x.i),
    icons: icons.filter((i) => usesIcon(out, i.name)),
    rhythm: pick(plan?.ritmo, ['calmo', 'equilibrado', 'energico'] as const, 'equilibrado'),
  };
}

const usesIcon = (scenes: Scene[], name: string) => JSON.stringify(scenes).includes(`"${name}"`);
