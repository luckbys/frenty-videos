// Diretor de IA: lê o roteiro e a marca e devolve o plano de cenas (componentes, textos, ícones e ritmo).
// Usa a API do Claude ou do Groq, com saída estruturada no formato de ../ai/plan.ts. Só roda no Node (app e linha de comando).
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'node:crypto';
import type { Brand } from '../brand';
import { ICON_NAMES } from '../components/Icons';
import { theme, type FormatName } from '../theme';
import { askGroq, GROQ_DEFAULT_MODEL, GroqError } from './groq';
import { PLAN_SCHEMA, SCENE_SCHEMA, planToScenes, type Plan, type PlanIcon, type PlanScene, type StoredPlan } from './plan';

export const MODEL = 'claude-opus-5';
export type Provider = 'claude' | 'groq';
export const PROVIDER_NAME: Record<Provider, string> = { claude: 'Claude', groq: 'Groq' };
export { GROQ_DEFAULT_MODEL };
// Se o modelo principal recusar o pedido, a própria API tenta de novo com o modelo reserva recomendado.
const BETAS: Anthropic.Beta.AnthropicBeta[] = ['server-side-fallback-2026-07-01'];

export const contentHash = (body: string) => crypto.createHash('sha1').update(body.trim()).digest('hex').slice(0, 16);

export class DirectorError extends Error {
  name = 'DirectorError';
}

export type Progress = { stage: string; scenes?: number };

type Common = {
  markdown: string;
  brand: Brand;
  format: FormatName;
  maxSeconds?: number;
  apiKey?: string;
  provider?: Provider; // padrão: claude
  model?: string; // só para o Groq (padrão GROQ_DEFAULT_MODEL)
  signal?: AbortSignal;
  onProgress?: (p: Progress) => void;
};

const FORMAT_HINT: Record<FormatName, string> = {
  horizontal: 'horizontal 16:9 (1920×1080) — cabe texto em linha; listas e grades de até 3–4 colunas',
  vertical: 'vertical 9:16 (1080×1920) — para celular: textos BEM curtos, tudo empilhado, no máximo 2 colunas',
  quadrado: 'quadrado 1:1 (1080×1080) — textos curtos, grades de até 2–3 colunas',
};

