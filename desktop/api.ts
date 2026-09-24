// Contrato entre o processo principal (Electron) e a interface.
import type { Brand } from '../src/brand';
import type { VideoSpec } from '../src/types';

export type VideoStatus = 'rascunho' | 'pronto' | 'alterado' | 'gerando';

export type VideoMeta = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  format: string;
  seconds: number | null;
  status: VideoStatus;
  brandId: string;
  brandName: string;
  ai: boolean; // montado com IA
  renderedAt?: string;
  videoUrl?: string; // file:// do MP4 gerado
  thumbUrl?: string; // file:// da miniatura
};

// Situação da montagem com IA de um roteiro.
export type AiInfo = {
  enabled: boolean; // "montagem: ia" no topo do roteiro
  hasPlan: boolean;
  stale: boolean; // o texto mudou depois da montagem
  formatChanged: boolean; // o formato mudou depois da montagem
  summary?: string; // explicação da IA
  instruction?: string;
  generatedAt?: string;
  origin?: number[]; // cena do plano de cada cena do vídeo
};

export type ParseResult = ({ ok: true; spec: VideoSpec; seconds: number } | { ok: false; error: string }) & { ai?: AiInfo };

export type AiEvent = { id: string; kind: 'progress'; stage: string } | { id: string; kind: 'done' } | { id: string; kind: 'error'; message: string };

export type UpdateInfo = {
  current: string;
  enabled: boolean; // há um endereço de atualizações configurado
  available: { version: string; notes: string[]; date?: string } | null;
  canInstall: boolean; // instala sozinho (Windows); senão abre a página de download
};

export type UpdateEvent =
  | { kind: 'available'; info: UpdateInfo }
  | { kind: 'uptodate'; info: UpdateInfo }
  | { kind: 'progress'; progress: number }
  | { kind: 'installing' }
  | { kind: 'error'; message: string };

export type AiKeyStatus = { configured: boolean; source: 'app' | 'ambiente' | null; hint?: string };

export type RenderEvent =
  | { id: string; kind: 'progress'; stage: string; progress: number }
  | { id: string; kind: 'done'; meta: VideoMeta }
  | { id: string; kind: 'error'; message: string };

export type NewVideo = { name: string; format: string; template: 'exemplo' | 'branco' | 'ia'; brandId?: string; brief?: string };

export type BrandList = { brands: Brand[]; defaultId: string; folder: string };

export type FrentyApi = {
  list(): Promise<VideoMeta[]>;
  create(input: NewVideo): Promise<VideoMeta>;
  importMarkdown(): Promise<VideoMeta[]>;
  get(id: string): Promise<{ meta: VideoMeta; markdown: string }>;
  save(id: string, markdown: string): Promise<VideoMeta>;
  rename(id: string, name: string): Promise<VideoMeta>;
  duplicate(id: string): Promise<VideoMeta>;
  remove(id: string): Promise<boolean>;
  parse(markdown: string, id?: string): Promise<ParseResult>;
  aiCompose(id: string, opts?: { instruction?: string; scene?: number }): Promise<{ ok: true; markdown: string } | { ok: false; error: string; needsKey?: boolean }>;
  aiCancel(id: string): Promise<void>;
  onAi(cb: (e: AiEvent) => void): () => void;
  aiKeyStatus(): Promise<AiKeyStatus>;
  setAiKey(key: string | null): Promise<AiKeyStatus>;
  openExternal(url: string): Promise<void>;
  updateInfo(): Promise<UpdateInfo>;
  checkUpdate(): Promise<UpdateInfo>;
  installUpdate(): Promise<void>;
  onUpdate(cb: (e: UpdateEvent) => void): () => void;
  render(id: string): Promise<void>;
  cancelRender(id: string): Promise<void>;
  onRender(cb: (e: RenderEvent) => void): () => void;
  openVideo(id: string): Promise<void>;
  showInFolder(id: string): Promise<void>;
  exportVideo(id: string): Promise<boolean>;
  exportMarkdown(id: string): Promise<boolean>;
  brands(): Promise<BrandList>;
  saveBrand(brand: Brand): Promise<Brand>;
  createBrand(fromId?: string): Promise<Brand>;
  removeBrand(id: string): Promise<boolean>;
  setDefaultBrand(id: string): Promise<void>;
  resetBrand(): Promise<Brand | null>;
  importBrand(): Promise<Brand | null>;
  exportBrand(id: string): Promise<boolean>;
  pickLogo(): Promise<{ dataUrl: string } | { error: string } | null>;
  libraryPath(): Promise<string>;
  chooseLibrary(): Promise<string | null>;
  openLibrary(): Promise<void>;
};

declare global {
  interface Window {
    frenty: FrentyApi;
  }
}
