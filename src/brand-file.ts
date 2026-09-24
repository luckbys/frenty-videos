// Perfis de marca em disco (linha de comando e app). Roda só no Node, fora do vídeo.
import fs from 'node:fs';
import path from 'node:path';
import { normalizeBrand, type Brand } from './brand';

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};
export const LOGO_EXTENSIONS = Object.keys(MIME).map((e) => e.slice(1));
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function logoToDataUrl(file: string) {
  const ext = path.extname(file).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`Formato de logo não suportado (${ext || 'sem extensão'}). Use SVG, PNG, JPG ou WEBP.`);
  const buf = fs.readFileSync(file);
  if (buf.length > MAX_LOGO_BYTES) throw new Error(`O logo "${path.basename(file)}" tem mais de 2 MB. Use um SVG ou um PNG menor.`);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// Lê um perfil .json. Os logos podem ser data URLs ou caminhos ("logo.svg") relativos ao próprio .json.
export function readBrandFile(file: string): Brand {
  let raw: Partial<Brand> & { logo?: Record<string, unknown> };
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`Não consegui ler o perfil de marca ${file}: ${e instanceof Error ? e.message : e}`);
  }
  const dir = path.dirname(file);
  for (const k of ['arquivoClaro', 'arquivoEscuro'] as const) {
    const v = raw.logo?.[k];
    if (typeof v === 'string' && v && !v.startsWith('data:')) raw.logo![k] = logoToDataUrl(path.resolve(dir, v));
  }
  return normalizeBrand({ ...raw, id: raw.id || path.basename(file, '.json') } as Partial<Brand>);
}
