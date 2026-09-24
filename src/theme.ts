// Parâmetros técnicos do vídeo. A identidade visual (cores, fontes, logo) fica em src/brand.tsx
// e pode ser trocada por perfil de marca, sem editar código.

export const theme = {
  video: {
    fps: 30,
    maxSeconds: 90,
    transitionFrames: 18,
  },
} as const;

export const formats = {
  horizontal: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  quadrado: { width: 1080, height: 1080 },
} as const;

export type FormatName = keyof typeof formats;