const system = (brand: Brand, format: FormatName, maxSeconds: number) => `Você é o diretor de arte e roteirista de motion graphics da empresa "${brand.nome}". A partir de um roteiro ou briefing, você decide cena a cena como o vídeo vai contar a história: qual componente visual usar, o texto que aparece na tela, os ícones, o fundo e o ritmo. O vídeo é renderizado automaticamente a partir do seu plano, na identidade visual da marca (cores, fontes e logo já são aplicados pelo sistema).

Marca: ${brand.nome}${brand.slogan ? ` — slogan: "${brand.slogan}"` : ''}${brand.site ? ` — site: ${brand.site}` : ''}. Assistente virtual da marca: ${brand.assistente}.
Formato: ${FORMAT_HINT[format]}.
Duração máxima: ${maxSeconds} segundos no total (cada troca de cena sobrepõe ${(theme.video.transitionFrames / theme.video.fps).toFixed(1)} s).

COMPONENTES (campo "tipo"). Escolha o que melhor mostra cada ideia, não o que repete o roteiro ao pé da letra:
- abertura: título do vídeo com o logo animado. Normalmente a primeira cena.
- impacto: uma frase curta e forte, enorme na tela (chamada = etiqueta pequena acima, opcional). Ótimo para abrir, virar a história ou fechar uma ideia.
- texto: uma mensagem de 1–2 frases com rótulo opcional.
- lista: 2–6 itens curtos, cada um com ícone.
- etapas: um processo ou jornada em 2–5 passos numerados (como funciona, passo a passo, cronologia).
- comparacao: antes × depois, problema × solução, sem × com a marca (2–4 itens por lado).
- numero_destaque: UM número grande que conta de 0 até o valor, com rótulo e contexto. Use quando um número sozinho é o argumento.
- numeros: 2–4 números lado a lado.
- grafico: barras com 2–8 valores numéricos comparáveis (meses, lojas, categorias).
- grade_icones: 2–6 recursos/benefícios em cartões com ícone (rotulo curto + texto opcional).
- conversa: diálogo em balões entre uma pessoa e a assistente ${brand.assistente} (2–4 mensagens). Use quando o roteiro mostra uma pergunta à assistente ou uma interação com o produto.
- depoimento: citação de um cliente com autor e cargo. SÓ se o roteiro trouxer a citação e o autor.
- chamada: chamada para ação com botão (e url). Normalmente a penúltima cena.
- composicao: layout livre quando nenhum componente pronto serve (veja regras abaixo). Use com moderação (no máximo 2 por vídeo).
- encerramento: logo, slogan e site. Sempre a última cena (slogan e url vazios = usar os da marca).

REGRAS DE CONTEÚDO
- Escreva em português do Brasil, no tom da marca: direto, confiante, próximo.
- Use somente fatos, números, nomes e promessas que estão no roteiro. Nunca invente estatísticas, clientes, depoimentos, preços ou prazos. Se o roteiro não tem números, não use numero_destaque/numeros/grafico.
- Texto de tela é curto: títulos com até ~8 palavras, itens com até ~7 palavras${format === 'vertical' ? ' (no vertical, ainda mais curto)' : ''}. Reescreva e condense o roteiro; não cole parágrafos.
- Marque com **negrito** 1–2 palavras-chave por texto (elas ganham cor e marca-texto na animação). Não use outro markdown.
- Se o roteiro pedir um tipo de cena (comentário <!-- tipo: ... -->) ou uma duração (<!-- duracao: ... -->), respeite.
- Se o roteiro tiver um link, use-o na chamada; se tiver site, use no encerramento.
- Campos de texto que não se aplicam ficam como string vazia "".

REGRAS DE DIREÇÃO
- Conte uma história: gancho → problema/contexto → solução → prova → chamada → encerramento. Adapte ao conteúdo (um anúncio, um tutorial e um relatório pedem estruturas diferentes).
- Varie: não repita o mesmo tipo em cenas seguidas e alterne o fundo (claro, escuro, cor) para dar respiro. "cor" é a cor cheia da marca: use em momentos de impacto, no máximo 1 a cada 3 cenas.
- "cor" de destaque (primaria, secundaria, destaque) muda o tom de cada cena; varie também.
- segundos de cada cena: tempo de leitura (~3 palavras por segundo) + 1,5 s de animação; entre 3 e 12 s. A soma deve ficar abaixo de ${maxSeconds} s. Vídeos curtos e ágeis funcionam melhor: prefira menos cenas bem feitas.
- ritmo: "energico" para lançamentos, promoções e redes sociais; "calmo" para temas institucionais, sensíveis ou explicativos; "equilibrado" no resto.
- resumo: 1–2 frases para o usuário explicando as escolhas (por que essa estrutura e esses componentes).

ÍCONES
- Campo "icone": use um destes nomes: ${ICON_NAMES.join(', ')}.
- Se nenhum representar bem a ideia, crie um ícone em "icones" (no máximo 4 por vídeo): nome em minúsculas-com-hífen (diferente dos nomes acima) e "caminhos" = 1 a 6 atributos "d" de <path> SVG num quadro de 24×24, desenhados como ícone de linha (traço de 2px, sem preenchimento, margem de 2px, formas simples e legíveis em tamanho pequeno). Depois use esse nome no campo "icone".

COMPOSIÇÃO LIVRE (tipo composicao)
- A área segura do quadro é uma grade de 12 colunas × 12 linhas; cada elemento ocupa x, y (0–11), largura e altura (em células, sem passar de 12). Pense no formato ${format}: ${format === 'vertical' ? 'as células são altas e estreitas — empilhe de cima para baixo' : format === 'quadrado' ? 'as células são quadradas' : 'as células são largas e baixas — distribua na horizontal'}.
- Elementos: titulo, texto, numero, selo (etiqueta), icone (quadrado colorido com ícone), ilustracao (ícone grande de traço fino sobre um círculo de cor), forma (bloco decorativo de cor, fica atrás).
- Não sobreponha textos. Deixe respiro. "ordem" define a sequência de entrada (elementos com a mesma ordem entram juntos).`;

const client = (apiKey?: string) => {
  try {
    return new Anthropic(apiKey ? { apiKey } : {});
  } catch {
    throw new DirectorError('Configure a chave da API do Claude para montar vídeos com IA.');
  }
};

const friendly = (e: unknown): Error => {
  if (e instanceof DirectorError) return e;
  if (e instanceof Anthropic.APIUserAbortError) return new DirectorError('Montagem com IA cancelada.');
  if (e instanceof Anthropic.AuthenticationError) return new DirectorError('A chave da API do Claude não foi aceita. Confira a chave nas configurações.');
  if (e instanceof Anthropic.PermissionDeniedError) return new DirectorError('A chave da API não tem permissão para usar o modelo. Confira sua conta na Anthropic.');
  if (e instanceof Anthropic.RateLimitError) return new DirectorError('Muitos pedidos à IA em pouco tempo. Espere um minuto e tente de novo.');
  if (e instanceof Anthropic.APIConnectionError) return new DirectorError('Sem conexão com a IA. Verifique a internet e tente de novo.');
  if (e instanceof Anthropic.InternalServerError) return new DirectorError('A IA está instável no momento. Tente de novo em instantes.');
  if (e instanceof Anthropic.APIError) return new DirectorError(`A IA recusou o pedido (${e.status}): ${e.message}`);
  if (e instanceof Error && /api.?key|credentials|authentication/i.test(e.message))
    return new DirectorError('Configure a chave da API do Claude para montar vídeos com IA.');
  return e instanceof Error ? e : new Error(String(e));
};

