// Sintetiza a trilha do comercial do Módulo de O.S. (60 s, estéreo) em public/comerciais/trilha-modulo-os.mp3.
// Tudo gerado aqui (sem samples de terceiros): tensão no começo, impacto na entrada da logo (10,8 s),
// groove leve e otimista no meio e um acorde final no encerramento (55,4 s).
// Uso: node scripts/gerar-trilha.mjs  (o MP3 sai pelo ffmpeg que vem com o Remotion)
// Outras trilhas no mesmo padrão (os pontos de virada são os mesmos):
//   node scripts/gerar-trilha.mjs --saida public/comerciais/trilha-lote-validade.mp3 --tom 2 --semente 29
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SR = 44100;
const DUR = 60;
const N = SR * DUR;
const L = new Float32Array(N);
const R = new Float32Array(N);
const send = new Float32Array(N); // envio para o reverb
const duck = new Float32Array(N).fill(1); // "sidechain" do bumbo

const opcao = (nome, padrao) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : padrao;
};
const SAIDA = opcao('saida', 'public/comerciais/trilha-modulo-os.mp3');
const TOM = Number(opcao('tom', 0)); // transposição em semitons
let seed = Number(opcao('semente', 11));
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const mtof = (m) => 440 * 2 ** ((m + TOM - 69) / 12);
const BPM = 110;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const LOGO = 10.8;
const CTA = 50.47;
const END = 55.4;

const add = (buf, t, v) => {
  const i = Math.floor(t * SR);
  if (i >= 0 && i < N) buf[i] += v;
};
const pan = (i, v, p = 0) => {
  L[i] += v * Math.cos(((p + 1) * Math.PI) / 4);
  R[i] += v * Math.sin(((p + 1) * Math.PI) / 4);
};

// Oscilador dente de serra com poucas harmônicas (sem aliasing), para baixo e pad.
const saw = (ph, harm = 8) => {
  let s = 0;
  for (let k = 1; k <= harm; k++) s += Math.sin(ph * k) / k;
  return s * 0.6;
};

/* ---------- Bateria ---------- */

function kick(t0, gain = 1) {
  const len = 0.45 * SR;
  let ph = 0;
  for (let j = 0; j < len; j++) {
    const t = j / SR;
    const f = 45 + 95 * Math.exp(-t / 0.035);
    ph += (2 * Math.PI * f) / SR;
    const v = Math.sin(ph) * Math.exp(-t / 0.22) * gain + (j < 60 ? rand() * 0.25 * gain * (1 - j / 60) : 0);
    const i = Math.floor(t0 * SR) + j;
    if (i < N) pan(i, v * 0.9);
  }
  // Abaixa pad e baixo enquanto o bumbo soa.
  for (let j = 0; j < 0.3 * SR; j++) {
    const i = Math.floor(t0 * SR) + j;
    if (i < N) duck[i] = Math.min(duck[i], 0.35 + 0.65 * Math.min(1, j / (0.3 * SR)) ** 1.5);
  }
}

function clap(t0, gain = 1) {
  let lp = 0, bp = 0;
  for (let j = 0; j < 0.25 * SR; j++) {
    const t = j / SR;
    // Três estalos rápidos e uma cauda.
    const e = (t < 0.01 ? 1 : t < 0.02 ? 0.6 : t < 0.03 ? 0.8 : 0.7) * Math.exp(-t / 0.07);
    const x = rand();
    const f = 2 * Math.sin((Math.PI * 1400) / SR);
    lp += f * bp;
    const hp = x - lp - 0.5 * bp;
    bp += f * hp;
    const v = bp * e * gain * 0.55;
    const i = Math.floor(t0 * SR) + j;
    if (i < N) {
      pan(i, v, 0.05);
      send[i] += v * 0.35;
    }
  }
}

