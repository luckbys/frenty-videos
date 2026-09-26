// Uso: npm run render -- caminho/do/arquivo.md [saida.mp4] [--marca marcas/minha.json]
//      npm run render -- arquivo.md --ia [--refazer] [--pedido "mais dinâmico, foque nos números"]
//      npm run render -- arquivo.md --ia --provedor groq [--modelo qwen/qwen3.8-27b]
//      npm run preview -- caminho/do/arquivo.md   (só prepara e abre o Studio)
// Marca: --marca, depois "marca:" no topo do .md, depois marca.json na raiz do projeto; sem nada, Frenty.
// IA: com --ia (ou "montagem: ia" no topo do .md) as cenas são montadas pelo Claude e o plano fica salvo em
// arquivo.plano-ia.json, reaproveitado enquanto o texto do roteiro não mudar. Precisa de ANTHROPIC_API_KEY.
// Com --provedor groq (ou FRENTY_IA=groq) quem monta é o Groq; precisa de GROQ_API_KEY.
// Narração: com ELEVENLABS_API_KEY no ambiente, todo vídeo ganha voz automaticamente (a não ser que o
// .md tenha "narração: false" no topo, ou --sem-voz). --voz-id troca a voz (padrão: Rachel, multilíngue).
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { composeVideo, planIsStale } from '../src/ai/director';
import type { StoredPlan } from '../src/ai/plan';
import { buildNarration } from '../src/audio/narration';
import { DEFAULT_VOICE_ID, friendlyEleven } from '../src/audio/elevenlabs';
import { FRENTY, normalizeBrand } from '../src/brand';
import { readBrandFile } from '../src/brand-file';
import { scriptOptions } from '../src/parse';
import { buildSpec } from '../src/spec';
import { totalFrames } from '../src/parse-duration';
import { theme } from '../src/theme';

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const previewOnly = args[0] === '--preview';
if (previewOnly) args.shift();
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args.splice(i, 1), true) : false;
};
const brandArg = option('--marca');
const instruction = option('--pedido');
const redo = flag('--refazer');
const aiFlag = flag('--ia');
const provider = (option('--provedor') ?? process.env.FRENTY_IA ?? 'claude').toLowerCase() === 'groq' ? 'groq' : 'claude';
const model = option('--modelo') ?? process.env.GROQ_MODEL;
const semVoz = flag('--sem-voz');
const voiceId = option('--voz-id') ?? process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
const [input, outArg] = args;

if (!input) {
  console.error('Informe o arquivo .md. Ex.: npm run render -- exemplos/lancamento-iaf.md');
  process.exit(1);
}

const markdown = fs.readFileSync(path.resolve(input), 'utf8');
const opts = scriptOptions(markdown);
const planFile = path.resolve(input).replace(/\.[^./\\]+$/, '') + '.plano-ia.json';

// "loja" → marcas/loja.json; "x.json" → caminho relativo ao .md (ou à pasta atual).
function findBrand(ref: string, baseDir: string) {
  const tries = ref.endsWith('.json') ? [path.resolve(baseDir, ref), path.resolve(ref)] : [path.join(root, 'marcas', `${ref}.json`)];
  const file = tries.find((f) => fs.existsSync(f));
  if (!file) throw new Error(`Perfil de marca não encontrado: ${ref} (procurei em ${[...new Set(tries)].join(', ')})`);
  return file;
}
let brand = FRENTY;
try {
  const file = brandArg
    ? findBrand(brandArg, process.cwd())
    : opts.marca
      ? findBrand(opts.marca, path.dirname(path.resolve(input)))
      : fs.existsSync(path.join(root, 'marca.json'))
        ? path.join(root, 'marca.json')
        : undefined;
  if (file) brand = normalizeBrand(readBrandFile(file));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

// Montagem com IA: reaproveita o plano salvo se o texto não mudou (e não pediram para refazer).
async function loadPlan(): Promise<StoredPlan | null> {
  if (!aiFlag && !opts.ai) return null;
  const saved: StoredPlan | null = fs.existsSync(planFile) ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : null;
  if (saved && !redo && !instruction && !planIsStale(saved, markdown) && saved.formato === opts.format) {
    console.log(`Usando a montagem com IA salva em ${path.relative(process.cwd(), planFile)}`);
    return saved;
  }
  let last = '';
  const plan = await composeVideo({
    markdown,
    brand,
    format: opts.format,
    maxSeconds: opts.maxSeconds,
    instruction,
    provider,
    model,
    apiKey: provider === 'groq' ? process.env.GROQ_API_KEY : undefined,
    previous: instruction && saved ? saved.plano : undefined,
    onProgress: (p) => p.stage !== last && console.log(`IA: ${(last = p.stage)}...`),
  });
  fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
  console.log(`\nMontagem da IA: ${plan.plano.resumo}\n(salva em ${path.relative(process.cwd(), planFile)})`);
  return plan;
}

(async () => {
  const { source, ...built } = { ...buildSpec(markdown, await loadPlan(), aiFlag), brand };
  let spec = built;
  const voiceKey = process.env.ELEVENLABS_API_KEY;
  if (!semVoz && opts.voice && voiceKey) {
    let last = '';
    try {
      const { scenes, tracks } = await buildNarration(spec.scenes, {
        apiKey: voiceKey,
        voiceId,
        cacheDir: path.join(os.tmpdir(), 'frenty-narracao-cache'),
        onProgress: (p) => p.done !== Number(last) && console.log(`Narração: ${(last = String(p.done))}/${p.total}...`),
      });
      spec = { ...spec, scenes, narration: tracks };
      console.log(`\nNarração gerada para ${tracks.length} cena(s) com a voz do ElevenLabs.`);
    } catch (e) {
      throw friendlyEleven(e);
    }
  }
  fs.writeFileSync(path.join(root, 'src/ultimo-video.json'), JSON.stringify(spec, null, 2));

  const secs = totalFrames(spec.scenes) / theme.video.fps;
  console.log(`\n${spec.scenes.length} cenas · ${secs.toFixed(1)}s · formato ${spec.format} · marca ${brand.nome} · montagem ${source === 'ia' ? 'IA' : 'automática'}`);
  for (const s of spec.scenes) {
    const label = 'title' in s && s.title ? s.title : s.type === 'ui' && s.screen ? s.screen : s.type;
    console.log(`  - ${s.type.padEnd(11)} ${(s.frames / theme.video.fps).toFixed(1).padStart(5)}s  ${label}`);
  }

  if (previewOnly) {
    spawnSync('npx', ['remotion', 'studio'], { cwd: root, stdio: 'inherit', shell: true });
    process.exit(0);
  }

  const out = path.resolve(outArg ?? path.join('saida', `${path.basename(input, path.extname(input))}.mp4`));
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts') });
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const composition = await selectComposition({ serveUrl, id: 'FrentyVideo', inputProps: spec, browserExecutable });
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: out,
    inputProps: spec,
    browserExecutable,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct % 10 === 0 && pct !== last) {
        last = pct;
        console.log(`Renderizando... ${pct}%`);
      }
    },
  });
  console.log(`\nVídeo pronto: ${out}`);
})().catch((e) => {
  console.error(e instanceof Error && (e.name === 'DirectorError' || e.name === 'ElevenLabsError') ? e.message : e);
  process.exit(1);
});
