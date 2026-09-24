import type { Brand } from './brand';
import type { FormatName } from './theme';

export type ChatMessage = { from: 'voce' | 'iaf'; text: string };

// Fundo das cenas que a IA pode variar: claro, escuro (roxo profundo) ou cor cheia da marca.
export type Surface = 'claro' | 'escuro' | 'cor';
// Cor de destaque escolhida para a cena.
export type Tint = 'primaria' | 'secundaria' | 'destaque';

export type CompositionElement = {
  kind: 'titulo' | 'texto' | 'icone' | 'numero' | 'selo' | 'ilustracao' | 'forma';
  text: string;
  icon: string;
  x: number; // grade de 12 colunas × 12 linhas dentro da área segura
  y: number;
  w: number;
  h: number;
  align: 'esquerda' | 'centro' | 'direita';
  color: Tint | 'texto';
  size: 'p' | 'm' | 'g' | 'gg';
  enter: 'subir' | 'escala' | 'desenhar' | 'deslizar' | 'digitar';
  order: number;
};

export type Scene =
  | { type: 'intro'; title: string; subtitle?: string; frames: number }
  | { type: 'text'; title?: string; body: string; frames: number }
  | { type: 'bullets'; title?: string; items: string[]; icons?: string[]; frames: number }
  | { type: 'stats'; title?: string; items: { value: string; label: string }[]; frames: number }
  | { type: 'chart'; title?: string; items: { label: string; value: number; display: string }[]; frames: number }
  | { type: 'quote'; title?: string; messages: ChatMessage[]; frames: number }
  | { type: 'cta'; title: string; body?: string; button: string; url?: string; frames: number }
  | { type: 'outro'; slogan?: string; url?: string; frames: number }
  // Componentes que a montagem com IA combina conforme o contexto.
  | { type: 'steps'; title?: string; items: { title: string; text?: string; icon: string }[]; surface: Surface; tint: Tint; frames: number }
  | { type: 'compare'; title?: string; before: { label: string; items: string[] }; after: { label: string; items: string[] }; surface: Surface; frames: number }
  | { type: 'bignumber'; value: string; label: string; context?: string; trend: 'sobe' | 'desce' | 'neutra'; icon: string; surface: Surface; tint: Tint; frames: number }
  | { type: 'icongrid'; title?: string; items: { icon: string; label: string; text?: string }[]; surface: Surface; tint: Tint; frames: number }
  | { type: 'statement'; kicker?: string; text: string; surface: Surface; tint: Tint; frames: number }
  | { type: 'testimonial'; quote: string; author: string; role?: string; surface: Surface; tint: Tint; frames: number }
  | { type: 'composition'; elements: CompositionElement[]; surface: Surface; frames: number };

// Ícone desenhado pela IA: traços num quadro de 24×24, como os ícones de linha da marca.
export type CustomIcon = { name: string; paths: string[] };

export type Rhythm = 'calmo' | 'equilibrado' | 'energico';

export type VideoSpec = {
  format: FormatName;
  sfx: boolean;
  scenes: Scene[];
  marca?: string; // perfil pedido no topo do .md (id ou caminho de um .json)
  brand?: Partial<Brand>; // perfil já carregado; sem ele, vale o padrão Frenty
  icons?: CustomIcon[]; // ícones criados pela IA para este vídeo
  rhythm?: Rhythm; // ritmo das transições escolhido pela IA
};