function hat(t0, gain = 1, open = false) {
  let prev = 0;
  const len = (open ? 0.18 : 0.05) * SR;
  for (let j = 0; j < len; j++) {
    const t = j / SR;
    const x = rand();
    const hp = x - prev;
    prev = x;
    const v = hp * Math.exp(-t / (open ? 0.06 : 0.014)) * gain * 0.16;
    const i = Math.floor(t0 * SR) + j;
    if (i < N) pan(i, v, 0.35);
  }
}

/* ---------- Instrumentos ---------- */

// Corda dedilhada (Karplus-Strong) para o arpejo.
function pluck(t0, freq, gain = 1, p = 0) {
  const period = Math.max(2, Math.round(SR / freq));
  const buf = new Float32Array(period);
  for (let k = 0; k < period; k++) buf[k] = rand();
  let idx = 0;
  const len = 0.9 * SR;
  for (let j = 0; j < len; j++) {
    const a = buf[idx];
    const b = buf[(idx + 1) % period];
    buf[idx] = (a + b) * 0.5 * 0.996;
    idx = (idx + 1) % period;
    const v = a * gain * 0.22 * Math.exp(-j / (0.5 * SR));
    const i = Math.floor(t0 * SR) + j;
    if (i < N) {
      pan(i, v, p);
      send[i] += v * 0.5;
    }
  }
}

// Pad: acorde com vozes desafinadas, ataque lento e filtro que abre conforme `bright`.
function pad(t0, dur, notes, gain = 1, bright = 0.5) {
  const len = Math.floor(dur * SR);
  const phs = notes.flatMap(() => [rand() * 6, rand() * 6]);
  let lpL = 0, lpR = 0;
  for (let j = 0; j < len; j++) {
    const t = j / SR;
    const env = Math.min(1, t / 0.6) * Math.min(1, (dur - t) / 0.5);
    let sl = 0, sr = 0;
    notes.forEach((m, k) => {
      const f = mtof(m);
      phs[2 * k] += (2 * Math.PI * f * 1.003) / SR;
      phs[2 * k + 1] += (2 * Math.PI * f * 0.997) / SR;
      sl += saw(phs[2 * k], 6);
      sr += saw(phs[2 * k + 1], 6);
    });
    const c = 0.02 + 0.12 * bright;
    lpL += c * (sl - lpL);
    lpR += c * (sr - lpR);
    const i = Math.floor(t0 * SR) + j;
    if (i < N) {
      const v = (gain * 0.07 * env) / notes.length;
      L[i] += lpL * v * duck[i];
      R[i] += lpR * v * duck[i];
      send[i] += (lpL + lpR) * v * 0.4;
    }
  }
}

function bassNote(t0, dur, m, gain = 1) {
  const len = Math.floor(dur * SR);
  let ph = 0, lp = 0;
  const f = mtof(m);
  for (let j = 0; j < len; j++) {
    const t = j / SR;
    ph += (2 * Math.PI * f) / SR;
    const env = Math.min(1, t / 0.008) * Math.exp(-t / 0.35) * Math.min(1, (dur - t) / 0.02);
    lp += 0.08 * (saw(ph, 5) - lp);
    const i = Math.floor(t0 * SR) + j;
    if (i < N) pan(i, (lp * 0.9 + Math.sin(ph) * 0.5) * env * gain * 0.32 * duck[i]);
  }
}

// Subida de ruído antes de um impacto.
function riser(tEnd, dur, gain = 1) {
  let lp = 0, bp = 0;
  const len = Math.floor(dur * SR);
  for (let j = 0; j < len; j++) {
    const p = j / len;
    const f = 2 * Math.sin((Math.PI * (300 + 6000 * p * p)) / SR);
    lp += f * bp;
    const hp = rand() - lp - 0.6 * bp;
    bp += f * hp;
    const v = bp * p ** 2 * gain * 0.35;
    const i = Math.floor((tEnd - dur) * SR) + j;
    if (i >= 0 && i < N) {
      pan(i, v, Math.sin(p * 12) * 0.4);
      send[i] += v * 0.4;
    }
  }
}

