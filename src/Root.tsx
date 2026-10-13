import React from 'react';
import { Composition, type CalculateMetadataFunction } from 'remotion';
import { FrentyVideo } from './Video';
import { ComercialModuloOS, COMERCIAL_MODULO_OS_QUADROS } from './comerciais/modulo-os';
import { totalFrames } from './parse-duration';
import { formats, theme } from './theme';
import type { VideoSpec } from './types';
// Gerado por `npm run render` (ou `npm run preview`) a partir do último .md usado.
import ultimo from './ultimo-video.json';

const calculateMetadata: CalculateMetadataFunction<VideoSpec> = ({ props }) => ({
  durationInFrames: Math.max(1, totalFrames(props.scenes)),
  ...formats[props.format],
});

export const Root: React.FC = () => (
  <>
    <Composition
      id="FrentyVideo"
      component={FrentyVideo}
      fps={theme.video.fps}
      width={1920}
      height={1080}
      durationInFrames={300}
      defaultProps={ultimo as VideoSpec}
      calculateMetadata={calculateMetadata}
    />
    {/* Comerciais feitos sob medida (fora do gerador por .md). */}
    <Composition id="ComercialModuloOS" component={ComercialModuloOS} fps={30} width={1080} height={1920} durationInFrames={COMERCIAL_MODULO_OS_QUADROS} defaultProps={{ trilha: true }} />
  </>
);
