// Narração por voz pelo ElevenLabs. Chamada direta por HTTP (API REST), só em Node
// (linha de comando ou processo principal do app) — nunca dentro da composição do Remotion.
export const ELEVEN_URL = process.env.ELEVENLABS_BASE_URL?.replace(/\/$/, '') || 'https://api.elevenlabs.io';
// "Rachel", voz padrão do ElevenLabs: multilíngue, funciona bem em português com o modelo abaixo.
export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
export const DEFAULT_MODEL = 'eleven_multilingual_v2';

export class ElevenLabsError extends Error {
  name = 'ElevenLabsError';
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}

// Traduz o erro da API (ou de rede) numa frase que a pessoa entende, como já existe para o Claude e o Groq.
export function friendlyEleven(e: unknown): Error {
  if (e instanceof ElevenLabsError) {
    if (e.status === 401) return new ElevenLabsError('Chave do ElevenLabs inválida ou sem créditos. Confira em elevenlabs.io.');
    if (e.status === 404) return new ElevenLabsError('Essa voz não foi encontrada na sua conta do ElevenLabs.');
    if (e.status === 422) return new ElevenLabsError('O ElevenLabs recusou o texto da narração (muito longo ou com um caractere que não aceita).');
    if (e.status === 429) return new ElevenLabsError('O ElevenLabs está limitando os pedidos agora (limite do plano). Tente de novo em instantes.');
    if (e.status >= 500) return new ElevenLabsError('O ElevenLabs está indisponível agora. Tente de novo em instantes.');
    return e;
  }
  if (e instanceof TypeError) return new ElevenLabsError('Não consegui falar com o ElevenLabs. Confira sua internet.');
  return e instanceof Error ? e : new Error(String(e));
}

export type ElevenVoice = { id: string; name: string; preview?: string };

export async function listVoices(apiKey: string, signal?: AbortSignal): Promise<ElevenVoice[]> {
  const res = await fetch(`${ELEVEN_URL}/v1/voices`, { headers: { 'xi-api-key': apiKey }, signal });
  const text = await res.text();
  if (!res.ok) throw new ElevenLabsError(text.slice(0, 400), res.status);
  const data = JSON.parse(text) as { voices?: { voice_id: string; name: string; preview_url?: string }[] };
  return (data.voices ?? []).map((v) => ({ id: v.voice_id, name: v.name, preview: v.preview_url }));
}

type SynthOpts = {
  apiKey: string;
  voiceId: string;
  model?: string;
  text: string;
  signal?: AbortSignal;
};

// Gera o áudio da fala e devolve também a duração exata (pelos tempos de cada caractere que a API dá
// junto, no endpoint "with-timestamps" — evita precisar de ffprobe só para medir o mp3).
export async function synthesize(o: SynthOpts): Promise<{ buffer: Buffer; seconds: number }> {
  const res = await fetch(`${ELEVEN_URL}/v1/text-to-speech/${encodeURIComponent(o.voiceId)}/with-timestamps`, {
    method: 'POST',
    signal: o.signal,
    headers: { 'content-type': 'application/json', 'xi-api-key': o.apiKey },
    body: JSON.stringify({
      text: o.text,
      model_id: o.model || DEFAULT_MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    let message = raw;
    try {
      const j = JSON.parse(raw);
      message = j?.detail?.message ?? (typeof j?.detail === 'string' ? j.detail : undefined) ?? raw;
    } catch {}
    throw new ElevenLabsError(String(message).slice(0, 400), res.status);
  }
  const data = JSON.parse(raw) as { audio_base64: string; alignment?: { character_end_times_seconds?: number[] }; normalized_alignment?: { character_end_times_seconds?: number[] } };
  const buffer = Buffer.from(data.audio_base64, 'base64');
  const times = data.alignment?.character_end_times_seconds ?? data.normalized_alignment?.character_end_times_seconds ?? [];
  // Sem os tempos (API mudou ou não devolveu), estima pela taxa de bits média do mp3 do ElevenLabs (~128kbps).
  const seconds = times.length ? times[times.length - 1] : buffer.length / 16000;
  return { buffer, seconds };
}
