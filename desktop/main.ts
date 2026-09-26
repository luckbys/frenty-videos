import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } from 'electron';
import { fork, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { composeVideo, GROQ_DEFAULT_MODEL, planIsStale, recomposeScene } from '../src/ai/director';
import { DEFAULT_VOICE_ID, friendlyEleven, listVoices as fetchVoices } from '../src/audio/elevenlabs';
import { buildNarration } from '../src/audio/narration';
import type { Brand } from '../src/brand';
import { LOGO_EXTENSIONS, logoToDataUrl } from '../src/brand-file';
import { scriptOptions } from '../src/parse';
import type { AiEvent, AiKeyStatus, AiProvider, AiSettings, AiSettingsPatch, NewVideo, RenderEvent, VoiceSettings, VoiceSettingsPatch } from './api';
import { Library, parse } from './library';
import { setFrontmatter } from './markdown';
import { Updater } from './updater';
import { slugify } from './slug';

const appRoot = app.getAppPath();

// No instalador, o Chrome usado para gerar os vídeos vem junto (resources/browser); assim nada é baixado no primeiro uso.
const bundledBrowser = () => {
  if (!app.isPackaged) return undefined;
  const exe = process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';
  const f = path.join(process.resourcesPath, 'browser', exe);
  return fs.existsSync(f) ? f : undefined;
};

// Qualquer erro na inicialização vira uma mensagem na tela e um log, em vez de o programa simplesmente não abrir.
const logFile = () => path.join(app.getPath('userData'), 'erros.log');
const fatal = (e: unknown) => {
  const msg = e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e);
  try {
    fs.mkdirSync(path.dirname(logFile()), { recursive: true });
    fs.appendFileSync(logFile(), `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
  dialog.showErrorBox('Frenty Vídeos', `Algo deu errado ao abrir o programa.\n\n${msg.split('\n')[0]}\n\nDetalhes em: ${logFile()}`);
};
process.on('uncaughtException', fatal);

// Diário da abertura (inicio.log), refeito a cada vez que o programa abre. Se a abertura anterior não
// chegou a mostrar a tela, esta abre sem aceleração de vídeo (placas/drivers que deixam a janela em branco).
const startLog = () => path.join(app.getPath('userData'), 'inicio.log');
let previousStart = '';
try {
  previousStart = fs.readFileSync(startLog(), 'utf8');
} catch {}
const safeMode = process.argv.includes('--sem-gpu') || (previousStart !== '' && !previousStart.includes('tela carregada'));
if (safeMode) app.disableHardwareAcceleration();
const trace = (step: string) => {
  try {
    fs.mkdirSync(path.dirname(startLog()), { recursive: true });
    fs.appendFileSync(startLog(), `[${new Date().toISOString()}] ${step}\n`);
  } catch {}
};
try {
  fs.mkdirSync(path.dirname(startLog()), { recursive: true });
  fs.writeFileSync(startLog(), '');
} catch {}
trace(`abrindo versão ${app.getVersion()} (${process.platform} ${process.arch})${safeMode ? ' sem aceleração de vídeo' : ''}`);
const settingsFile = () => path.join(app.getPath('userData'), 'config.json');
const defaultRoot = () => path.join(app.getPath('documents'), 'Frenty Vídeos');

type Settings = {
  libraryRoot?: string;
  aiProvider?: AiProvider;
  groqModel?: string;
  aiKey?: string; // Claude
  aiKeyPlain?: boolean;
  groqKey?: string;
  groqKeyPlain?: boolean;
  voiceId?: string; // ElevenLabs: voz escolhida
  voiceKey?: string;
  voiceKeyPlain?: boolean;
};
const readSettings = (): Settings => {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
  } catch {
    return {};
  }
};
const writeSettings = (patch: Partial<Settings>) => {
  const next = { ...readSettings(), ...patch };
  for (const k of Object.keys(next) as (keyof Settings)[]) if (next[k] === undefined) delete next[k];
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2));
};
const loadRoot = () => readSettings().libraryRoot || defaultRoot();

// Chaves das APIs de IA: guardadas só neste computador, criptografadas pelo sistema quando possível.
const KEY_FIELD = { claude: 'aiKey', groq: 'groqKey' } as const;
const ENV_KEY = { claude: 'ANTHROPIC_API_KEY', groq: 'GROQ_API_KEY' } as const;
const storedKey = (p: AiProvider) => {
  const s = readSettings();
  const v = s[KEY_FIELD[p]];
  if (!v) return undefined;
  try {
    return s[`${KEY_FIELD[p]}Plain`] ? v : safeStorage.decryptString(Buffer.from(v, 'base64'));
  } catch {
    return undefined;
  }
};
const saveKey = (p: AiProvider, key: string | null) => {
  const k = key?.trim();
  const f = KEY_FIELD[p];
  if (!k) writeSettings({ [f]: undefined, [`${f}Plain`]: undefined });
  else if (safeStorage.isEncryptionAvailable()) writeSettings({ [f]: safeStorage.encryptString(k).toString('base64'), [`${f}Plain`]: undefined });
  else writeSettings({ [f]: k, [`${f}Plain`]: true });
};
const provider = (): AiProvider => (readSettings().aiProvider === 'groq' ? 'groq' : 'claude');
const apiKey = (p = provider()) => storedKey(p) || process.env[ENV_KEY[p]] || undefined;
const keyStatus = (p: AiProvider): AiKeyStatus => {
  const k = storedKey(p);
  if (k) return { configured: true, source: 'app', hint: `…${k.slice(-4)}` };
  const env = process.env[ENV_KEY[p]];
  if (env) return { configured: true, source: 'ambiente', hint: `…${env.slice(-4)}` };
  return { configured: false, source: null };
};
const aiSettings = (): AiSettings => ({
  provider: provider(),
  groqModel: readSettings().groqModel || GROQ_DEFAULT_MODEL,
  defaultGroqModel: GROQ_DEFAULT_MODEL,
  keys: { claude: keyStatus('claude'), groq: keyStatus('groq') },
});

// Chave do ElevenLabs (narração por voz): mesmo esquema das chaves de IA acima, guardada à parte
// porque não é uma "IA da montagem" — funciona junto com qualquer uma delas, ou com a montagem automática.
const voiceStoredKey = () => {
  const s = readSettings();
  const v = s.voiceKey;
  if (!v) return undefined;
  try {
    return s.voiceKeyPlain ? v : safeStorage.decryptString(Buffer.from(v, 'base64'));
  } catch {
    return undefined;
  }
};
const saveVoiceKey = (key: string | null) => {
  const k = key?.trim();
  if (!k) writeSettings({ voiceKey: undefined, voiceKeyPlain: undefined });
  else if (safeStorage.isEncryptionAvailable()) writeSettings({ voiceKey: safeStorage.encryptString(k).toString('base64'), voiceKeyPlain: undefined });
  else writeSettings({ voiceKey: k, voiceKeyPlain: true });
};
const voiceApiKey = () => voiceStoredKey() || process.env.ELEVENLABS_API_KEY || undefined;
const voiceKeyStatus = (): AiKeyStatus => {
  const k = voiceStoredKey();
  if (k) return { configured: true, source: 'app', hint: `…${k.slice(-4)}` };
  const env = process.env.ELEVENLABS_API_KEY;
  if (env) return { configured: true, source: 'ambiente', hint: `…${env.slice(-4)}` };
  return { configured: false, source: null };
};
const voiceSettings = (): VoiceSettings => ({
  voiceId: readSettings().voiceId || DEFAULT_VOICE_ID,
  defaultVoiceId: DEFAULT_VOICE_ID,
  key: voiceKeyStatus(),
});

let win: BrowserWindow | null = null;
let worker: ChildProcess | null = null;
const rendering = new Map<string, string>(); // id -> markdown hash no momento do pedido
let library: Library;

const emit = (e: RenderEvent) => win?.webContents.send('render:event', e);
const emitAi = (e: AiEvent) => win?.webContents.send('ai:event', e);
const aiJobs = new Map<string, AbortController>();

// Endereço do manifesto de versões (package.json → "atualizacoes").
const updateFeed = (() => {
  try {
    const url = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8')).atualizacoes;
    return typeof url === 'string' && /^https:\/\//.test(url) ? url : undefined;
  } catch {
    return undefined;
  }
})();
const updater = new Updater(
  process.env.FRENTY_UPDATE_FEED || updateFeed,
  (e) => win?.webContents.send('update:event', e),
  (s) => trace(s),
  () => (rendering.size ? 'Há um vídeo sendo gerado.' : aiJobs.size ? 'A IA está montando um vídeo.' : null),
);

function startWorker() {
  worker = fork(path.join(__dirname, 'render-worker.js'), [], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', FRENTY_APP_ROOT: appRoot, REMOTION_BROWSER: process.env.REMOTION_BROWSER || bundledBrowser() || '' },
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
  });
  worker.on('message', (m: { id: string; kind: string; stage?: string; progress?: number; video?: string; message?: string }) => {
    if (m.kind === 'progress') emit({ id: m.id, kind: 'progress', stage: m.stage!, progress: m.progress! });
    else if (m.kind === 'finished') {
      const h = rendering.get(m.id)!;
      rendering.delete(m.id);
      emit({ id: m.id, kind: 'done', meta: library.markRendered(m.id, m.video!, h) });
    } else if (m.kind === 'error') {
      rendering.delete(m.id);
      emit({ id: m.id, kind: 'error', message: m.message! });
    }
  });
  worker.on('exit', () => {
    for (const id of rendering.keys()) emit({ id, kind: 'error', message: 'O processo de geração parou. Tente de novo.' });
    rendering.clear();
    worker = null;
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#F8F9FA',
    title: 'Frenty Vídeos',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: false },
  });
  trace('janela criada');
  win.webContents.on('did-finish-load', () => trace('tela carregada'));
  win.webContents.on('did-fail-load', (_e, code, desc) => trace(`falha ao carregar a tela: ${code} ${desc}`));
  win.webContents.on('render-process-gone', (_e, d) => {
    trace(`tela fechou inesperadamente: ${d.reason} (${d.exitCode})`);
    fatal(new Error(`A tela do programa fechou inesperadamente (${d.reason}). Abra o programa de novo.`));
  });
  win.on('unresponsive', () => trace('tela sem resposta'));
  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
  win.on('closed', () => (win = null));
}

function registerIpc() {
  const h = <A extends unknown[], R>(ch: string, fn: (...a: A) => R) =>
    ipcMain.handle(ch, (_e, ...a) => fn(...(a as A)));

  h('list', () => library.list());
  h('create', (input: NewVideo) => library.create(input));
  h('get', (id: string) => ({ meta: library.meta(id), markdown: library.markdown(id) }));
  h('save', (id: string, md: string) => library.save(id, md));
  h('rename', (id: string, name: string) => library.rename(id, name));
  h('duplicate', (id: string) => library.duplicate(id));
  h('parse', (md: string, id?: string) => (id ? library.parseFor(id, md) : parse(md)));

  // Montagem com IA: o vídeo inteiro ou uma cena (scene = índice no plano).
  h('aiCompose', async (id: string, opts: { instruction?: string; scene?: number } = {}) => {
    if (aiJobs.has(id)) return { ok: false, error: 'A IA já está montando este vídeo.' };
    const ctrl = new AbortController();
    aiJobs.set(id, ctrl);
    const onProgress = (p: { stage: string }) => emitAi({ id, kind: 'progress', stage: p.stage });
    try {
      const md = library.markdown(id);
      const o = scriptOptions(md);
      const common = { markdown: md, brand: library.brands.resolve(o.marca), format: o.format, maxSeconds: o.maxSeconds, provider: provider(), model: aiSettings().groqModel, apiKey: apiKey(), signal: ctrl.signal, onProgress };
      const saved = library.plan(id);
      const plan =
        opts.scene != null && saved
          ? await recomposeScene({ ...common, stored: saved, index: opts.scene, instruction: opts.instruction })
          : await composeVideo({ ...common, instruction: opts.instruction, previous: opts.instruction && saved && !planIsStale(saved, md) ? saved.plano : undefined });
      library.savePlan(id, plan);
      // Liga a montagem com IA no roteiro (o texto atual, caso tenha mudado enquanto a IA trabalhava).
      let latest = library.markdown(id);
      if (!scriptOptions(latest).ai) library.save(id, (latest = setFrontmatter(latest, 'montagem', 'ia')));
      emitAi({ id, kind: 'done' });
      return { ok: true, markdown: latest };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      emitAi({ id, kind: 'error', message });
      return { ok: false, error: message, needsKey: /chave da api/i.test(message) };
    } finally {
      aiJobs.delete(id);
    }
  });
  h('aiCancel', (id: string) => aiJobs.get(id)?.abort());
  h('aiSettings', aiSettings);
  h('updateInfo', () => updater.info());
  h('checkUpdate', () => updater.check(true));
  h('installUpdate', () => updater.install());
  h('setAiSettings', (p: AiSettingsPatch) => {
    if (p.provider === 'claude' || p.provider === 'groq') writeSettings({ aiProvider: p.provider });
    if (p.groqModel !== undefined) writeSettings({ groqModel: p.groqModel.trim() && p.groqModel.trim() !== GROQ_DEFAULT_MODEL ? p.groqModel.trim() : undefined });
    if (p.claudeKey !== undefined) saveKey('claude', p.claudeKey);
    if (p.groqKey !== undefined) saveKey('groq', p.groqKey);
    return aiSettings();
  });
  h('voiceSettings', voiceSettings);
  h('setVoiceSettings', (p: VoiceSettingsPatch) => {
    if (p.voiceId !== undefined) writeSettings({ voiceId: p.voiceId.trim() && p.voiceId.trim() !== DEFAULT_VOICE_ID ? p.voiceId.trim() : undefined });
    if (p.apiKey !== undefined) saveVoiceKey(p.apiKey);
    return voiceSettings();
  });
  h('listVoices', async () => {
    const key = voiceApiKey();
    if (!key) return { ok: false as const, error: 'Configure a chave do ElevenLabs primeiro.' };
    try {
      return { ok: true as const, voices: await fetchVoices(key) };
    } catch (e) {
      return { ok: false as const, error: friendlyEleven(e).message };
    }
  });
  h('openExternal', (url: string) => (/^https:\/\//.test(url) ? shell.openExternal(url) : undefined));

  h('importMarkdown', async () => {
    const r = await dialog.showOpenDialog(win!, {
      title: 'Importar roteiro .md',
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
      properties: ['openFile', 'multiSelections'],
    });
    return r.canceled ? [] : r.filePaths.map((f) => library.importFile(f));
  });

  h('remove', async (id: string) => {
    const meta = library.meta(id);
    const r = await dialog.showMessageBox(win!, {
      type: 'warning',
      buttons: ['Excluir', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
      message: `Excluir "${meta.name}"?`,
      detail: 'O roteiro e o vídeo gerado serão apagados do computador.',
    });
    if (r.response !== 0) return false;
    if (rendering.has(id)) worker?.send({ type: 'cancel', id });
    library.remove(id);
    return true;
  });

  h('render', async (id: string) => {
    if (rendering.has(id)) return;
    const p = library.prepare(id);
    if (!p.ok) {
      emit({ id, kind: 'error', message: p.error });
      return;
    }
    let spec = p.spec;
    const key = voiceApiKey();
    if (key && scriptOptions(library.markdown(id)).voice) {
      emit({ id, kind: 'progress', stage: 'Gerando a narração', progress: 0 });
      try {
        const { scenes, tracks } = await buildNarration(spec.scenes, {
          apiKey: key,
          voiceId: readSettings().voiceId || DEFAULT_VOICE_ID,
          cacheDir: path.join(app.getPath('userData'), 'narracao-cache'),
          onProgress: (pr) => emit({ id, kind: 'progress', stage: `Gerando a narração (${pr.done}/${pr.total})`, progress: 0 }),
        });
        spec = { ...spec, scenes, narration: tracks };
      } catch (e) {
        emit({ id, kind: 'error', message: friendlyEleven(e).message });
        return;
      }
    }
    if (!worker) startWorker();
    rendering.set(id, p.stamp);
    const out = library.outputFor(id);
    worker!.send({ type: 'render', id, spec, ...out });
    emit({ id, kind: 'progress', stage: 'Na fila', progress: 0 });
  });
  h('cancelRender', (id: string) => worker?.send({ type: 'cancel', id }));

  h('openVideo', async (id: string) => {
    const v = library.videoPath(id);
    if (v) await shell.openPath(v);
  });
  h('showInFolder', (id: string) => {
    const v = library.videoPath(id);
    if (v && fs.existsSync(v)) shell.showItemInFolder(v);
    else shell.openPath(path.join(library.root, id));
  });
  h('exportVideo', async (id: string) => {
    const v = library.videoPath(id);
    if (!v) return false;
    const r = await dialog.showSaveDialog(win!, { defaultPath: path.basename(v), filters: [{ name: 'Vídeo MP4', extensions: ['mp4'] }] });
    if (r.canceled || !r.filePath) return false;
    fs.copyFileSync(v, r.filePath);
    return true;
  });
  h('exportMarkdown', async (id: string) => {
    const meta = library.meta(id);
    const r = await dialog.showSaveDialog(win!, { defaultPath: `${meta.name}.md`, filters: [{ name: 'Markdown', extensions: ['md'] }] });
    if (r.canceled || !r.filePath) return false;
    fs.writeFileSync(r.filePath, library.markdown(id));
    return true;
  });

  // Identidade visual
  const brandList = () => ({ brands: library.brands.list(), defaultId: library.brands.defaultId, folder: library.brands.dir });
  h('brands', brandList);
  h('saveBrand', (b: Brand) => library.brands.save(b));
  h('createBrand', (fromId?: string) => library.brands.create(fromId));
  h('setDefaultBrand', (id: string) => library.brands.setDefault(id));
  h('removeBrand', async (id: string) => {
    const b = library.brands.get(id);
    if (!b) return false;
    const using = library.list().filter((v) => v.brandId === id).length;
    const r = await dialog.showMessageBox(win!, {
      type: 'warning',
      buttons: ['Excluir', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
      message: `Excluir a marca "${b.nome}"?`,
      detail: using
        ? `${using} ${using === 1 ? 'vídeo usa' : 'vídeos usam'} esta marca e ${using === 1 ? 'passará' : 'passarão'} a usar a marca padrão.`
        : 'Nenhum vídeo usa esta marca.',
    });
    if (r.response !== 0) return false;
    library.brands.remove(id);
    return true;
  });
  h('resetBrand', async () => {
    const r = await dialog.showMessageBox(win!, {
      type: 'question',
      buttons: ['Restaurar', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
      message: 'Restaurar a identidade Frenty original?',
      detail: 'Cores, fontes, logo e textos da marca Frenty voltam ao padrão do manual.',
    });
    return r.response === 0 ? library.brands.resetFrenty() : null;
  });
  h('pickLogo', async () => {
    const r = await dialog.showOpenDialog(win!, {
      title: 'Escolher arquivo do logo',
      filters: [{ name: 'Imagem (SVG, PNG, JPG, WEBP)', extensions: LOGO_EXTENSIONS }],
      properties: ['openFile'],
    });
    if (r.canceled || !r.filePaths[0]) return null;
    try {
      return { dataUrl: logoToDataUrl(r.filePaths[0]) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  });
  h('importBrand', async () => {
    const r = await dialog.showOpenDialog(win!, { title: 'Importar perfil de marca', filters: [{ name: 'Perfil de marca', extensions: ['json'] }], properties: ['openFile'] });
    return r.canceled || !r.filePaths[0] ? null : library.brands.importFile(r.filePaths[0]);
  });
  h('exportBrand', async (id: string) => {
    const b = library.brands.get(id);
    if (!b) return false;
    const r = await dialog.showSaveDialog(win!, { defaultPath: `marca-${slugify(b.nome)}.json`, filters: [{ name: 'Perfil de marca', extensions: ['json'] }] });
    if (r.canceled || !r.filePath) return false;
    fs.writeFileSync(r.filePath, JSON.stringify(b, null, 2));
    return true;
  });

  h('libraryPath', () => library.root);
  h('openLibrary', () => shell.openPath(library.root));
  h('chooseLibrary', async () => {
    const r = await dialog.showOpenDialog(win!, { title: 'Escolher pasta dos vídeos', properties: ['openDirectory', 'createDirectory'] });
    if (r.canceled || !r.filePaths[0]) return null;
    library = new Library(r.filePaths[0], appRoot, (id) => rendering.has(id));
    writeSettings({ libraryRoot: library.root });
    return library.root;
  });
}

// Um clique a mais no atalho só traz a janela aberta para frente.
if (!process.env.FRENTY_MULTI_INSTANCE && !app.requestSingleInstanceLock()) {
  trace('já existe uma cópia aberta; pedindo para ela aparecer');
  app.quit();
}
app.on('child-process-gone', (_e, d) => trace(`processo ${d.type} fechou: ${d.reason}`));
app.on('second-instance', () => {
  trace('pedido para abrir de novo');
  // Se a janela foi fechada mas o programa ficou aberto, cria outra em vez de não fazer nada.
  if (!win && app.isReady()) return createWindow();
  if (win?.isMinimized()) win.restore();
  win?.show();
  win?.focus();
});

app.whenReady().then(() => {
  trace('pronto para abrir a janela');
  try {
    library = new Library(loadRoot(), appRoot, (id) => rendering.has(id));
  } catch (e) {
    // Pasta escolhida antes sumiu ou ficou sem permissão: volta para Documentos.
    fatal(e);
    library = new Library(defaultRoot(), appRoot, (id) => rendering.has(id));
  }
  if (library.list().length === 0) {
    library.createFromMarkdown('Lançamento IAF', fs.readFileSync(path.join(appRoot, 'exemplos', 'lancamento-iaf.md'), 'utf8'));
  }
  registerIpc();
  startWorker();
  createWindow();
  updater.start();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
}).catch(fatal);

app.on('window-all-closed', () => {
  worker?.kill();
  if (process.platform !== 'darwin') app.quit();
});
