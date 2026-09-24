// Roteiro (.md) + plano da IA (quando houver) → especificação do vídeo.
import { planToScenes, type StoredPlan } from './ai/plan';
import { parseMarkdown, scriptOptions } from './parse';
import type { VideoSpec } from './types';

export type SpecSource = 'regras' | 'ia';

// `ai` força a montagem com IA mesmo sem "montagem: ia" no roteiro (opção --ia da linha de comando).
export function buildSpec(markdown: string, stored?: StoredPlan | null, ai = false): VideoSpec & { source: SpecSource; origin?: number[] } {
  const opts = scriptOptions(markdown);
  if (!(opts.ai || ai) || !stored) return { ...parseMarkdown(markdown), source: 'regras' };
  // Na montagem com IA o texto pode ser livre: as regras do .md não precisam valer.
  const { scenes, origin, icons, rhythm } = planToScenes(stored.plano, { closing: opts.closing, maxSeconds: opts.maxSeconds });
  return { format: opts.format, sfx: opts.sfx, scenes, icons, rhythm, ...(opts.marca ? { marca: opts.marca } : {}), source: 'ia', origin };
}
