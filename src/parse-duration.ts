import { theme } from './theme';
import type { Scene } from './types';

// Duração total descontando a sobreposição das transições.
export function totalFrames(scenes: Scene[]) {
  const sum = scenes.reduce((a, s) => a + s.frames, 0);
  return sum - theme.video.transitionFrames * Math.max(0, scenes.length - 1);
}
