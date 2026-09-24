// Plano de vídeo montado pela IA: o formato que ela devolve (JSON Schema) e a conversão,
// com validação, para as cenas que o Remotion desenha. Nada aqui confia no que a IA mandou:
// tamanhos de lista, números, ícones e posições são conferidos e ajustados.
import { ICON_NAMES, iconFor } from '../components/Icons';
import { fitToLimit } from '../parse';
import { theme } from '../theme';
import type { CompositionElement, CustomIcon, Rhythm, Scene, Surface, Tint } from '../types';

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
  | { tipo: 'encerramento'; segundos: number; slogan: string; url: string };

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
export function toScene(p: PlanScene, custom: Set<string>): Scene | null {
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
    case 'encerramento': {
      const url = text(p.url, 80).replace(/^https?:\/\//, '').replace(/\/$/, '');
      return { type: 'outro', slogan: opt(p.slogan, 120), url: url || undefined, frames: seconds(p.segundos, 4.5) };
    }
  }
  return null;
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
