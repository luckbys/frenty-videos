// Renderiza quadros soltos de uma composição para revisão rápida (sem gerar o vídeo inteiro).
// Uso: npx tsx scripts/quadros.ts ComercialModuloOS pasta-saida 30 120 400 ...
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [id, outDir, ...frames] = process.argv.slice(2);
(async () => {
  const serveUrl = await bundle({ entryPoint: path.join(__dirname, '../src/index.ts') });
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const composition = await selectComposition({ serveUrl, id, browserExecutable, inputProps: {} });
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of frames) {
    const output = path.join(outDir, `${String(f).padStart(4, '0')}.png`);
    await renderStill({ composition, serveUrl, frame: Number(f), output, browserExecutable, inputProps: {} });
    console.log(output);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
