# Frenty Video — gerador de motion graphics a partir de .md

A identidade visual vem de um **perfil de marca** (cores, fontes, logo, slogan, assistente, estilo).
O padrão é a Frenty; dá para criar outras marcas sem mexer em código. O conteúdo vem do arquivo `.md`.
Cada vídeo tem no máximo **90 segundos**.

## App desktop (recomendado)

Um aplicativo para criar, pré-visualizar e gerenciar os vídeos sem usar o terminal.

- **Windows (recomendado):** rode `FrentyVideos-Setup-1.6.0.exe`. Ele instala o programa com atalho
  na área de trabalho e no menu Iniciar, sem precisar de Node.js nem de internet para gerar vídeos.
  Como o instalador não tem assinatura digital, o Windows pode mostrar "O Windows protegeu o computador":
  clique em **Mais informações** → **Executar assim mesmo**.
- **A partir do código:** `npm install` e depois `npm run app` (ou `Abrir Frenty Videos.bat` / `.command`).

Se o programa encontrar um erro ao abrir, ele mostra uma mensagem e grava os detalhes em
`%APPDATA%\Frenty Videos\erros.log`. Cada abertura também grava as etapas em
`%APPDATA%\Frenty Videos\inicio.log`. Se a tela não chegou a carregar na vez anterior, o programa abre
sozinho sem aceleração de vídeo; o atalho **Frenty Vídeos (modo seguro)** no menu Iniciar força esse modo.

Para gerar um novo instalador (a partir do Linux, com nsis e wine64): `bash scripts/empacotar-windows.sh`.

### Atualizações automáticas

A partir da 1.3.0 o programa procura versão nova ao abrir e a cada 6 horas, consultando
`https://github.com/luckbys/frenty-videos/releases/latest/download/latest.json` (campo `atualizacoes` do
`package.json`). Quando há versão nova, abre a janela **Nova versão disponível** com as novidades:
**Atualizar agora** baixa o instalador, confere o SHA-256 e instala em silêncio, e o programa reabre sozinho;
**Depois** deixa um selo "Atualizar para …" na barra lateral. O rodapé mostra a versão instalada e
**Procurar atualizações**. Vídeos, marcas e configurações são mantidos. Não atualiza enquanto um vídeo
está sendo gerado ou a IA está montando.

Para publicar uma versão nova:

1. Mude `version` no `package.json` (ex.: `1.3.1`) e escreva a seção `## 1.3.1` em `NOVIDADES.md`
2. Envie o código e uma tag igual à versão: `git tag v1.3.1 && git push origin main v1.3.1`
3. O GitHub Actions (`.github/workflows/publicar.yml`) gera o instalador num Windows, cria o `latest.json`
   (`scripts/manifesto.mjs`) e publica os dois em Releases. Os programas instalados veem a versão nova sozinhos.

O que o app faz:

- **Montagem com IA** (veja abaixo): descreva o vídeo em texto livre e a IA monta as cenas
- **Biblioteca** com miniatura, duração, marca e status de cada vídeo (Rascunho, Vídeo pronto, Desatualizado)
- **Identidade visual**: edite a marca com prévia ao vivo (veja abaixo)
- **Editor** do roteiro com prévia ao vivo: a prévia muda enquanto você digita e acompanha a cena onde está o cursor
- Botões para **inserir cenas** prontas (Texto, Lista, Números, IAF, Chamada)
- Troca de **formato** (16:9, 9:16, 1:1), escolha da **marca** do vídeo e medidor do limite de 90 s
- **Gerar vídeo** em segundo plano com barra de progresso e opção de cancelar (atalho Ctrl+Enter)
- Duplicar, excluir, importar `.md`, exportar o roteiro, salvar cópia do MP4, abrir a pasta
- Guia "Como escrever o roteiro" dentro do app

Os vídeos ficam em `Documentos/Frenty Vídeos` (dá para trocar a pasta no rodapé da barra lateral).
Cada vídeo é uma pasta com `roteiro.md`, o `.mp4` gerado e a miniatura. As marcas ficam em
`Documentos/Frenty Vídeos/Marcas`, um `.json` por marca.

## Montagem com IA

