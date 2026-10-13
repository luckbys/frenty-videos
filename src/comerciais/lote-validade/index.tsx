// Comercial "Gerenciador de Lote e Validade" (9:16, 60 s), no mesmo padrão do comercial do Módulo de O.S.:
// identidade oficial Frenty, cenas ilustradas (sem telas de sistema), trilha própria e narração por cena.
// Render: npx remotion render src/index.ts ComercialLoteValidade saida/frenty-lote-validade.mp4
import '../../fonts';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { FrentyLogo } from '../../components/FrentyLogo';
import { Sfx } from '../../motion/core';
import { CenaFinal } from '../modulo-os/cenas-final';
import { M } from '../modulo-os/tokens';
import { barras, deslizar, zoom } from '../modulo-os/transicoes';
import { Grain } from '../modulo-os/ui';
import { CenaCaos, CenaMarca, CenaProblemas } from './cenas-abertura';
import { CenaBeneficios, CenaChamadaLote, CenaIntegracaoLote } from './cenas-final';
import { CenaAlertas, CenaCadastro, CenaRastreio } from './cenas-produto';
import { CENAS, TOTAL } from './roteiro';

export { TOTAL as COMERCIAL_LOTE_VALIDADE_QUADROS };

const VIEWS: Record<string, React.FC> = {
  caos: CenaCaos,
  problemas: CenaProblemas,
  marca: CenaMarca,
  cadastro: CenaCadastro,
  alertas: CenaAlertas,
  rastreio: CenaRastreio,
  beneficios: CenaBeneficios,
  integracao: CenaIntegracaoLote,
  chamada: CenaChamadaLote,
  final: CenaFinal,
};
const PRESENT = { barras, zoom, deslizar };

// Início de cada cena na linha do tempo (as transições se sobrepõem às cenas).
const inicios = () => {
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

export const ComercialLoteValidade: React.FC<ComercialProps> = ({ vozes = [], trilha = true }) => {
  useFonts();
  const starts = inicios();
  // Com narração, a trilha fica baixa para a voz aparecer; sem ela, a trilha conduz o vídeo.
  const musica = vozes.some(Boolean) ? 0.3 : 0.75;
  return (
    <AbsoluteFill style={{ background: '#1A0940' }}>
      <TransitionSeries>
        {CENAS.flatMap((c) => {
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
          <Html5Audio src={staticFile('comerciais/trilha-lote-validade.mp3')} volume={(f) => interpolate(f, [0, 20, TOTAL - 50, TOTAL], [0, musica, musica, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
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
