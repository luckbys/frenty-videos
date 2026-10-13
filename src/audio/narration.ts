// Texto falado de cada cena (o que está na tela, sem marcação) e a chamada ao ElevenLabs
// que gera o áudio, guarda em cache e estica a cena para a fala nunca ser cortada.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { theme } from '../theme';
import type { Scene } from '../types';
import { DEFAULT_MODEL, synthesize } from './elevenlabs';

const plain = (s?: string) =>
  (s ?? '')
    .replace(/\*\*/g, '')
    .replace(/[_*`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const join = (...parts: (string | undefined)[]) => parts.map(plain).filter(Boolean).join('. ');

// O que a voz lê em cada tipo de cena: o texto de narração escrito para ela ou, sem ele, o texto visível,
// na ordem em que aparece na tela.
export function narrationText(scene: Scene): string {
  if (plain(scene.narration)) return plain(scene.narration);
  switch (scene.type) {
    case 'intro':
      return join(scene.title, scene.subtitle);
    case 'text':
      return join(scene.title, scene.body);
    case 'bullets':
      return join(scene.title, ...scene.items);
    case 'stats':
      return join(scene.title, ...scene.items.map((i) => `${i.value}: ${i.label}`));
    case 'chart':
      return join(scene.title, ...scene.items.map((i) => `${i.label}: ${i.display}`));
    case 'quote':
      return join(scene.title, ...scene.messages.map((m) => m.text));
    case 'cta':
      return join(scene.title, scene.body, scene.button);
    case 'outro':
      return join(scene.slogan);
    case 'steps':
      return join(scene.title, ...scene.items.map((i) => join(i.title, i.text)));
    case 'compare':
      return join(scene.before.label, ...scene.before.items, scene.after.label, ...scene.after.items);
    case 'bignumber':
      return join(`${scene.value} ${scene.label}`, scene.context);
    case 'icongrid':
      return join(scene.title, ...scene.items.map((i) => join(i.label, i.text)));
    case 'statement':
      return join(scene.kicker, scene.text);
    case 'testimonial':
      return join(scene.quote, scene.author);
    case 'composition':
      return join(
        ...scene.elements
          .filter((e) => e.kind === 'titulo' || e.kind === 'texto')
          .sort((a, b) => a.order - b.order)
          .map((e) => e.text),
      );
    case 'ui':
      return join(scene.title || scene.screen);
    default:
      return '';
  }
}

export type NarrationTrack = { index: number; src: string; frames: number };

export type NarrationOptions = {
  apiKey: string;
  voiceId: string;
  model?: string;
  cacheDir?: string; // reaproveita o áudio já gerado para o mesmo texto e voz (evita gastar créditos à toa)
  signal?: AbortSignal;
  onProgress?: (p: { done: number; total: number }) => void;
};

// Folga depois da fala antes de trocar de cena, e o mínimo que uma cena fica na tela com narração.
const PAD_FRAMES = 8;

type Cached = { src: string; seconds: number };

// Cenas com a duração esticada para caber a fala (nunca encolhe) + as faixas de áudio, uma por cena narrada.
export async function buildNarration(scenes: Scene[], opts: NarrationOptions): Promise<{ scenes: Scene[]; tracks: NarrationTrack[] }> {
  const fps = theme.video.fps;
  const out = scenes.slice();
  const tracks: NarrationTrack[] = [];
  const targets = scenes.map((s, index) => ({ index, text: narrationText(s) })).filter((t) => t.text);
  let done = 0;
  for (const { index, text } of targets) {
    const key = crypto.createHash('sha1').update(`${opts.voiceId}\n${opts.model || DEFAULT_MODEL}\n${text}`).digest('hex');
    const cacheFile = opts.cacheDir ? path.join(opts.cacheDir, `${key}.json`) : undefined;
    let cached: Cached | undefined;
    if (cacheFile && fs.existsSync(cacheFile)) {
      try {
        cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      } catch {}
    }
    if (!cached) {
      const r = await synthesize({ apiKey: opts.apiKey, voiceId: opts.voiceId, model: opts.model, text, signal: opts.signal });
      cached = { src: `data:audio/mpeg;base64,${r.buffer.toString('base64')}`, seconds: r.seconds };
      if (cacheFile) {
        fs.mkdirSync(opts.cacheDir!, { recursive: true });
        fs.writeFileSync(cacheFile, JSON.stringify(cached));
      }
    }
    const spoken = Math.round(cached.seconds * fps);
    out[index] = { ...out[index], frames: Math.max(out[index].frames, spoken + PAD_FRAMES) } as Scene;
    tracks.push({ index, src: cached.src, frames: spoken });
    done++;
    opts.onProgress?.({ done, total: targets.length });
  }
  return { scenes: out, tracks };
}