const friendlyGroq = (e: unknown, model: string): Error => {
  if (e instanceof DirectorError) return e;
  if (e instanceof Error && e.name === 'AbortError') return new DirectorError('Montagem com IA cancelada.');
  if (e instanceof GroqError) {
    if (e.message === 'max_tokens') return new DirectorError('O plano ficou grande demais. Encurte o roteiro e tente de novo.');
    if (e.message === 'resposta incompleta') return new DirectorError('A IA devolveu uma resposta incompleta. Tente de novo.');
    if (e.status === 401) return new DirectorError('Configure uma chave da API do Groq válida para montar vídeos com IA.');
    if (e.status === 403) return new DirectorError('A chave da API do Groq não tem permissão para usar este modelo.');
    if (e.status === 404 || /model.*(not exist|not found|decommissioned)|model_not_found/i.test(e.message))
      return new DirectorError(`O Groq não encontrou o modelo "${model}". Confira o nome do modelo nas configurações da IA.`);
    if (e.status === 413) return new DirectorError('O roteiro ficou grande demais para o Groq. Encurte o roteiro ou use o Claude.');
    if (e.status === 429) return new DirectorError('Limite de uso do Groq atingido. Espere um minuto e tente de novo.');
    if (e.status >= 500) return new DirectorError('O Groq está instável no momento. Tente de novo em instantes.');
    return new DirectorError(`O Groq recusou o pedido (${e.status}): ${e.message}`);
  }
  if (e instanceof TypeError) return new DirectorError('Sem conexão com o Groq. Verifique a internet e tente de novo.');
  return e instanceof Error ? e : new Error(String(e));
};

// Chama o Claude em streaming e devolve o JSON da resposta. Com `schema`, a saída vem garantida no formato;
// se a API não aceitar o esquema, tenta de novo pedindo só o JSON e valida do nosso lado.
async function ask(opts: Common & { user: string; schema: Record<string, unknown>; effort: 'low' | 'medium' | 'high' }): Promise<unknown> {
  const maxSeconds = opts.maxSeconds ?? theme.video.maxSeconds;
  if (opts.provider === 'groq') {
    const model = opts.model?.trim() || GROQ_DEFAULT_MODEL;
    try {
      opts.onProgress?.({ stage: 'Lendo o roteiro' });
      return await askGroq({ apiKey: opts.apiKey, model, system: system(opts.brand, opts.format, maxSeconds), user: opts.user, schema: opts.schema, signal: opts.signal, onProgress: opts.onProgress });
    } catch (e) {
      throw friendlyGroq(e, model);
    }
  }
  const api = client(opts.apiKey);
  const run = async (structured: boolean, fallback = true): Promise<unknown> => {
    const stream = api.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 32000,
        ...(fallback ? { betas: BETAS, fallbacks: 'default' as const } : {}),
        thinking: { type: 'adaptive' },
        output_config: structured ? { effort: opts.effort, format: { type: 'json_schema', schema: opts.schema } } : { effort: opts.effort },
        system: system(opts.brand, opts.format, maxSeconds),
        messages: [
          {
            role: 'user',
            content: structured ? opts.user : `${opts.user}\n\nResponda apenas com um objeto JSON neste esquema, sem texto antes ou depois:\n${JSON.stringify(opts.schema)}`,
          },
        ],
      },
      { signal: opts.signal },
    );
    let chars = '';
    let thinking = false;
    for await (const ev of stream) {
      if (ev.type === 'content_block_start' && ev.content_block.type === 'thinking' && !thinking) {
        thinking = true;
        opts.onProgress?.({ stage: 'Pensando na história do vídeo' });
      } else if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
        chars += ev.delta.text;
        const scenes = (chars.match(/"tipo"\s*:\s*"(?!titulo|texto|icone|numero|selo|ilustracao|forma")/g) ?? []).length;
        opts.onProgress?.({ stage: scenes ? `Criando cena ${scenes}` : 'Escolhendo os componentes', scenes });
      }
    }
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') throw new DirectorError('A IA não aceitou montar este roteiro. Revise o conteúdo e tente de novo.');
    if (msg.stop_reason === 'max_tokens') throw new DirectorError('O plano ficou grande demais. Encurte o roteiro e tente de novo.');
    const textOut = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const json = textOut.slice(textOut.indexOf('{'), textOut.lastIndexOf('}') + 1);
    try {
      return JSON.parse(json);
    } catch {
      throw new DirectorError('A IA devolveu uma resposta incompleta. Tente de novo.');
    }
  };
  try {
    opts.onProgress?.({ stage: 'Lendo o roteiro' });
    // Pedido recusado pela API (400) por um recurso opcional: tenta de novo sem ele
    // (primeiro sem o modelo reserva, depois sem a saída estruturada).
    const rejected = (e: unknown, re: RegExp) => e instanceof Anthropic.BadRequestError && re.test(e.message);
    let structured = true;
    let fallback = true;
    for (;;) {
      try {
        return await run(structured, fallback);
      } catch (e) {
        if (fallback && rejected(e, /fallback/i)) fallback = false;
        else if (structured && rejected(e, /schema|output_config|format|grammar/i)) structured = false;
        else throw e;
      }
    }
  } catch (e) {
    throw friendly(e);
  }
}

