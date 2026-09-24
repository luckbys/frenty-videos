// Atualização automática: procura uma versão nova (ao abrir e a cada 6 h), avisa a interface,
// baixa o instalador, confere o SHA-256 e instala em modo silencioso; o instalador reabre o programa.
// O endereço do manifesto (latest.json) fica em package.json → "atualizacoes".
import { app, net, shell } from 'electron';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { UpdateEvent, UpdateInfo } from './api';

type Manifest = { versao: string; instalador: string; sha256: string; tamanho?: number; novidades?: string[]; data?: string; pagina?: string };

const CHECK_EVERY = 6 * 60 * 60 * 1000;

// "1.10.0" > "1.9.2"
export const newer = (a: string, b: string) => {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  return false;
};

export class Updater {
  private manifest: Manifest | null = null;
  private downloading = false;
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private feed: string | undefined,
    private emit: (e: UpdateEvent) => void,
    private log: (s: string) => void,
    private busy: () => string | null, // motivo para não instalar agora (vídeo gerando, IA montando)
  ) {}

  get enabled() {
    return !!this.feed;
  }

  start() {
    if (!this.feed) return;
    setTimeout(() => void this.check(false), 8000);
    this.timer = setInterval(() => void this.check(false), CHECK_EVERY);
  }

  stop() {
    clearInterval(this.timer);
  }

  info(): UpdateInfo {
    return {
      current: app.getVersion(),
      enabled: this.enabled,
      available: this.manifest && newer(this.manifest.versao, app.getVersion()) ? { version: this.manifest.versao, notes: this.manifest.novidades ?? [], date: this.manifest.data } : null,
      canInstall: process.platform === 'win32' && app.isPackaged,
    };
  }

  // manual = pedido pelo usuário (mostra "você já está na versão mais nova" e erros).
  async check(manual: boolean): Promise<UpdateInfo> {
    if (!this.feed) return this.info();
    try {
      const res = await net.fetch(`${this.feed}${this.feed.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`servidor respondeu ${res.status}`);
      const m = (await res.json()) as Manifest;
      if (typeof m?.versao !== 'string' || typeof m?.instalador !== 'string' || !/^[a-f0-9]{64}$/i.test(m?.sha256 ?? '')) throw new Error('manifesto inválido');
      if (!/^https:\/\//.test(m.instalador)) throw new Error('endereço do instalador inválido');
      this.manifest = m;
      const info = this.info();
      this.log(`atualização: versão publicada ${m.versao}, instalada ${app.getVersion()}`);
      if (info.available) this.emit({ kind: 'available', info });
      else if (manual) this.emit({ kind: 'uptodate', info });
      return info;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.log(`atualização: falha ao verificar (${message})`);
      if (manual) this.emit({ kind: 'error', message: 'Não foi possível procurar atualizações. Verifique a internet e tente de novo.' });
      return this.info();
    }
  }

  async install() {
    const m = this.manifest;
    if (!m || !newer(m.versao, app.getVersion()) || this.downloading) return;
    if (!(process.platform === 'win32' && app.isPackaged)) {
      await shell.openExternal(m.pagina ?? m.instalador);
      return;
    }
    const reason = this.busy();
    if (reason) {
      this.emit({ kind: 'error', message: `${reason} Tente atualizar quando terminar.` });
      return;
    }
    this.downloading = true;
    const file = path.join(os.tmpdir(), `FrentyVideos-Setup-${m.versao.replace(/[^0-9.]/g, '')}.exe`);
    try {
      await this.download(m, file);
      this.emit({ kind: 'installing' });
      this.log(`atualização: instalando ${m.versao}`);
      // O instalador fecha este programa, atualiza os arquivos e o abre de novo.
      let failed = false;
      const child = spawn(file, ['/S'], { detached: true, stdio: 'ignore' });
      child.on('error', (e) => {
        failed = true;
        this.log(`atualização: instalador não abriu (${e.message})`);
        this.emit({ kind: 'error', message: 'O instalador da nova versão não abriu. Tente de novo ou baixe pela página de versões.' });
      });
      child.unref();
      setTimeout(() => !failed && app.quit(), 1500);
    } catch (e) {
      fs.rmSync(file, { force: true });
      const message = e instanceof Error ? e.message : String(e);
      this.log(`atualização: falha (${message})`);
      this.emit({ kind: 'error', message: `A atualização não foi concluída: ${message}` });
    } finally {
      this.downloading = false;
    }
  }

  private async download(m: Manifest, file: string) {
    const res = await net.fetch(m.instalador);
    if (!res.ok || !res.body) throw new Error(`download falhou (${res.status})`);
    const total = Number(res.headers.get('content-length')) || m.tamanho || 0;
    const hash = crypto.createHash('sha256');
    const out = fs.createWriteStream(file);
    let got = 0;
    let last = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      hash.update(value);
      got += value.length;
      if (!out.write(value)) await new Promise<void>((r) => out.once('drain', () => r()));
      const now = Date.now();
      if (now - last > 250) {
        last = now;
        this.emit({ kind: 'progress', progress: total ? got / total : 0 });
      }
    }
    await new Promise<void>((resolve, reject) => out.end((err?: Error | null) => (err ? reject(err) : resolve())));
    // Só instala o arquivo exatamente igual ao publicado.
    if (hash.digest('hex').toLowerCase() !== m.sha256.toLowerCase()) throw new Error('o arquivo baixado não confere com a versão publicada');
  }
}
