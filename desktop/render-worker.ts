// Processo separado que renderiza os vídeos, para a interface nunca travar.
// Recebe pedidos via IPC (process.send) e mantém o bundle do Remotion em cache.
import { bundle } from '@remotion/bundler';
import { makeCancelSignal, renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import type { VideoSpec } from '../src/types';

type Job = { type: 'render'; id: string; spec: VideoSpec; video: string; thumb: string };
type Msg = Job | { type: 'cancel'; id: string };

const appRoot = process.env.FRENTY_APP_ROOT ?? process.cwd();
const browserExecutable = process.env.REMOTION_BROWSER || null;
const send = (m: object) => process.send?.(m);

let serveUrl: Promise<string> | null = null;
const getBundle = () =>
  (serveUrl ??= bundle({ entryPoint: path.join(appRoot, 'src', 'index.ts') }).catch((e) => {
    serveUrl = null;
    throw e;
  }));

const queue: Job[] = [];
let current: { id: string; cancel: () => void } | null = null;

async function run(job: Job) {
  const { cancelSignal, cancel } = makeCancelSignal();
  current = { id: job.id, cancel };
  const tmp = `${job.video}.parcial.mp4`;
  try {
    send({ id: job.id, kind: 'progress', stage: 'Preparando', progress: 0 });
    const url = await getBundle();
    const composition = await selectComposition({ serveUrl: url, id: 'FrentyVideo', inputProps: job.spec, browserExecutable });
    await renderMedia({
      composition,
      serveUrl: url,
      codec: 'h264',
      outputLocation: tmp,
      inputProps: job.spec,
      browserExecutable,
      cancelSignal,
      onProgress: ({ progress, stitchStage }) =>
        send({ id: job.id, kind: 'progress', stage: stitchStage === 'muxing' ? 'Finalizando' : 'Gerando', progress }),
    });
    fs.renameSync(tmp, job.video);
    const intro = job.spec.scenes[0];
    await renderStill({
      composition,
      serveUrl: url,
      inputProps: job.spec,
      frame: Math.floor((intro?.frames ?? 60) * 0.75),
      output: job.thumb,
      imageFormat: 'jpeg',
      scale: 0.35,
      browserExecutable,
    });
    send({ id: job.id, kind: 'finished', video: job.video });
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    const message = e instanceof Error ? e.message : String(e);
    send({ id: job.id, kind: 'error', message: /cancel/i.test(message) ? 'Geração cancelada.' : message });
  } finally {
    current = null;
  }
}

async function pump() {
  if (current) return;
  const job = queue.shift();
  if (!job) return;
  await run(job);
  void pump();
}

process.on('message', (m: Msg) => {
  if (m.type === 'render') {
    queue.push(m);
    void pump();
  } else if (m.type === 'cancel') {
    const i = queue.findIndex((j) => j.id === m.id);
    if (i >= 0) {
      queue.splice(i, 1);
      send({ id: m.id, kind: 'error', message: 'Geração cancelada.' });
    } else if (current?.id === m.id) current.cancel();
  }
});

// Aquece o bundle em segundo plano para o primeiro "Gerar vídeo" ser rápido.
getBundle().catch(() => undefined);
