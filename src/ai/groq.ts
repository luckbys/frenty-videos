// Montagem com IA pelo Groq (API compatível com OpenAI, chamada direto por HTTP).
// Pede saída em JSON Schema; se o modelo não aceitar, cai para JSON simples e valida do nosso lado.
export const GROQ_URL = process.env.GROQ_BASE_URL?.replace(/\/$/, '') || 'https://api.groq.com/openai/v1';
export const GROQ_DEFAULT_MODEL = 'qwen/qwen3.8-27b';

export class GroqError extends Error {
  constructor(
    message: string,
    public status = 0,
    public body = '',
  ) {
    super(message);
  }
}

type Opts = {
  apiKey?: string;
  model: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  signal?: AbortSignal;
  onProgress?: (p: { stage: string }) => void;
};

type Mode = 'schema' | 'json' | 'text';
// O que cada modelo recusou nesta sessão, para não repetir os pedidos que já falharam.
const learned = new Map<string, { mode: Mode; reasoning: boolean }>();

async function call(o: Opts, mode: Mode, reasoning: boolean) {
  const res = await fetch(`${GROQ_URL}/chat/completions`, {
    method: 'POST',
    signal: o.signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${o.apiKey}` },
    body: JSON.stringify({
      model: o.model,
      temperature: 0.6,
      max_completion_tokens: 16000,
      // Modelos com raciocínio (Qwen 3): esconde o raciocínio e devolve só a resposta.
      ...(reasoning ? { reasoning_format: 'hidden' } : {}),
      ...(mode === 'schema'
        ? { response_format: { type: 'json_schema', json_schema: { name: 'plano', schema: o.schema, strict: false } } }
        : mode === 'json'
          ? { response_format: { type: 'json_object' } }
          : {}),
      messages: [
        { role: 'system', content: o.system },
        // O esquema vai no texto também: no modo JSON simples é a única referência que o modelo tem.
        { role: 'user', content: `${o.user}\n\nResponda apenas com um objeto JSON neste esquema, sem texto antes ou depois:\n${JSON.stringify(o.schema)}` },
      ],
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text)?.error?.message ?? text;
    } catch {}
    throw new GroqError(message.slice(0, 400), res.status, text);
  }
  const data = JSON.parse(text);
  const choice = data?.choices?.[0];
  if (choice?.finish_reason === 'length') throw new GroqError('max_tokens', 0);
  return String(choice?.message?.content ?? '');
}

// Devolve o JSON da resposta. Erros da API saem como GroqError (status + mensagem) para o diretor traduzir.
export async function askGroq(o: Opts): Promise<unknown> {
  if (!o.apiKey) throw new GroqError('sem chave', 401);
  let { mode, reasoning } = learned.get(o.model) ?? { mode: 'schema' as Mode, reasoning: true };
  let invalidJson = 0;
  o.onProgress?.({ stage: 'Montando as cenas' });
  for (;;) {
    let out: string;
    try {
      out = await call(o, mode, reasoning);
    } catch (e) {
      if (!(e instanceof GroqError) || e.status !== 400) throw e;
      const m = `${e.message} ${e.body}`;
      // Recurso opcional recusado: tenta de novo sem ele.
      if (reasoning && /reasoning/i.test(m)) reasoning = false;
      else if (mode === 'schema' && /json_schema|response_format|schema/i.test(m)) mode = 'json';
      else if (mode !== 'text' && /json_validate_failed|response_format|json/i.test(m) && invalidJson++ < 1) {
        mode = 'text'; // resposta que não passou na validação do Groq: só esta vez, sem guardar
        continue;
      } else throw e;
      learned.set(o.model, { mode, reasoning });
      continue;
    }
    // Qwen às vezes devolve o raciocínio entre <think>…</think> mesmo com reasoning_format.
    const clean = out.replace(/<think>[\s\S]*?<\/think>/g, '');
    const json = clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1);
    try {
      return JSON.parse(json);
    } catch {
      if (invalidJson++ < 1) {
        o.onProgress?.({ stage: 'Refazendo a resposta da IA' });
        continue;
      }
      throw new GroqError('resposta incompleta', 0);
    }
  }
}
