import type { Scene } from '../../src/types';
import type { VideoStatus } from '../api';

export const FORMAT_LABEL: Record<string, string> = { horizontal: 'Horizontal 16:9', vertical: 'Vertical 9:16', quadrado: 'Quadrado 1:1' };
export const FORMAT_SHORT: Record<string, string> = { horizontal: '16:9', vertical: '9:16', quadrado: '1:1' };

export const STATUS: Record<VideoStatus, { label: string; tone: string }> = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  pronto: { label: 'Vídeo pronto', tone: 'positive' },
  alterado: { label: 'Desatualizado', tone: 'attention' },
  gerando: { label: 'Gerando', tone: 'info' },
};

export const SCENE: Record<Scene['type'], { label: string; color: string }> = {
  intro: { label: 'Abertura', color: '#6C5CE7' },
  text: { label: 'Texto', color: '#2D3436' },
  bullets: { label: 'Lista', color: '#00A8FF' },
  stats: { label: 'Números', color: '#00B35A' },
  chart: { label: 'Gráfico', color: '#00A8FF' },
  quote: { label: 'IAF', color: '#8E7CF0' },
  cta: { label: 'Chamada', color: '#00D26A' },
  outro: { label: 'Encerramento', color: '#241C5C' },
  steps: { label: 'Etapas', color: '#6C5CE7' },
  compare: { label: 'Antes e depois', color: '#E17055' },
  bignumber: { label: 'Número', color: '#00B35A' },
  icongrid: { label: 'Ícones', color: '#00A8FF' },
  statement: { label: 'Impacto', color: '#D63384' },
  testimonial: { label: 'Depoimento', color: '#8E7CF0' },
  composition: { label: 'Composição', color: '#F39C12' },
};

export const seconds = (s: number | null | undefined) =>
  s == null ? '—' : `${s.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`;

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
export const ago = (iso: string) => {
  const diff = (Date.parse(iso) - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return 'agora mesmo';
};

const plain = (t: string) => t.replace(/\*\*/g, '');
export const sceneTitle = (s: Scene) => {
  if (s.type === 'outro') return 'Logo e slogan';
  if ('title' in s && s.title) return plain(s.title);
  if (s.type === 'statement') return plain(s.text);
  if (s.type === 'bignumber') return `${s.value} ${plain(s.label)}`;
  if (s.type === 'testimonial') return s.author;
  if (s.type === 'composition') return plain(s.elements.find((e) => e.kind === 'titulo')?.text ?? SCENE.composition.label);
  return SCENE[s.type].label;
};

export const SNIPPETS = [
  { label: 'Texto', type: 'text' as const, md: '## Título da cena\n\nSua mensagem principal com **destaque**.\n' },
  { label: 'Lista', type: 'bullets' as const, md: '## Com a Frenty você\n\n- **Preveja** a demanda\n- **Automatize** a reposição\n- **Venda mais** no PDV\n' },
  { label: 'Números', type: 'stats' as const, md: '## Resultados\n\n- **+30%** em vendas\n- **-20%** de custos\n- **8h** economizadas por semana\n' },
  { label: 'Gráfico', type: 'chart' as const, md: '## Vendas por mês\n\n- Jan: 120\n- Fev: 150\n- Mar: 185\n- Abr: 240\n' },
  { label: 'Conversa IAF', type: 'quote' as const, md: '## Pergunte para a IAF\n\n> **Você:** Quanto vou vender no sábado?\n> **IAF:** Cerca de **18% a mais**. Já preparei o pedido de reposição.\n' },
  { label: 'Chamada', type: 'cta' as const, md: '## Comece hoje\n\nTeste grátis por 14 dias. [Agende uma demonstração](https://frenty.com.br)\n' },
];
