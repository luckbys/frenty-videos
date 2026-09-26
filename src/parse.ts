import matter from 'gray-matter';
import { marked, type Token, type Tokens } from 'marked';
import { totalFrames } from './parse-duration';
import { formats, theme, type FormatName } from './theme';
import type { ChatMessage, Scene, VideoSpec } from './types';

type Draft = { title?: string; tokens: Token[] };

const FPS = theme.video.fps;
const MAX_FRAMES = theme.video.maxSeconds * FPS;
const MIN_SCENE_FRAMES = Math.round(2.5 * FPS);

// Remove markdown inline mantendo **negrito** (usado para destaque em cor).
const clean = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1$2')
    .replace(/__([^_]+)__/g, '**$1**')
    .replace(/\s+/g, ' ')
    .trim();

const words = (s: string) => s.replace(/\*/g, '').split(/\s+/).filter(Boolean).length;
const sec = (s: number) => Math.round(s * FPS);

const directive = (tokens: Token[], key: string) => {
  for (const t of tokens) {
    if (t.type !== 'html') continue;
    const m = t.raw.match(new RegExp(`<!--\\s*${key}\\s*:\\s*([^\\s>]+)\\s*-->`, 'i'));
    if (m) return m[1].toLowerCase();
  }
  return undefined;
};

const STAT_RE = /^\*\*([^*]*\d[^*]*)\*\*\s*[:\-–—]?\s*(.*)$/;
// "Janeiro: 120" / "Jan — R$ 45 mil" / "Loja A: **32%**" → gráfico de barras.
const CHART_RE = /^(.+?)\s*[:–—]\s*\**\s*((?:R\$\s*)?[+-]?\d[\d.,]*\s*(?:%|k|mil|mi|h|x)?)\s*\**$/i;

const toNumber = (s: string) => {
  const m = s.match(/[+-]?\d[\d.,]*/);
  if (!m) return 0;
  const raw = m[0];
  // 1.234,5 (pt-BR) ou 1234.5
  const n = raw.includes(',') ? Number(raw.replace(/\./g, '').replace(',', '.')) : Number(raw.replace(/\.(?=\d{3}(\D|$))/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// "**Você:**" / "Cliente:" = pessoa; qualquer outro nome em negrito ("**IAF:**", "**Sofia:**") = assistente da marca.
const SPEAKER_RE = /^(?:\*\*\s*([^*:]{1,24}?)\s*(?::\s*\*\*|\*\*\s*:)|(você|voce|eu|lojista|cliente|usuário|usuario|iaf)\s*:)\s*/i;
const PERSON = /^(você|voce|eu|lojista|cliente|usuário|usuario)$/i;

function chatMessages(text: string): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const raw of text.split(/\n+/)) {
    const line = raw.replace(/^>\s?/, '').trim();
    if (!line) continue;
    const m = line.match(SPEAKER_RE);
    if (m) out.push({ from: PERSON.test((m[1] ?? m[2]).trim()) ? 'voce' : 'iaf', text: clean(line.slice(m[0].length)) });
    else if (out.length) out[out.length - 1].text += ' ' + clean(line);
    else out.push({ from: 'iaf', text: clean(line) });
  }
  return out.slice(0, 4);
}

function buildScene(d: Draft): Scene | null {
  const t = d.tokens;
  const title = d.title ? clean(d.title) : undefined;
  const forced = directive(t, 'tipo');
  const forcedSec = directive(t, 'duracao');

  const paragraphs = t.filter((x): x is Tokens.Paragraph => x.type === 'paragraph');
  const list = t.find((x): x is Tokens.List => x.type === 'list');
  const quote = t.find((x): x is Tokens.Blockquote => x.type === 'blockquote');
  const body = paragraphs.map((p) => clean(p.text)).join(' ');
  const link = paragraphs.flatMap((p) => p.tokens ?? []).find((x): x is Tokens.Link => x.type === 'link');
  const items = list ? list.items.map((i) => clean(i.text)) : [];
  const allStats = items.length > 0 && items.every((i) => STAT_RE.test(i));
  const allChart = items.length >= 2 && items.every((i) => CHART_RE.test(i));

  let scene: Scene | null = null;
  const type =
    forced ??
    (link ? 'cta' : quote ? 'quote' : allStats ? 'stats' : allChart ? 'grafico' : list ? 'bullets' : body || title ? 'text' : null);

  switch (type) {
    case 'chamada':
    case 'cta': {
      const button = link ? clean(link.text) : title ?? 'Saiba mais';
      const rest = clean(body.replace(button, '')).replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, '');
      scene = {
        type: 'cta',
        title: title ?? button,
        body: rest || undefined,
        button,
        url: link?.href.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        frames: sec(5.5),
      };
      break;
    }
    case 'quote':
    case 'iaf':
    case 'conversa': {
      const messages = chatMessages(quote ? quote.text : body);
      if (!messages.length) return null;
      const w = messages.reduce((a, m) => a + words(m.text), 0);
      scene = { type: 'quote', title, messages, frames: sec(Math.min(14, 2 + messages.length * 1.4 + w * 0.22)) };
      break;
    }
    case 'chart':
    case 'grafico': {
      const bars = items
        .map((i) => i.replace(/\*\*/g, '').match(CHART_RE))
        .filter((m): m is RegExpMatchArray => !!m)
        .map((m) => ({ label: m[1].trim(), display: m[2].trim(), value: toNumber(m[2]) }));
      if (!bars.length) return null;
      scene = { type: 'chart', title, items: bars.slice(0, 8), frames: sec(Math.min(10, 3 + bars.length * 0.7)) };
      break;
    }
    case 'numeros':
    case 'stats': {
      const stats = items.map((i) => {
        const m = i.match(STAT_RE);
        return m ? { value: m[1].trim(), label: m[2].trim() } : { value: i, label: '' };
      });
      scene = { type: 'stats', title, items: stats.slice(0, 4), frames: sec(2.5 + stats.length * 1.4) };
      break;
    }
    case 'lista':
    case 'bullets': {
      const w = items.reduce((a, i) => a + words(i), 0);
      scene = { type: 'bullets', title, items: items.slice(0, 6), frames: sec(Math.min(12, 2 + items.length * 1.1 + w * 0.15)) };
      break;
    }
    case 'texto':
    case 'text': {
      const text = body || title || '';
      scene = { type: 'text', title: body ? title : undefined, body: text, frames: sec(Math.min(9, 2.5 + words(text) * 0.3)) };
      break;
    }
    default:
      return null;
  }
  if (forcedSec && !Number.isNaN(Number(forcedSec))) scene.frames = sec(Number(forcedSec));
  return scene;
}

