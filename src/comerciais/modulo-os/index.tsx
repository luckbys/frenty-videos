// Comercial "Módulo de Ordens de Serviço" (9:16, 60 s), feito sob medida com a identidade oficial Frenty.
// Render: npx remotion render src/index.ts ComercialModuloOS saida/frenty-modulo-os.mp4
import '../../fonts';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { FrentyLogo } from '../../components/FrentyLogo';
import { Sfx } from '../../motion/core';
import { CenaCaos, CenaMarca, CenaProblemas } from './cenas-abertura';
import { CenaBeneficios, CenaChamada, CenaFinal, CenaIntegracao } from './cenas-final';
import { CenaCriar, CenaHistorico, CenaTempoReal } from './cenas-produto';
import { CENAS, TOTAL } from './roteiro';
import { M } from './tokens';
import { barras, deslizar, zoom } from './transicoes';
import { Grain } from './ui';

export { TOTAL as COMERCIAL_MODULO_OS_QUADROS };

const VIEWS: Record<string, React.FC> = {
  caos: CenaCaos,
  problemas: CenaProblemas,
  marca: CenaMarca,
  criar: CenaCriar,
  tempo: CenaTempoReal,
  historico: CenaHistorico,
  beneficios: CenaBeneficios,
  integracao: CenaIntegracao,
  chamada: CenaChamada,
  final: CenaFinal,
};
const PRESENT = { barras, zoom, deslizar };

// Início de cada cena na linha do tempo (as transições se sobrepõem às cenas).
export const inicios = () => {
  const out: number[] = [];
  let t = 0;
  CENAS.forEach((c) => {
    out.push(t);
    t += c.quadros - (c.transicao?.quadros ?? 0);
  });
  return out;
};

const useFonts = () => {
  const [handle] = useState(() => delayRender('Carregando Nunito'));
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) (done = true), continueRender(handle);
    };
    Promise.allSettled([700, 800, 900].map((w) => document.fonts.load(`${w} 40px "Nunito"`, 'Aa'))).then(finish);
    const t = setTimeout(finish, 8000);
    return () => clearTimeout(t);
  }, [handle]);
};

// Logo pequena no canto de cima, fora das cenas que já mostram a logo grande.
const CornerLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const starts = inicios();
  const hidden = CENAS.map((c, i) => (c.logoNoCanto ? null : [starts[i] - 6, starts[i] + c.quadros - (c.transicao?.quadros ?? 0) + 6])).filter(Boolean) as number[][];
  const vis = hidden.reduce((v, [a, b]) => Math.min(v, interpolate(frame, [a - 8, a, b, b + 8], [1, 0, 0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })), 1);
  if (vis <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: M, top: 86, opacity: vis * 0.95 }}>
      <FrentyLogo height={46} animate={false} />
    </div>
  );
};

export type ComercialProps = { vozes?: (string | null)[]; trilha?: boolean };

export const ComercialModuloOS: React.FC<ComercialProps> = ({ vozes = [], trilha = true }) => {
  useFonts();
  const starts = inicios();
  // Com narração, a trilha fica baixa para a voz aparecer; sem ela, a trilha conduz o vídeo.
  const musica = vozes.some(Boolean) ? 0.3 : 0.75;
  return (
    <AbsoluteFill style={{ background: '#1A0940' }}>
      <TransitionSeries>
        {CENAS.flatMap((c, i) => {
          const View = VIEWS[c.id];
          const els = [
            <TransitionSeries.Sequence key={c.id} durationInFrames={c.quadros}>
              <View />
            </TransitionSeries.Sequence>,
          ];
          if (c.transicao) {
            els.push(<TransitionSeries.Transition key={`t${c.id}`} presentation={PRESENT[c.transicao.tipo]()} timing={linearTiming({ durationInFrames: c.transicao.quadros })} />);
          }
          return els;
        })}
      </TransitionSeries>
      <CornerLogo />
      <Grain />
      {CENAS.map((c, i) => (c.transicao ? <Sfx key={c.id} name="whoosh" at={starts[i] + c.quadros - c.transicao.quadros - 2} volume={0.32} /> : null))}
      {trilha && (
        <Sequence from={0} durationInFrames={TOTAL} layout="none">
          <Html5Audio src={staticFile('comerciais/trilha-modulo-os.mp3')} volume={(f) => interpolate(f, [0, 20, TOTAL - 50, TOTAL], [0, musica, musica, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
        </Sequence>
      )}
      {vozes.map((src, i) =>
        src ? (
          <Sequence key={`v${i}`} from={starts[i] + (CENAS[i].vozEm ?? 8)} layout="none">
            <Html5Audio src={src} />
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
