// Gera o latest.json que o programa consulta para saber se há versão nova.
// Uso: node scripts/manifesto.mjs <instalador.exe> <url-do-instalador> [saida.json]
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [exe, url, out = 'latest.json'] = process.argv.slice(2);
if (!exe || !/^https:\/\//.test(url ?? '')) {
  console.error('Uso: node scripts/manifesto.mjs <instalador.exe> <url https do instalador> [saida.json]');
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const data = fs.readFileSync(exe);

// Novidades: os itens "- " da seção "## <versão>" de NOVIDADES.md.
const notes = [];
const md = fs.existsSync(path.join(root, 'NOVIDADES.md')) ? fs.readFileSync(path.join(root, 'NOVIDADES.md'), 'utf8') : '';
let inside = false;
for (const line of md.split(/\r?\n/)) {
  if (/^##\s/.test(line)) inside = line.replace(/^##\s+/, '').trim() === pkg.version;
  else if (inside && /^\s*-\s+/.test(line)) notes.push(line.replace(/^\s*-\s+/, '').trim());
}

const manifest = {
  versao: pkg.version,
  instalador: url,
  sha256: crypto.createHash('sha256').update(data).digest('hex'),
  tamanho: data.length,
  novidades: notes,
  data: new Date().toISOString().slice(0, 10),
  pagina: pkg.atualizacoes?.replace(/\/latest\/download\/latest\.json$/, '/latest'),
};
fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
console.log(`${out}: versão ${manifest.versao}, ${notes.length} novidade(s), sha256 ${manifest.sha256.slice(0, 12)}…`);