export function parseMarkdown(source: string): VideoSpec {
  const { data, content } = matter(source);
  const fmt = String(data.formato ?? data.format ?? 'horizontal').toLowerCase() as FormatName;
  if (!(fmt in formats)) throw new Error(`Formato "${fmt}" inválido. Use: ${Object.keys(formats).join(', ')}.`);

  const tokens = marked.lexer(content);
  let introTitle: string | undefined = data.titulo ?? data.title;
  const introBody: string[] = [];
  const drafts: Draft[] = [];
  let current: Draft | null = null;

  for (const tok of tokens) {
    if (tok.type === 'heading' && tok.depth === 1) {
      introTitle ??= tok.text;
      continue;
    }
    if (tok.type === 'heading' && tok.depth >= 2) {
      current = { title: tok.text, tokens: [] };
      drafts.push(current);
      continue;
    }
    if (tok.type === 'hr' || tok.type === 'space') continue;
    if (current) current.tokens.push(tok);
    else if (tok.type === 'paragraph') introBody.push(tok.text);
  }

  const scenes: Scene[] = [];
  if (introTitle) {
    const subtitle = data.subtitulo ?? data.subtitle ?? (introBody.length ? introBody.join(' ') : undefined);
    scenes.push({ type: 'intro', title: clean(introTitle), subtitle: subtitle ? clean(subtitle) : undefined, frames: sec(4.5) });
  }
  for (const d of drafts) {
    const s = buildScene(d);
    if (s) scenes.push(s);
  }
  if (data.encerramento !== false) {
    const cta = scenes.find((x): x is Extract<Scene, { type: 'cta' }> => x.type === 'cta');
    const url = data.site ?? cta?.url;
    // Sem slogan/site no .md, a cena final usa os do perfil da marca.
    scenes.push({ type: 'outro', slogan: data.slogan ? String(data.slogan) : undefined, url: url ? String(url) : undefined, frames: sec(4.5) });
  }
  if (scenes.length === 0) throw new Error('O .md não tem conteúdo. Use # para o título e ## para cada cena.');

  fitToLimit(scenes, Number(data.duracao_maxima ?? theme.video.maxSeconds));
  const sfx = data.efeitos_sonoros ?? data.sons ?? true;
  const marca = data.marca ? String(data.marca).trim() : undefined;
  return { format: fmt, sfx: sfx !== false && sfx !== 'nao' && sfx !== 'não', scenes, ...(marca ? { marca } : {}) };
}

// Garante o limite (padrão 90s) encurtando as cenas proporcionalmente.
export function fitToLimit(scenes: Scene[], maxSeconds: number) {
  const limit = Math.min(MAX_FRAMES, Math.round(maxSeconds * FPS));
  const total = totalFrames(scenes);
  if (total <= limit) return;
  const overlap = theme.video.transitionFrames * (scenes.length - 1);
  const floor = MIN_SCENE_FRAMES * scenes.length - overlap;
  if (floor > limit) {
    const t = theme.video.transitionFrames;
    const maxScenes = Math.floor((limit - t) / (MIN_SCENE_FRAMES - t));
    throw new Error(
      `Conteúdo demais para ${limit / FPS}s: ${scenes.length} cenas. Reduza para no máximo ~${maxScenes} cenas (## ...).`,
    );
  }
  const ratio = (limit + overlap) / (total + overlap);
  for (const s of scenes) s.frames = Math.max(MIN_SCENE_FRAMES, Math.floor(s.frames * ratio));
  // Ajuste fino caso o piso mínimo tenha empurrado o total acima do limite.
  let excess = totalFrames(scenes) - limit;
  while (excess > 0) {
    const longest = scenes.reduce((a, b) => (b.frames > a.frames ? b : a));
    const cut = Math.min(excess, longest.frames - MIN_SCENE_FRAMES);
    if (cut <= 0) break;
    longest.frames -= cut;
    excess -= cut;
  }
}

// Opções do cabeçalho que a montagem com IA também respeita.
export function scriptOptions(source: string) {
  const { data, content } = matter(source);
  const m = String(data.montagem ?? '').toLowerCase();
  const fmt = String(data.formato ?? data.format ?? 'horizontal').toLowerCase();
  const sfx = data.efeitos_sonoros ?? data.sons ?? true;
  const voice = data.narracao ?? data.voz ?? true;
  return {
    format: (fmt in formats ? fmt : 'horizontal') as FormatName,
    sfx: sfx !== false && sfx !== 'nao' && sfx !== 'não',
    voice: voice !== false && voice !== 'nao' && voice !== 'não',
    marca: data.marca ? String(data.marca).trim() : undefined,
    ai: m === 'ia' || m === 'ai',
    closing: data.encerramento !== false,
    maxSeconds: Number(data.duracao_maxima ?? theme.video.maxSeconds) || theme.video.maxSeconds,
    body: content.trim(),
  };
}