A IA lê o roteiro e decide cena a cena como contar a história: qual componente
usar, o texto que aparece na tela, os ícones (escolhe entre ~50 ou desenha um novo), o fundo de cada
cena (claro, escuro ou a cor da marca) e o ritmo das transições. O roteiro pode ser um texto livre,
sem `##` nem listas. A IA só usa fatos que estão no roteiro: não inventa números, clientes ou depoimentos.

Componentes que ela combina, além das 8 cenas do roteiro: **etapas** (passo a passo), **antes e depois**,
**número em destaque**, **grade de ícones**, **frase de impacto**, **depoimento** e **composição livre**
(a IA posiciona títulos, textos, ícones, números e selos numa grade 12×12).

**Telas do sistema**: a IA monta telas de produto no estilo shadcn/ui (cartões, indicadores, gráficos de
barras/área/rosca, tabelas, listas, formulários, busca, alertas, notificações, progresso e o chat da IAF),
dentro de um navegador, de uma janela de app ou de um celular (no vídeo vertical, sempre no celular).
A tela entra em 3D e ganha vida com motion design: blocos em cascata, números contando, cursor que clica,
texto sendo digitado, câmera que dá zoom num bloco, destaque e notificação. Nessas telas a IA pode usar
dados de exemplo quando o roteiro não traz números. Depois de montar, o plano passa por uma revisão
automática (ações impossíveis, blocos inexistentes, duração): se houver problema, a IA corrige uma vez.

No app:

- **Novo vídeo → Descrever para a IA**: escreva o que o vídeo deve comunicar e clique em *Criar e montar com IA*
- Em qualquer roteiro, **Montar com IA** no painel abaixo da prévia
- **Peça um ajuste** em texto ("mais curto", "destaque os números") e clique em *Remontar*, ou selecione
  uma cena na linha do tempo e use *Refazer cena*
- *Usar montagem automática* volta às regras do roteiro (o plano da IA fica guardado)

Duas IAs podem montar os vídeos, escolhidas em **⋯ → IA da montagem** no editor (ou no link "IA: …" do painel):

- **Claude** (Anthropic, `claude-opus-5`): as melhores escolhas de cena; mais lento e mais caro.
  Chave em console.anthropic.com ou variável `ANTHROPIC_API_KEY`.
- **Groq** com um modelo aberto, por padrão `qwen/qwen3.8-27b` (o nome do modelo é editável na mesma janela):
  muito rápido e barato. Chave em console.groq.com ou variável `GROQ_API_KEY`.

A primeira vez, o app pede a chave da IA escolhida. Ela fica guardada só no computador, criptografada pelo
sistema; o uso é cobrado na conta dona da chave. Cada IA tem sua chave, então dá para alternar sem digitar de novo. É preciso internet só para montar; gerar o MP4 continua offline.

O plano da IA é salvo junto do vídeo (`plano-ia.json`) e só muda quando você pede. Se o texto mudar depois,
o app avisa e oferece *Atualizar com IA*. No roteiro, a montagem com IA fica ligada por `montagem: ia` no topo.

Detalhes técnicos: modelo `claude-opus-5` com raciocínio adaptativo e saída estruturada (JSON Schema em
`src/ai/plan.ts`); tudo o que volta é validado antes de virar cena (tamanhos, ícones, posições, traços SVG).
Se o modelo recusar o pedido, a própria API tenta de novo com o modelo reserva recomendado
(`fallbacks: "default"`).

## Narração por voz

Com uma chave do **ElevenLabs** configurada (**⋯ → Narração por voz** no editor, ou o link "Narração com voz"
no painel), todo vídeo gerado ganha a fala do roteiro — sem precisar pedir nada. O texto de cada cena (o que
aparece na tela: título, itens, números, a fala do chat com a IAF…) vira uma narração, e a cena estica o
tempo que for preciso para a fala nunca ser cortada (o vídeo pode passar dos 90s de limite nesse caso). Dá
para trocar a voz na mesma janela, e desligar a narração só num vídeo com **Desligar neste vídeo** (ou
`narração: false` no topo do roteiro).

A chave fica guardada só no computador, criptografada, e o uso é cobrado na conta dona da chave — crie uma em
elevenlabs.io/app/developers. O áudio de cada cena fica em cache (não gasta créditos de novo enquanto o texto
e a voz não mudarem).