function impact(t0, gain = 1) {
  let ph = 0;
  for (let j = 0; j < 2.2 * SR; j++) {
    const t = j / SR;
    const f = 38 + 50 * Math.exp(-t / 0.08);
    ph += (2 * Math.PI * f) / SR;
    const v = (Math.sin(ph) * Math.exp(-t / 0.7) + rand() * Math.exp(-t / 0.05) * 0.4) * gain * 0.8;
    const i = Math.floor(t0 * SR) + j;
    if (i < N) {
      pan(i, v);
      send[i] += v * 0.3;
    }
  }
}

/* ---------- Arranjo ---------- */

const AM = [57, 60, 64];
const F = [53, 57, 60];
const C = [48, 52, 55];
const G = [55, 59, 62];
const PROG = [F, C, G, AM];
const ROOT = { F: 41, C: 36, G: 43, AM: 45 };
const ROOTS = [ROOT.F, ROOT.C, ROOT.G, ROOT.AM];

// Parte A (0 → 10,8 s): tensão em lá menor, pulsação e chimbal crescendo.
// Bumbo em meio tempo a partir do 2º compasso (o baixo abaixa com ele), parando antes da subida para a logo.
for (let t = BAR; t < LOGO - 2 * BEAT; t += 2 * BEAT) kick(t, 0.45 + (t / LOGO) * 0.3);
for (let b = 0; b * BAR < LOGO; b++) {
  const t = b * BAR;
  const chord = b % 2 ? F : AM;
  pad(t, Math.min(BAR + 0.4, LOGO - t + 0.2), chord.map((m) => m + 12), 1.15, 0.15 + 0.1 * b);
  for (let k = 0; k < 8; k++) {
    const tt = t + k * (BEAT / 2);
    if (tt < LOGO - 0.1) bassNote(tt, BEAT / 2 - 0.02, (b % 2 ? ROOT.F : ROOT.AM) + 12, 0.5 + 0.05 * b);
  }
}
for (let t = 2.2; t < LOGO - 0.2; t += BEAT / 2) hat(t, 0.4 + (t / LOGO) * 0.6);
riser(LOGO, 3.2, 1);
impact(LOGO, 1);

// Parte B (10,8 → 55,4 s): groove com bumbo, palmas, chimbal, baixo, pad e arpejo.
// A bateria vem primeiro: o bumbo marca onde pad e baixo abaixam ("sidechain").
const barsB = Math.ceil((END - LOGO) / BAR);
const before = (t) => t < END - 0.03; // nada do groove passa do acorde final
const isIntro = (b) => b < 2; // dois compassos mais leves logo depois da logo
for (let b = 0; b < barsB; b++) {
  const t0 = LOGO + b * BAR;
  const intro = isIntro(b);
  for (let k = 0; k < 4; k++) {
    const tb = t0 + k * BEAT;
    if ((tb >= CTA - BEAT && tb < CTA) || !before(tb)) continue; // respiro antes da chamada e do final
    if (tb >= END - BEAT) continue; // último tempo vira a virada para o acorde final
    kick(tb, intro ? 0.7 : 1);
    if (k % 2 === 1 && !intro) clap(tb, 0.9);
    hat(tb + BEAT / 2, intro ? 0.5 : 0.85, k === 3 && b % 2 === 1);
    if (!intro) hat(tb + BEAT / 4, 0.3), hat(tb + (3 * BEAT) / 4, 0.3);
  }
}
for (let b = 0; b < barsB; b++) {
  const t0 = LOGO + b * BAR;
  const chord = PROG[b % 4];
  const root = ROOTS[b % 4];
  const intro = isIntro(b);
  pad(t0, Math.min(BAR + 0.3, END - t0 + 0.05), [...chord.map((m) => m + 12), chord[0] + 24], 1, intro ? 0.35 : 0.55);
  for (let k = 0; k < 4; k++) {
    const tb = t0 + k * BEAT;
    if ((tb >= CTA - BEAT && tb < CTA) || !before(tb + 0.05)) continue;
    bassNote(tb, BEAT / 2 - 0.02, root, 0.9);
    bassNote(tb + BEAT / 2, BEAT / 2 - 0.02, root + (k === 3 ? 7 : 12), 0.7);
  }
  // Arpejo em semicolcheias com as notas do acorde (duas oitavas acima).
  const arp = [chord[0], chord[1], chord[2], chord[1] + 12, chord[2], chord[1], chord[0] + 12, chord[2]];
  for (let k = 0; k < 16; k++) {
    if (intro && k % 2) continue;
    const tt = t0 + k * (BEAT / 4);
    if (!before(tt)) continue;
    pluck(tt, mtof(arp[k % 8] + 12), k % 4 === 0 ? 0.9 : 0.6, k % 2 ? 0.45 : -0.45);
  }
}
// Virada antes da chamada (50,5 s).
for (let k = 0; k < 8; k++) clap(CTA - BEAT + k * (BEAT / 8), 0.35 + k * 0.08);
riser(CTA, 1.6, 0.6);

