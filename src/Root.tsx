import React from 'react';
import { Composition, type CalculateMetadataFunction } from 'remotion';
import { FrentyVideo } from './Video';
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
);
