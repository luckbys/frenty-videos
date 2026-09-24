// Biblioteca de vídeos: cada vídeo é uma pasta com roteiro.md, video.json, o MP4 e a miniatura.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { planIsStale } from '../src/ai/director';
import type { StoredPlan } from '../src/ai/plan';
import { FRENTY, type Brand } from '../src/brand';
import { scriptOptions } from '../src/parse';
import { totalFrames } from '../src/parse-duration';
import { buildSpec } from '../src/spec';
import { theme } from '../src/theme';
import type { AiInfo, NewVideo, ParseResult, VideoMeta } from './api';
import { BrandStore } from './brands';
import { setFormat, setFrontmatter } from './markdown';
import { slugify } from './slug';

type Stored = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  renderedAt?: string;
  renderedHash?: string;
  videoFile?: string;
};

const SCRIPT = 'roteiro.md';
const PLAN = 'plano-ia.json';
const META = 'video.json';
const THUMB = 'miniatura.jpg';

export const hash = (s: string) => crypto.createHash('sha1').update(s).digest('hex');

// Marca d'água do que foi gerado: roteiro + perfil de marca. Mudar qualquer um marca o vídeo como alterado.
// (Com o perfil Frenty original, vale só o roteiro, como antes dos perfis existirem.)
// Na montagem com IA, o plano também entra: remontar marca o vídeo como desatualizado.
const FRENTY_JSON = JSON.stringify(FRENTY);
export const stamp = (markdown: string, brand: Brand, plan?: StoredPlan | null) => {
  const json = JSON.stringify(brand);
  const base = json === FRENTY_JSON ? markdown : `${markdown}\n${json}`;
  return hash(plan && scriptOptions(markdown).ai ? `${base}\n${JSON.stringify(plan.plano)}` : base);
};

const aiInfo = (markdown: string, plan: StoredPlan | null, origin?: number[]): AiInfo => {
  const o = scriptOptions(markdown);
  return {
    enabled: o.ai,
    hasPlan: !!plan,
    stale: !!plan && planIsStale(plan, markdown),
    formatChanged: !!plan && plan.formato !== o.format,
    summary: plan?.plano.resumo,
    instruction: plan?.instrucao,
    generatedAt: plan?.geradoEm,
    origin,
  };
};

export function parse(markdown: string, plan: StoredPlan | null = null): ParseResult {
  try {
    const { source, origin, ...spec } = buildSpec(markdown, plan);
    return { ok: true, spec, seconds: totalFrames(spec.scenes) / theme.video.fps, ai: aiInfo(markdown, plan, source === 'ia' ? origin : undefined) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), ai: aiInfo(markdown, plan) };
  }
}