// Virada curta e encerramento (55,4 s)
for (let k = 0; k < 4; k++) clap(END - BEAT + k * (BEAT / 4), 0.4 + k * 0.15);
// Encerramento (55,4 s): acorde de dó maior aberto, impacto leve e cauda.
impact(END, 0.7);
pad(END, DUR - END, [48, 55, 60, 64, 67, 72], 1.3, 0.5);
for (let k = 0; k < 6; k++) pluck(END + k * 0.09, mtof([60, 64, 67, 72, 76, 79][k]), 0.8, (k / 5) * 1.2 - 0.6);
bassNote(END, 3.5, 36, 1);

/* ---------- Reverb (Schroeder) e mixagem ---------- */

function reverb(input) {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ buf: new Float32Array(d), i: 0, fb: 0.8, lp: 0 }));
  const aps = [225, 556, 441].map((d) => ({ buf: new Float32Array(d), i: 0 }));
  const out = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.lp = y * 0.7 + c.lp * 0.3;
      c.buf[c.i] = input[n] + c.lp * c.fb;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    for (const a of aps) {
      const y = a.buf[a.i];
      const x = s + y * -0.5;
      a.buf[a.i] = x;
      a.i = (a.i + 1) % a.buf.length;
      s = y + x * 0.5;
    }
    out[n] = s * 0.25;
  }
  return out;
}
const wet = reverb(send);
for (let n = 0; n < N; n++) {
  const d = Math.round(n - 0.011 * SR);
  L[n] += wet[n];
  R[n] += d >= 0 ? wet[d] : 0;
}

// Entrada e saída suaves, compressão leve e normalização.
let peak = 0;
for (let n = 0; n < N; n++) {
  const t = n / SR;
  const g = Math.min(1, t / 0.4) * Math.min(1, (DUR - t) / 1.5);
  L[n] = Math.tanh(L[n] * 1.4 * g);
  R[n] = Math.tanh(R[n] * 1.4 * g);
  peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
}
const gain = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  buf.writeInt16LE(Math.round(L[n] * gain * 32767), 44 + n * 4);
  buf.writeInt16LE(Math.round(R[n] * gain * 32767), 46 + n * 4);
}
const wav = path.join(os.tmpdir(), `trilha-${process.pid}.wav`);
const mp3 = SAIDA;
fs.writeFileSync(wav, buf);
fs.mkdirSync(path.dirname(mp3), { recursive: true });
try {
  execFileSync('npx', ['remotion', 'ffmpeg', '-v', 'error', '-y', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '256k', mp3], { stdio: 'inherit', shell: process.platform === 'win32' });
} finally {
  fs.rmSync(wav, { force: true });
}
console.log(mp3, (fs.statSync(mp3).size / 1e6).toFixed(1), 'MB');
