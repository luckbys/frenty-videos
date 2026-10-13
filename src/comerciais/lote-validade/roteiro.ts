// Roteiro do comercial do Gerenciador de Lote e Validade: duração de cada cena (30 qps), transição para a
// próxima e o texto da narração (escrito do jeito que se fala, para a voz pronunciar certo). Total: 60 s.
// Os pontos de virada (logo em 10,8 s, chamada em 50,5 s e final em 55,4 s) batem com os da trilha.
import type { Cena } from '../modulo-os/roteiro';

export const CENAS: Cena[] = [
  {
    id: 'caos',
    quadros: 186,
    transicao: { tipo: 'zoom', quadros: 12 },
    logoNoCanto: true,
    narracao: 'Produto vencido no estoque é dinheiro no lixo. E ainda pode virar multa.',
    vozEm: 4,
  },
  {
    id: 'problemas',
    quadros: 168,
    transicao: { tipo: 'barras', quadros: 18 },
    logoNoCanto: true,
    narracao: 'Perda por vencimento, risco de multa, lote sem rastreio. Isso acaba aqui.',
  },
  {
    id: 'marca',
    quadros: 180,
    transicao: { tipo: 'deslizar', quadros: 14 },
    logoNoCanto: false,
    narracao: 'Conheça o Gerenciador de Lote e Validade da Frenty, integrado ao seu é-erre-pê.',
  },
  {
    id: 'cadastro',
    quadros: 246,
    transicao: { tipo: 'zoom', quadros: 12 },
    logoNoCanto: true,
    narracao: 'Cadastre produtos, atribua lotes e defina a validade de cada um, com o estoque sempre à vista.',
  },
  {
    id: 'alertas',
    quadros: 234,
    transicao: { tipo: 'deslizar', quadros: 14 },
    logoNoCanto: true,
    narracao: 'Alertas automáticos avisam com antecedência o que está perto de vencer, para você agir antes da perda.',
  },
  {
    id: 'rastreio',
    quadros: 240,
    transicao: { tipo: 'barras', quadros: 18 },
    logoNoCanto: true,
    narracao: 'Rastreie cada lote de ponta a ponta, com histórico completo de movimentações para a auditoria.',
  },
  {
    id: 'beneficios',
    quadros: 216,
    transicao: { tipo: 'zoom', quadros: 12 },
    logoNoCanto: true,
    narracao: 'Menos desperdício, conformidade com as exigências legais e sanitárias e mais confiança dos seus clientes.',
  },
  {
    id: 'integracao',
    quadros: 162,
    transicao: { tipo: 'barras', quadros: 18 },
    logoNoCanto: true,
    narracao: 'Tudo integrado ao é-erre-pê e aos módulos de compras e vendas.',
  },
  {
    id: 'chamada',
    quadros: 162,
    transicao: { tipo: 'zoom', quadros: 14 },
    logoNoCanto: false,
    narracao: 'Evite perdas e multas. Solicite uma demonstração gratuita.',
  },
  {
    id: 'final',
    quadros: 138,
    logoNoCanto: false,
    narracao: 'Frenty. Mais tempo para o seu negócio crescer.',
  },
];

export const TOTAL = CENAS.reduce((t, c) => t + c.quadros - (c.transicao?.quadros ?? 0), 0);