const TEMPLATES = {
  branco: (name: string, site: string) => `---
formato: horizontal
---

# ${name}

Uma frase curta de apoio ao título.

## Primeira cena

Escreva aqui a mensagem principal. Use **negrito** para destacar.

## Comece hoje

Fale com a gente. [Agende uma demonstração](https://${site || 'seusite.com.br'})
`,
  exemplo: (name: string, root: string) =>
    fs
      .readFileSync(path.join(root, 'exemplos', 'lancamento-iaf.md'), 'utf8')
      .replace(/^# .*$/m, `# ${name}`),
};

export class Library {
  readonly brands: BrandStore;

  constructor(
    public root: string,
    private appRoot: string,
    private isRendering: (id: string) => boolean,
  ) {
    fs.mkdirSync(root, { recursive: true });
    this.brands = new BrandStore(root);
  }

  // Roteiro pronto para gerar: spec com o perfil de marca já embutido.
  prepare(id: string) {
    const md = this.markdown(id);
    const plan = this.plan(id);
    const p = parse(md, plan);
    if (!p.ok) return p;
    const brand = this.brands.resolve(p.spec.marca);
    return { ok: true as const, spec: { ...p.spec, brand }, stamp: stamp(md, brand, plan) };
  }

  // Plano salvo pela montagem com IA (ou null).
  plan(id: string): StoredPlan | null {
    const f = path.join(this.dir(id), PLAN);
    try {
      return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
    } catch {
      return null;
    }
  }

  savePlan(id: string, plan: StoredPlan) {
    fs.writeFileSync(path.join(this.dir(id), PLAN), JSON.stringify(plan, null, 2));
    const s = this.read(id);
    this.write({ ...s, updatedAt: new Date().toISOString() });
  }

  parseFor(id: string, markdown: string) {
    return parse(markdown, this.plan(id));
  }

  private dir(id: string) {
    const d = path.join(this.root, id);
    if (!d.startsWith(this.root + path.sep) || !fs.existsSync(path.join(d, META))) throw new Error('Vídeo não encontrado.');
    return d;
  }

  private read(id: string): Stored {
    return JSON.parse(fs.readFileSync(path.join(this.dir(id), META), 'utf8'));
  }

  private write(s: Stored) {
    fs.writeFileSync(path.join(this.root, s.id, META), JSON.stringify(s, null, 2));
  }

  markdown(id: string) {
    return fs.readFileSync(path.join(this.dir(id), SCRIPT), 'utf8');
  }

  videoPath(id: string) {
    const s = this.read(id);
    return s.videoFile ? path.join(this.dir(id), s.videoFile) : null;
  }

  outputFor(id: string) {
    const s = this.read(id);
    return { video: path.join(this.dir(id), `${slugify(s.name)}.mp4`), thumb: path.join(this.dir(id), THUMB) };
  }

  meta(id: string): VideoMeta {
    const s = this.read(id);
    const d = this.dir(id);
    const md = this.markdown(id);
    const plan = this.plan(id);
    const p = parse(md, plan);
    const video = s.videoFile && fs.existsSync(path.join(d, s.videoFile)) ? path.join(d, s.videoFile) : null;
    const thumb = fs.existsSync(path.join(d, THUMB)) ? path.join(d, THUMB) : null;
    const bust = s.renderedAt ? `?v=${Date.parse(s.renderedAt)}` : '';
    const brand = this.brands.resolve(p.ok ? p.spec.marca : undefined);
    const status = this.isRendering(id) ? 'gerando' : !video ? 'rascunho' : s.renderedHash === stamp(md, brand, plan) ? 'pronto' : 'alterado';
    return {
      id: s.id,
      name: s.name,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      renderedAt: s.renderedAt,
      format: p.ok ? p.spec.format : (md.match(/^formato\s*:\s*(\w+)/m)?.[1] ?? 'horizontal'),
      seconds: p.ok ? p.seconds : null,
      status,
      brandId: brand.id,
      brandName: brand.nome,
      ai: p.ai?.enabled ?? false,
      videoUrl: video ? pathToFileURL(video).href + bust : undefined,
      thumbUrl: thumb ? pathToFileURL(thumb).href + bust : undefined,
    };
  }

  list(): VideoMeta[] {
    return fs
      .readdirSync(this.root, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(this.root, e.name, META)))
      .map((e) => {
        try {
          return this.meta(e.name);
        } catch {
          return null;
        }
      })
      .filter((m): m is VideoMeta => m !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private newId(name: string) {
    return `${slugify(name)}-${crypto.randomBytes(3).toString('hex')}`;
  }

  createFromMarkdown(name: string, markdown: string): VideoMeta {
    const id = this.newId(name);
    const now = new Date().toISOString();
    fs.mkdirSync(path.join(this.root, id));
    fs.writeFileSync(path.join(this.root, id, SCRIPT), markdown);
    this.write({ id, name, createdAt: now, updatedAt: now });
    return this.meta(id);
  }

  create({ name, format, template, brandId, brief }: NewVideo): VideoMeta {
    const clean = name.trim() || 'Novo vídeo';
    const brand = this.brands.resolve(brandId);
    const md =
      template === 'ia'
        ? `---\nformato: horizontal\nmontagem: ia\n---\n\n# ${clean}\n\n${(brief ?? '').trim() || 'Descreva aqui o que o vídeo deve comunicar.'}\n`
        : template === 'exemplo'
          ? TEMPLATES.exemplo(clean, this.appRoot)
          : TEMPLATES.branco(clean, brand.site);
    // Só grava "marca:" quando é diferente da padrão, para o roteiro seguir a padrão se ela mudar.
    const withBrand = brandId && brandId !== this.brands.defaultId ? setFrontmatter(md, 'marca', brand.id) : md;
    return this.createFromMarkdown(clean, setFormat(withBrand, format));
  }

  importFile(file: string): VideoMeta {
    const md = fs.readFileSync(file, 'utf8');
    const title = md.match(/^#\s+(.+)$/m)?.[1]?.replace(/\*/g, '').trim();
    return this.createFromMarkdown(title || path.basename(file, path.extname(file)), md);
  }

  save(id: string, markdown: string): VideoMeta {
    const s = this.read(id);
    fs.writeFileSync(path.join(this.dir(id), SCRIPT), markdown);
    this.write({ ...s, updatedAt: new Date().toISOString() });
    return this.meta(id);
  }

  rename(id: string, name: string): VideoMeta {
    const s = this.read(id);
    this.write({ ...s, name: name.trim() || s.name, updatedAt: new Date().toISOString() });
    return this.meta(id);
  }

  duplicate(id: string): VideoMeta {
    const s = this.read(id);
    const copy = this.createFromMarkdown(`${s.name} (cópia)`, this.markdown(id));
    const plan = this.plan(id);
    if (plan) this.savePlan(copy.id, plan);
    return this.meta(copy.id);
  }

  remove(id: string) {
    fs.rmSync(this.dir(id), { recursive: true, force: true });
  }

  markRendered(id: string, videoFile: string, renderedHash: string): VideoMeta {
    const s = this.read(id);
    this.write({ ...s, videoFile: path.basename(videoFile), renderedHash, renderedAt: new Date().toISOString() });
    return this.meta(id);
  }
}
