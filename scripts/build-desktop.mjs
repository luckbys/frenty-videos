// Compila o app desktop (Electron) para dist-desktop/.
import { build } from 'esbuild';
import fs from 'node:fs';

const out = 'dist-desktop';
fs.rmSync(out, { recursive: true, force: true });

const node = { bundle: true, platform: 'node', format: 'cjs', target: 'node20', packages: 'external', logLevel: 'warning' };

await Promise.all([
  build({ ...node, entryPoints: ['desktop/main.ts'], outfile: `${out}/main.js` }),
  build({ ...node, entryPoints: ['desktop/preload.ts'], outfile: `${out}/preload.js` }),
  build({ ...node, entryPoints: ['desktop/render-worker.ts'], outfile: `${out}/render-worker.js` }),
  build({
    entryPoints: ['desktop/ui/main.tsx'],
    outdir: `${out}/ui`,
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'chrome120',
    jsx: 'automatic',
    loader: { '.woff': 'file', '.woff2': 'file' },
    assetNames: 'fonts/[name]-[hash]',
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: true,
    logLevel: 'warning',
  }),
]);
fs.copyFileSync('desktop/ui/index.html', `${out}/ui/index.html`);
fs.cpSync('public/sfx', `${out}/ui/sfx`, { recursive: true });
fs.copyFileSync('build/icon.png', `${out}/icon.png`);
console.log('App desktop compilado em dist-desktop/');