## Linha de comando

### Instalar (uma vez)

Requer Node.js 18+.

```bash
npm install
```

### Gerar um vídeo

```bash
npm run render -- exemplos/lancamento-iaf.md
# saída: saida/lancamento-iaf.mp4  (ou informe outro caminho como 2º argumento)

npm run render -- exemplos/lancamento-iaf.md --marca marcas/minha-marca.json
# mesma coisa com outra identidade visual
```

Com montagem por IA (precisa de `ANTHROPIC_API_KEY`):

```bash
npm run render -- exemplos/briefing-livre-ia.md --ia
# o plano fica em exemplos/briefing-livre-ia.plano-ia.json e é reaproveitado enquanto o texto não mudar
npm run render -- exemplos/briefing-livre-ia.md --ia --pedido "mais curto, destaque o desconto"
npm run render -- exemplos/briefing-livre-ia.md --ia --refazer   # monta do zero
# com o Groq (precisa de GROQ_API_KEY); --modelo troca o modelo padrão qwen/qwen3.8-27b
npm run render -- exemplos/briefing-livre-ia.md --ia --refazer --provedor groq
```

Com narração por voz (basta ter `ELEVENLABS_API_KEY` no ambiente — liga sozinho; use `--sem-voz` para
desligar só nesta geração, ou `--voz-id` para trocar a voz padrão):

```bash
npm run render -- exemplos/lancamento-iaf.md
```

Pré-visualizar e ajustar no navegador (Remotion Studio):

```bash
npm run preview -- exemplos/lancamento-iaf.md
```

## Como escrever o .md

```markdown
---
formato: horizontal      # horizontal (1920x1080) | vertical (1080x1920) | quadrado (1080x1080)
duracao_maxima: 60       # opcional, em segundos (teto de 90)
marca: minha-marca       # opcional; perfil de marca (padrão: a marca padrão)
slogan: Texto final      # opcional; padrão é o slogan da marca
encerramento: true       # false remove a cena final com logo
efeitos_sonoros: true    # false gera o vídeo sem sons
site: frenty.com.br      # endereço na cena final (padrão: o link da chamada ou o site da marca)
---

# Título do vídeo            → abertura com logo
Parágrafo logo abaixo        → subtítulo da abertura

## Título da cena            → cada ## vira uma cena
```

O tipo de cada cena é detectado pelo conteúdo:

| Conteúdo da cena `##` | Cena gerada |
| --- | --- |
| Parágrafo | Frase de impacto: palavras sobem de trás de uma máscara, destaques ganham marca-texto |
| Lista `- item` | Cartões com ícone escolhido pela palavra em negrito (estoque, vendas, WhatsApp…) |
| Lista `- **+35%** texto` (todos com número em negrito) | Cartões com contagem animada e medidor circular (até 4) |
| Lista `- Jan: 120` (todos "rótulo: número") | Gráfico de barras que crescem, linha de tendência e maior valor em verde |
| Citação `> **Você:** …` / `> **IAF:** …` | Chat com a IAF: a pessoa pergunta, a IAF aparece digitando e responde |
| Parágrafo com link `[Botão](site.com)` | Botão verde; um cursor entra, clica e o endereço é digitado |

- `**negrito**` vira destaque na cor da marca.
- Forçar tipo: `<!-- tipo: grafico -->` (texto, lista, numeros, grafico, conversa, chamada).
- Forçar duração da cena: `<!-- duracao: 6 -->` (segundos).

Linguagem de movimento (fixa, em `src/motion/`):
- Abertura e encerramento com o logo se montando (anel se desenha, pontos caem, letras sobem) e onda circular
- Fundo com aurora de cor, anéis do símbolo, grade de pontos e partículas; câmera com leve aproximação
- Três transições da marca: anel do logo abrindo do centro, faixas roxa/azul/verde atravessando e empurrão lateral
- Efeitos sonoros sutis (whoosh, pop, clique, digitação, assinatura do logo), sintetizados por `scripts/gen-sfx.mjs`.
  Para desligar num vídeo: `efeitos_sonoros: false` no topo do .md

