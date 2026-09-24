// Sintetiza os efeitos sonoros (sem arquivos de terceiros) em public/sfx/*.wav.
import fs from 'node:fs';

const SR = 44100;
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function wav(name, seconds, fn) {
  const n = Math.floor(seconds * SR);
  const data = new Float32Array(n);
  fn(data, n);
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  const gain = peak > 0 ? 0.9 / peak : 1;
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * gain)) * 32767), 44 + i * 2);
  fs.writeFileSync(`public/sfx/${name}.wav`, buf);
}

// Filtro passa-banda (state variable) com frequência variável.
function svf() {
  let low = 0, band = 0;
  return (x, freq, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(freq, SR / 6)) / SR);
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return band;
  };
}

const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

// Whoosh: ruído com banda que sobe e desce, para as transições.
wav('whoosh', 0.7, (d, n) => {
  const f = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const p = t / 0.7;
    const freq = 300 + 4200 * Math.sin(Math.PI * Math.min(1, p * 1.15)) ** 2;
    const amp = Math.sin(Math.PI * Math.min(1, p * 1.1)) ** 2;
    d[i] = f(rand(), freq, 0.9) * amp;
  }
});

// Pop: entrada de itens e cartões.
wav('pop', 0.16, (d, n) => {
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const freq = 380 + 620 * Math.exp(-t * 38);
    ph += (2 * Math.PI * freq) / SR;
    d[i] = Math.sin(ph) * env(t, 0.003, 0.045) + rand() * 0.05 * env(t, 0.001, 0.006);
  }
});

// Tick: contagem dos números.
wav('tick', 0.05, (d, n) => {
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    d[i] = Math.sin(2 * Math.PI * 2400 * t) * env(t, 0.001, 0.008) * 0.6;
  }
});

// Clique do cursor no botão.
wav('click', 0.09, (d, n) => {
  const f = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const burst = env(t, 0.0005, 0.004) + 0.6 * env(Math.max(0, t - 0.035), 0.0005, 0.005) * (t > 0.035 ? 1 : 0);
    d[i] = f(rand(), 3200, 0.5) * burst;
  }
});

// Chime: assinatura sonora do logo (acorde de Mi maior em sinos suaves).
wav('chime', 1.8, (d, n) => {
  const notes = [
    [659.25, 0, 1],
    [830.61, 0.07, 0.8],
    [987.77, 0.14, 0.75],
    [1318.5, 0.21, 0.5],
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const [fr, st, a] of notes) {
      if (t < st) continue;
      const tt = t - st;
      const e = env(tt, 0.004, 0.55);
      v += a * e * (Math.sin(2 * Math.PI * fr * tt) + 0.25 * Math.sin(2 * Math.PI * fr * 2.01 * tt) * Math.exp(-tt * 4));
    }
    d[i] = v;
  }
});

// Digitação da IAF: batidas leves e curtas.
wav('type', 0.04, (d, n) => {
  const f = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    d[i] = f(rand(), 1800, 0.6) * env(t, 0.0005, 0.006);
  }
});

console.log('Efeitos gerados em public/sfx/');
