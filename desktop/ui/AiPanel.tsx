// Painel da montagem com IA no editor, e a janela para informar a chave da API do Claude.
import React, { useEffect, useState } from 'react';
import type { AiInfo, AiProvider, AiSettings } from '../api';
import { Icon } from './icons';

const api = window.frenty;

const IDEAS = ['Mais dinâmico', 'Mais curto', 'Destaque os números', 'Tom mais institucional'];

export const AiPanel: React.FC<{
  ai?: AiInfo;
  stage?: string; // montagem em andamento
  sceneLabel?: string; // cena selecionada na linha do tempo
  sceneIndex?: number; // índice da cena no plano (-1 = encerramento automático)
  onCompose: (instruction?: string) => void;
  onRedoScene: (instruction?: string) => void;
  onCancel: () => void;
  onDisable: () => void;
  onSettings: () => void;
  settingsRev?: number; // muda quando a escolha da IA é salva
}> = ({ ai, stage, sceneLabel, sceneIndex, onCompose, onRedoScene, onCancel, onDisable, onSettings, settingsRev }) => {
  const [ask, setAsk] = useState('');
  const [settings, setSettings] = useState<AiSettings | null>(null);
  useEffect(() => void api.aiSettings().then(setSettings), [settingsRev]);
  const using = settings && (
    <button className="link ai-using" onClick={onSettings} title="Trocar a IA que monta os vídeos">
      IA: {providerLabel(settings)}
    </button>
  );
  if (stage)
    return (
      <div className="ai-panel ai-running">
        <div className="ai-spinner" />
        <div className="ai-text">
          <strong>A IA está montando o vídeo</strong>
          <span className="muted">{stage}…</span>
        </div>
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    );

  if (!ai?.enabled || !ai.hasPlan)
    return (
      <div className="ai-panel">
        <div className="ai-badge">
          <Icon name="sparkle" size={16} />
        </div>
        <div className="ai-text">
          <strong>{ai?.enabled ? 'Este roteiro pede montagem com IA' : 'Montagem automática pelo roteiro'}</strong>
          <span className="muted">
            {ai?.enabled
              ? 'Enquanto a IA não monta, a prévia segue as regras do roteiro.'
              : 'A IA pode escolher os componentes, os textos de tela, os ícones e o ritmo de cada cena conforme o conteúdo.'}
          </span>
        </div>
        <div className="ai-actions">
          <button className="btn btn-ai" onClick={() => onCompose()}>
            <Icon name="sparkle" size={16} /> Montar com IA
          </button>
          {using}
        </div>
      </div>
    );

  const redo = sceneIndex != null && sceneIndex >= 0;
  const send = (fn: (i?: string) => void) => {
    fn(ask.trim() || undefined);
    setAsk('');
  };
  return (
    <div className="ai-panel ai-on">
      <div className="ai-row">
        <div className="ai-badge on">
          <Icon name="sparkle" size={16} />
        </div>
        <div className="ai-text">
          <strong title={ai.model ? `Montado por ${ai.model}` : undefined}>Montado pela IA</strong>
          <span className="muted" title={ai.summary}>
            {ai.summary}
          </span>
        </div>
        {using}
        <button className="link" onClick={onDisable} title="Volta a montar as cenas pelas regras do roteiro. O plano da IA fica guardado.">
          Usar montagem automática
        </button>
      </div>
      {(ai.stale || ai.formatChanged) && (
        <div className="notice">
          <Icon name="alert" size={16} />
          {ai.stale ? 'O roteiro mudou depois da montagem.' : 'O formato mudou depois da montagem.'} A prévia ainda mostra a versão anterior.
          <button className="link" onClick={() => onCompose()}>
            Atualizar com IA
          </button>
        </div>
      )}
      <div className="ai-ask">
        <input
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(onCompose)}
          placeholder="Peça um ajuste: mais dinâmico, use um gráfico, menos texto…"
        />
        <button className="btn btn-secondary" onClick={() => send(onCompose)} title="Remonta o vídeo inteiro com o seu pedido">
          <Icon name="refresh" size={15} /> Remontar
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => send(onRedoScene)}
          disabled={!redo}
          title={redo ? `Refaz só a cena "${sceneLabel}"` : 'Selecione uma cena na linha do tempo'}
        >
          <Icon name="sparkle" size={15} /> Refazer cena
        </button>
      </div>
      {!ask && (
        <div className="ai-ideas">
          {IDEAS.map((i) => (
            <button key={i} className="chip-btn" onClick={() => setAsk(i)}>
              {i}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PROVIDERS: Record<AiProvider, { name: string; about: string; keyUrl: string; placeholder: string; env: string }> = {
  claude: {
    name: 'Claude',
    about: 'Claude, da Anthropic. Faz as melhores escolhas de cena, mas cada montagem é mais lenta e mais cara.',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-…',
    env: 'ANTHROPIC_API_KEY',
  },
  groq: {
    name: 'Groq',
    about: 'Modelos abertos, como o Qwen, rodando no Groq. É muito rápido e barato.',
    keyUrl: 'https://console.groq.com/keys',
    placeholder: 'gsk_…',
    env: 'GROQ_API_KEY',
  },
};

export const providerLabel = (s: AiSettings) => (s.provider === 'groq' ? `Groq · ${s.groqModel}` : 'Claude');

// Escolha da IA que monta os vídeos (Claude ou Groq) e as chaves de cada uma.
export const AiSettingsModal: React.FC<{ onClose: (saved: boolean) => void }> = ({ onClose }) => {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [provider, setProvider] = useState<AiProvider>('claude');
  const [key, setKey] = useState('');
  const [model, setModel] = useState('');
  useEffect(
    () =>
      void api.aiSettings().then((s) => {
        setSettings(s);
        setProvider(s.provider);
        setModel(s.groqModel);
      }),
    [],
  );
  if (!settings) return null;
  const info = PROVIDERS[provider];
  const status = settings.keys[provider];
  const ready = status.configured || !!key.trim();
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    await api.setAiSettings({
      provider,
      ...(provider === 'groq' ? { groqModel: model.trim() || settings.defaultGroqModel } : {}),
      ...(key.trim() ? { [provider === 'groq' ? 'groqKey' : 'claudeKey']: key.trim() } : {}),
    });
    onClose(true);
  };
  return (
    <div className="modal-backdrop" onMouseDown={() => onClose(false)}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="modal-head">
          <h2>IA da montagem</h2>
          <button type="button" className="icon-btn" onClick={() => onClose(false)} aria-label="Fechar">
            <Icon name="x" />
          </button>
        </div>
        <div className="field">
          <span>Qual IA monta os vídeos</span>
          <div className="segmented provider-pick">
            {(Object.keys(PROVIDERS) as AiProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                className={provider === p ? 'active' : ''}
                onClick={() => {
                  setProvider(p);
                  setKey('');
                }}
              >
                <Icon name="sparkle" size={14} /> {PROVIDERS[p].name}
                {settings.keys[p].configured && <span className="key-dot" title="Chave configurada" />}
              </button>
            ))}
          </div>
        </div>
        <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
          {info.about} A chave fica guardada só neste computador, criptografada, e o uso é cobrado na conta dona da chave.
        </p>
        {provider === 'groq' && (
          <label className="field">
            <span>Modelo</span>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={settings.defaultGroqModel} spellCheck={false} />
          </label>
        )}
        {status.configured && (
          <div className="notice notice-ok">
            <Icon name="check" size={16} /> Chave do {info.name} {status.source === 'ambiente' ? `do sistema (${info.env})` : 'salva'} terminada em {status.hint}
          </div>
        )}
        <label className="field">
          <span>{status.configured ? `Trocar chave do ${info.name}` : `Chave da API do ${info.name}`}</span>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder={info.placeholder} spellCheck={false} />
        </label>
        <button type="button" className="link" style={{ alignSelf: 'flex-start' }} onClick={() => api.openExternal(info.keyUrl)}>
          Criar uma chave no console do {info.name}
        </button>
        <div className="modal-actions">
          {status.source === 'app' && (
            <button
              type="button"
              className="btn btn-ghost danger-text"
              onClick={async () => setSettings(await api.setAiSettings({ [provider === 'groq' ? 'groqKey' : 'claudeKey']: null }))}
            >
              Remover chave
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button type="button" className="btn btn-ghost" onClick={() => onClose(false)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={!ready}>
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};