A duração é calculada pelo volume de texto. Se passar do limite, todas as cenas são
encurtadas proporcionalmente (mínimo 2,5s cada); se nem assim couber, o render para
e diz quantas cenas remover.

## Identidade visual (perfis de marca)

No app, abra **Identidade visual** na barra lateral. Cada marca tem:

- **Empresa:** nome, slogan (cena final), site e nome do assistente da cena de conversa
- **Logo:** envie SVG ou PNG para fundo claro e para fundo escuro (até 2 MB). Sem arquivo,
  o logo é desenhado: o texto do logotipo e, se quiser, o símbolo de anel com três pontos
- **Cores:** primária, destaque, secundária, fundo claro, texto e fundo escuro (automático
  ou fixo). O app avisa quando alguma combinação fica difícil de ler, e o vídeo escurece
  sozinho uma cor clara demais quando ela vira texto
- **Tipografia:** fonte dos títulos, dos textos e do logo desenhado, entre 9 fontes
  embutidas (Plus Jakarta Sans, Inter, Poppins, Montserrat, DM Sans, Nunito, Sora, Outfit, Manrope)
- **Estilo:** cantos retos, suaves ou redondos; logo no canto; barra de progresso; partículas

A prévia ao lado mostra um vídeo de amostra com a marca que está sendo editada. Nada muda
nos vídeos até clicar em **Salvar marca**; depois disso, os vídeos que usam a marca aparecem
como *Desatualizado* até serem gerados de novo.

Uma marca é a **padrão** (menu da marca → Usar como padrão). No editor, o seletor ao lado das
abas da prévia escolhe outra marca só para aquele vídeo (grava `marca: id` no topo do roteiro).
Perfis podem ser exportados e importados como `.json` para usar em outro computador.
A marca Frenty não pode ser excluída, mas pode ser restaurada ao padrão do manual.

**Na linha de comando** a marca vem de, nesta ordem: `--marca arquivo.json`; `marca:` no topo
do `.md` (um id procura `marcas/<id>.json`, ou um caminho `.json`); `marca.json` na raiz do
projeto; e, sem nada disso, a Frenty. Em um `.json` escrito à mão, o logo pode ser um caminho
relativo ao próprio arquivo (`"arquivoClaro": "logo.svg"`). Veja `marcas/frenty.json` como modelo.

Configurações técnicas (fps, limite de 90 s, duração das transições) ficam em `src/theme.ts`.

## Estrutura

- `src/brand.tsx` — perfil de marca, paleta derivada (contraste, tons) e `useBrand()` usado pelas cenas
- `src/brand-file.ts` — leitura de perfis `.json` e logos do disco
- `src/parse.ts` — lê o .md e monta as cenas, aplica o limite de 90s
- `src/ai/` — montagem com IA: `director.ts` (pedido ao Claude ou ao Groq, `groq.ts`) e `plan.ts` (esquema do plano e validação)
- `src/audio/` — narração por voz: `elevenlabs.ts` (pedido à API) e `narration.ts` (texto de cada cena, cache, estica a cena para caber a fala)
- `src/spec.ts` — junta roteiro e plano da IA na especificação do vídeo
- `src/scenes/` — as 8 cenas do roteiro, `Smart.tsx` (etapas, antes e depois, número, ícones, impacto, depoimento), `Composition.tsx` (composição livre) e `Interface.tsx` (telas do sistema)
- `src/ui/` — telas do sistema: `kit.tsx` (componentes no estilo shadcn/ui) e `geometry.ts` (layout, linha do tempo das ações, câmera)
- `src/motion/` — linguagem de movimento: curvas, tipografia cinética, fundo, transições, sons
- `src/components/` — logo animado, assistente IAF, ícones
- `src/Video.tsx` — sequência com transições e barra de progresso
- `scripts/render.ts` — CLI de render
- `desktop/` — app desktop (Electron): `main.ts` (janela e biblioteca), `brands.ts` (marcas), `render-worker.ts` (geração em segundo plano), `ui/` (interface React; `BrandStudio.tsx` é a tela de identidade visual, `AiPanel.tsx` o painel da montagem com IA)

## Licença do Remotion

O Remotion é gratuito para pessoas físicas e empresas com até 3 funcionários.
Acima disso, é preciso uma licença de empresa em https://remotion.pro.
