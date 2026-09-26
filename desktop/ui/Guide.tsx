import React from 'react';
import { SCENE } from './util';

const blocks: { type: keyof typeof SCENE; title: string; text: string; md: string }[] = [
  { type: 'intro', title: 'Abertura', text: 'O título com # abre o vídeo junto com o logo. O parágrafo logo abaixo vira o subtítulo.', md: '# Conheça a **IAF**\n\nO ERP que prevê e vende com você.' },
  { type: 'text', title: 'Texto', text: 'Uma cena ## com parágrafo mostra a frase palavra por palavra.', md: '## O desafio do lojista\n\nEstoque parado e ruptura. **Todo dia.**' },
  { type: 'bullets', title: 'Lista', text: 'Itens com - viram cartões. O ícone de cada um é escolhido pela palavra em negrito (estoque, vendas, WhatsApp, relatórios…). Até 6 itens.', md: '## Com a Frenty você\n\n- **Preveja** a demanda\n- **Automatize** compras' },
  { type: 'stats', title: 'Números', text: 'Quando todos os itens começam com um número em negrito, os números contam na tela. Até 4.', md: '## Resultados\n\n- **+22%** no ticket médio\n- **8h** economizadas' },
  { type: 'chart', title: 'Gráfico de barras', text: 'Itens no formato "Rótulo: número" viram barras que crescem, com linha de tendência. O maior valor fica na cor de destaque.', md: '## Vendas por mês\n\n- Jan: 120\n- Fev: 150\n- Mar: 185' },
  { type: 'quote', title: 'Conversa com a IAF', text: 'Citações com > viram um chat. Use "Você:" para a pessoa e o nome do assistente (ex.: "IAF:") para a resposta, que aparece digitando.', md: '## Pergunte para a IAF\n\n> **Você:** Quanto vou vender no sábado?\n> **IAF:** Cerca de **18% a mais**.' },
  { type: 'cta', title: 'Chamada para ação', text: 'Um link vira o botão na cor de destaque. Um cursor entra e clica nele, e o endereço aparece embaixo.', md: '## Comece hoje\n\nTeste grátis. [Agende uma demo](https://frenty.com.br)' },
];

export const Guide: React.FC = () => (
  <div className="page guide">
    <header className="page-head">
      <div>
        <h1>Como escrever o roteiro</h1>
        <p className="muted">
          Cores, fontes e logo vêm da marca escolhida (veja Identidade visual). Você só escreve o conteúdo: cada <code>##</code> vira uma cena, e
          o tipo de animação vem do que está nela.
        </p>
      </div>
    </header>
    <article className="guide-card plain guide-ai">
      <h3>Montagem com IA</h3>
      <p>
        Com <strong>Montar com IA</strong>, a IA escolhida (Claude ou Groq, em <strong>⋯ → IA da montagem</strong>) lê o roteiro (que pode ser um texto livre, sem ## nem listas) e decide cena a cena o melhor
        componente: além dos abaixo, <strong>etapas</strong>, <strong>antes e depois</strong>, <strong>número em destaque</strong>,{' '}
        <strong>grade de ícones</strong>, <strong>frase de impacto</strong>, <strong>depoimento</strong>, <strong>composição livre</strong> e{' '}
        <strong>telas do sistema</strong> (painéis, formulários, tabelas e o chat da IAF no navegador, numa janela ou no celular, com cursor
        clicando, texto sendo digitado e zoom). Ela
        também reescreve os textos de tela, escolhe ou desenha ícones, alterna os fundos e define o ritmo das transições. A IA só usa fatos que
        estão no roteiro; nas telas, pode completar com dados de exemplo.
      </p>
      <p className="muted small">
        Depois, peça ajustes em texto ("mais curto", "destaque os números") para remontar tudo, ou selecione uma cena na linha do tempo e use
        Refazer cena. No arquivo, a montagem com IA fica ligada por <code>montagem: ia</code> no topo; o plano é salvo junto do vídeo e só muda
        quando você pede.
      </p>
    </article>
    <article className="guide-card plain guide-ai">
      <h3>Narração por voz</h3>
      <p>
        Configure a chave do <strong>ElevenLabs</strong> em <strong>⋯ → Narração por voz</strong> e todo vídeo gerado ganha a fala do roteiro
        sozinho — não precisa pedir nada. O texto de cada cena (título, itens, números, a fala do chat com a IAF…) vira narração, e a cena
        estica o tempo que for preciso para a fala nunca ser cortada.
      </p>
      <p className="muted small">
        Dá para trocar a voz na mesma janela, ou desligar só num vídeo em <strong>Desligar neste vídeo</strong> (ou{' '}
        <code>narração: false</code> no topo do roteiro).
      </p>
    </article>
    <div className="guide-grid">
      {blocks.map((b) => (
        <article key={b.type} className="guide-card" style={{ ['--c' as string]: SCENE[b.type].color }}>
          <h3>{b.title}</h3>
          <p>{b.text}</p>
          <pre>{b.md}</pre>
        </article>
      ))}
    </div>
    <div className="guide-grid two">
      <article className="guide-card plain">
        <h3>Configurações no topo do arquivo</h3>
        <pre>{`---
formato: vertical      # horizontal, vertical ou quadrado
duracao_maxima: 60     # em segundos, até 90
marca: minha-marca     # outra marca só neste vídeo
slogan: Texto do final # opcional
encerramento: false    # tira a cena final com logo
efeitos_sonoros: false # vídeo sem sons
montagem: ia           # cenas montadas pela IA
site: frenty.com.br    # endereço na cena final (padrão: site da marca)
---`}</pre>
      </article>
      <article className="guide-card plain">
        <h3>Ajustes finos por cena</h3>
        <p>
          <code>**negrito**</code> destaca palavras na cor da marca. Comentários dentro da cena forçam o tipo ou a duração:
        </p>
        <pre>{`<!-- tipo: bullets -->
<!-- duracao: 6 -->`}</pre>
        <p className="muted small">
          A duração de cada cena é calculada pelo tamanho do texto. Se o total passar de 90 s, as cenas são encurtadas automaticamente.
        </p>
      </article>
    </div>
  </div>
);