export const modelName = (o: { provider?: Provider; model?: string }) => (o.provider === 'groq' ? o.model?.trim() || GROQ_DEFAULT_MODEL : MODEL);

const brief = (markdown: string) => `ROTEIRO / BRIEFING:\n<roteiro>\n${markdown.trim()}\n</roteiro>`;

export async function composeVideo(opts: Common & { instruction?: string; previous?: Plan }): Promise<StoredPlan> {
  const parts = [brief(opts.markdown)];
  if (opts.previous) parts.push(`PLANO ATUAL (ajuste a partir dele, mantendo o que funciona):\n${JSON.stringify(opts.previous)}`);
  if (opts.instruction?.trim()) parts.push(`PEDIDO DO USUÁRIO PARA ESTA MONTAGEM: ${opts.instruction.trim()}`);
  parts.push('Monte o plano completo do vídeo.');
  const raw = (await ask({ ...opts, user: parts.join('\n\n'), schema: PLAN_SCHEMA, effort: 'medium' })) as Plan;
  // Valida já aqui: se nada for aproveitável, o erro aparece agora e não na hora de gerar o vídeo.
  planToScenes(raw, { maxSeconds: opts.maxSeconds });
  opts.onProgress?.({ stage: 'Plano pronto', scenes: raw.cenas?.length });
  return {
    versao: 1,
    geradoEm: new Date().toISOString(),
    modelo: modelName(opts),
    formato: opts.format,
    fonte: contentHash(bodyOf(opts.markdown)),
    ...(opts.instruction?.trim() ? { instrucao: opts.instruction.trim() } : {}),
    plano: raw,
  };
}

// Refaz uma cena do plano (mesma posição), podendo trocar o componente.
export async function recomposeScene(opts: Common & { stored: StoredPlan; index: number; instruction?: string }): Promise<StoredPlan> {
  const plan = opts.stored.plano;
  if (!plan.cenas[opts.index]) throw new DirectorError('Cena não encontrada.');
  const user = [
    brief(opts.markdown),
    `PLANO ATUAL:\n${JSON.stringify(plan)}`,
    `Refaça somente a cena ${opts.index + 1} (índice ${opts.index}, tipo atual "${plan.cenas[opts.index].tipo}"), mantendo a coerência com as vizinhas. Pode trocar o componente se outro contar melhor a ideia.`,
    opts.instruction?.trim() ? `PEDIDO DO USUÁRIO: ${opts.instruction.trim()}` : 'Proponha uma versão diferente e melhor.',
    'Devolva a nova cena em "cena" e, se criar ícones novos, em "icones".',
  ].join('\n\n');
  const raw = (await ask({ ...opts, user, schema: SCENE_SCHEMA, effort: 'low' })) as { cena: PlanScene; icones: PlanIcon[] };
  if (!raw?.cena) throw new DirectorError('A IA não devolveu a cena. Tente de novo.');
  const cenas = [...plan.cenas];
  cenas[opts.index] = raw.cena;
  const icones = [...(plan.icones ?? []), ...(raw.icones ?? []).filter((n) => !(plan.icones ?? []).some((o) => o.nome === n.nome))];
  const next: Plan = { ...plan, cenas, icones };
  planToScenes(next, { maxSeconds: opts.maxSeconds });
  return { ...opts.stored, geradoEm: new Date().toISOString(), modelo: modelName(opts), plano: next };
}

// Conteúdo do roteiro sem o cabeçalho (mudar formato ou marca não invalida o plano).
export const bodyOf = (markdown: string) => markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

export const planIsStale = (stored: StoredPlan, markdown: string) => stored.fonte !== contentHash(bodyOf(markdown));
