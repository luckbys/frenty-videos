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
  model?: string; // modelo que montou
  origin?: number[]; // cena do plano de cada cena do vídeo
};

export type ParseResult = ({ ok: true; spec: VideoSpec; seconds: number } | { ok: false; error: string }) & { ai?: AiInfo; voice?: boolean };

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
export type AiProvider = 'claude' | 'groq';
// Qual IA monta os vídeos e as chaves de cada uma (a chave nunca volta para a tela, só o final dela).
export type AiSettings = { provider: AiProvider; groqModel: string; defaultGroqModel: string; keys: Record<AiProvider, AiKeyStatus> };
export type AiSettingsPatch = { provider?: AiProvider; groqModel?: string; claudeKey?: string | null; groqKey?: string | null };

// Narração por voz (ElevenLabs): com a chave configurada, todo vídeo gerado ganha narração sozinho.
export type VoiceOption = { id: string; name: string };
export type VoiceSettings = { voiceId: string; defaultVoiceId: string; key: AiKeyStatus };
export type VoiceSettingsPatch = { voiceId?: string; apiKey?: string | null };

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
  aiSettings(): Promise<AiSettings>;
  setAiSettings(patch: AiSettingsPatch): Promise<AiSettings>;
  voiceSettings(): Promise<VoiceSettings>;
  setVoiceSettings(patch: VoiceSettingsPatch): Promise<VoiceSettings>;
  listVoices(): Promise<{ ok: true; voices: VoiceOption[] } | { ok: false; error: string }>;
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
