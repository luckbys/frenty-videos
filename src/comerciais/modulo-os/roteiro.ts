// Roteiro do comercial: duração de cada cena (30 qps), transição para a próxima e o texto da narração
// (escrito do jeito que se fala, para a voz pronunciar certo). Total: 60 s.
export type Cena = {
  id: string;
  quadros: number;
  transicao?: { tipo: 'barras' | 'zoom' | 'deslizar'; quadros: number };
  logoNoCanto: boolean;
  narracao: string;
  vozEm?: number; // quadro da cena em que a fala começa
};

export const CENAS: Cena[] = [
  {
    id: 'caos',
    quadros: 186,
    transicao: { tipo: 'zoom', quadros: 12 },
    logoNoCanto: true,
    narracao: 'Ordem de serviço no papel, na planilha, no grupo do WhatsApp? Diga adeus à gestão manual.',
    vozEm: 4,
  },
  {
    id: 'problemas',
    quadros: 168,
    transicao: { tipo: 'barras', quadros: 18 },
    logoNoCanto: true,
    narracao: 'Etapa esquecida, custo que ninguém confere, cliente sem resposta. Isso acaba aqui.',
  },
  {
    id: 'marca',
    quadros: 180,
    transicao: { tipo: 'deslizar', quadros: 14 },
    logoNoCanto: false,
    narracao: 'Conheça o Módulo de Ordens de Serviço da Frenty, integrado ao seu é-erre-pê: criação, acompanhamento e fechamento, num lugar só.',
  },
  {
    id: 'criar',
    quadros: 252,
    transicao: { tipo: 'zoom', quadros: 12 },
    logoNoCanto: true,
    narracao: 'Abra uma ó-ésse em segundos e registre cada etapa do serviço.',
  },
  {
    id: 'tempo',
    quadros: 228,
    transicao: { tipo: 'deslizar', quadros: 14 },
    logoNoCanto: true,
    narracao: 'Acompanhe em tempo real o prazo de execução e o custo de cada ordem.',
  },
  {
    id: 'historico',
    quadros: 228,
    transicao: { tipo: 'barras', quadros: 18 },
    logoNoCanto: true,
    narracao: 'Histórico completo de cada cliente, e toda a equipe vendo a mesma informação, na hora.',
  },
  {
    id: 'beneficios',
    quadros: 222,
    transicao: { tipo: 'zoom', quadros: 12 },
    logoNoCanto: true,
    narracao: 'Mais organização, menos erros, clientes mais satisfeitos, custos sob controle e relatórios para decidir melhor.',
  },
  {
    id: 'integracao',
    quadros: 168,
    transicao: { tipo: 'barras', quadros: 18 },
    logoNoCanto: true,
    narracao: 'Integre com o seu cê-erre-eme e automatize tarefas para responder mais rápido.',
  },
  {
    id: 'chamada',
    quadros: 162,
    transicao: { tipo: 'zoom', quadros: 14 },
    logoNoCanto: false,
    narracao: 'Comece hoje mesmo. Solicite uma demonstração gratuita.',
  },
  {
    id: 'final',
    quadros: 138,
    logoNoCanto: false,
    narracao: 'Frenty. Mais tempo para o seu negócio crescer.',
  },
];

export const TOTAL = CENAS.reduce((t, c) => t + c.quadros - (c.transicao?.quadros ?? 0), 0);
