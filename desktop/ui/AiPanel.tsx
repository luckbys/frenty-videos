// Painel da montagem com IA no editor, e a janela para informar a chave da API do Claude.
import React, { useEffect, useState } from 'react';
import type { AiInfo, AiKeyStatus } from '../api';
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
}> = ({ ai, stage, sceneLabel, sceneIndex, onCompose, onRedoScene, onCancel, onDisable }) => {
  const [ask, setAsk] = useState('');
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
        <button className="btn btn-ai" onClick={() => onCompose()}>
          <Icon name="sparkle" size={16} /> Montar com IA
        </button>
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
          <strong>Montado pela IA</strong>
          <span className="muted" title={ai.summary}>
            {ai.summary}
          </span>
        </div>
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

export const AiKeyModal: React.FC<{ onClose: (saved: boolean) => void }> = ({ onClose }) => {
  const [status, setStatus] = useState<AiKeyStatus | null>(null);
  const [key, setKey] = useState('');
  useEffect(() => void api.aiKeyStatus().then(setStatus), []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    await api.setAiKey(key.trim());
    onClose(true);
  };
  return (
    <div className="modal-backdrop" onMouseDown={() => onClose(false)}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="modal-head">
          <h2>Chave da API do Claude</h2>
          <button type="button" className="icon-btn" onClick={() => onClose(false)} aria-label="Fechar">
            <Icon name="x" />
          </button>
        </div>
        <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
          A montagem com IA usa o Claude, da Anthropic. Cole aqui uma chave da API da sua conta. Ela fica guardada só neste computador,
          criptografada, e o uso é cobrado na conta da Anthropic dona da chave.
        </p>
        {status?.configured && (
          <div className="notice notice-ok">
            <Icon name="check" size={16} /> Chave {status.source === 'ambiente' ? 'do sistema (ANTHROPIC_API_KEY)' : 'salva'} terminada em {status.hint}
          </div>
        )}
        <label className="field">
          <span>{status?.configured ? 'Trocar chave' : 'Chave'}</span>
          <input autoFocus type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" spellCheck={false} />
        </label>
        <button type="button" className="link" style={{ alignSelf: 'flex-start' }} onClick={() => api.openExternal('https://console.anthropic.com/settings/keys')}>
          Criar uma chave no console da Anthropic
        </button>
        <div className="modal-actions">
          {status?.source === 'app' && (
            <button
              type="button"
              className="btn btn-ghost danger-text"
              onClick={async () => {
                setStatus(await api.setAiKey(null));
              }}
            >
              Remover chave
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button type="button" className="btn btn-ghost" onClick={() => onClose(false)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={!key.trim()}>
            Salvar chave
          </button>
        </div>
      </form>
    </div>
  );
};
