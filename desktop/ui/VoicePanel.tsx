// Narração por voz (ElevenLabs): tira de status no editor e a janela onde se configura a chave e a voz.
import React, { useEffect, useState } from 'react';
import type { VoiceOption, VoiceSettings } from '../api';
import { Icon } from './icons';

const api = window.frenty;

// Tira compacta acima da linha do tempo: mostra se a narração está ligada e deixa trocar de voz,
// ou desligá-la só neste roteiro (front matter "narração: false") sem mexer na chave.
export const VoicePanel: React.FC<{
  narracaoOff: boolean; // "narração: false" no topo deste roteiro
  onToggle: () => void;
  onSettings: () => void;
  settingsRev?: number;
}> = ({ narracaoOff, onToggle, onSettings, settingsRev }) => {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  useEffect(() => void api.voiceSettings().then(setSettings), [settingsRev]);
  if (!settings) return null;
  const on = settings.key.configured;
  return (
    <div className="voice-panel">
      <div className={`ai-badge ${on ? 'on' : ''}`}>
        <Icon name="mic" size={15} />
      </div>
      <div className="ai-text">
        <strong>{on ? (narracaoOff ? 'Narração desligada neste vídeo' : 'Narração com voz ligada') : 'Narração com voz'}</strong>
        <span className="muted">
          {on
            ? narracaoOff
              ? 'A chave está pronta, mas este roteiro pediu para não narrar.'
              : 'Todo vídeo gerado ganha a fala do roteiro, na voz do ElevenLabs.'
            : 'Configure a chave do ElevenLabs para os vídeos ganharem narração sozinhos.'}
        </span>
      </div>
      <button className="link ai-using" onClick={onSettings}>
        {on ? 'Trocar voz' : 'Configurar'}
      </button>
      {on && (
        <button className="link" onClick={onToggle}>
          {narracaoOff ? 'Ligar neste vídeo' : 'Desligar neste vídeo'}
        </button>
      )}
    </div>
  );
};

export const VoiceSettingsModal: React.FC<{ onClose: (saved: boolean) => void }> = ({ onClose }) => {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [key, setKey] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [voices, setVoices] = useState<VoiceOption[] | null>(null);
  const [voicesError, setVoicesError] = useState('');
  useEffect(
    () =>
      void api.voiceSettings().then((s) => {
        setSettings(s);
        setVoiceId(s.voiceId);
      }),
    [],
  );
  useEffect(() => {
    if (!settings?.key.configured) return;
    void api.listVoices().then((r) => (r.ok ? setVoices(r.voices) : setVoicesError(r.error)));
  }, [settings?.key.configured]);
  if (!settings) return null;
  const ready = settings.key.configured || !!key.trim();
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    await api.setVoiceSettings({ voiceId: voiceId.trim() || settings.defaultVoiceId, ...(key.trim() ? { apiKey: key.trim() } : {}) });
    onClose(true);
  };
  return (
    <div className="modal-backdrop" onMouseDown={() => onClose(false)}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="modal-head">
          <h2>Narração por voz</h2>
          <button type="button" className="icon-btn" onClick={() => onClose(false)} aria-label="Fechar">
            <Icon name="x" />
          </button>
        </div>
        <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
          O texto de cada cena vira fala pelo <strong>ElevenLabs</strong>. Com a chave configurada, todo vídeo é gerado com narração — sem
          precisar pedir nada. A chave fica guardada só neste computador, criptografada, e o uso é cobrado na conta dona da chave.
        </p>
        {settings.key.configured && (
          <div className="notice notice-ok">
            <Icon name="check" size={16} /> Chave do ElevenLabs {settings.key.source === 'ambiente' ? 'do sistema' : 'salva'} terminada em{' '}
            {settings.key.hint}
          </div>
        )}
        <label className="field">
          <span>{settings.key.configured ? 'Trocar chave do ElevenLabs' : 'Chave da API do ElevenLabs'}</span>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk_…" spellCheck={false} />
        </label>
        <button type="button" className="link" style={{ alignSelf: 'flex-start' }} onClick={() => api.openExternal('https://elevenlabs.io/app/developers')}>
          Criar uma chave no ElevenLabs
        </button>
        {settings.key.configured && (
          <label className="field">
            <span>Voz</span>
            {voices ? (
              <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
                {!voices.some((v) => v.id === voiceId) && <option value={voiceId}>{voiceId}</option>}
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            ) : voicesError ? (
              <input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} placeholder={settings.defaultVoiceId} spellCheck={false} />
            ) : (
              <span className="muted small">Carregando as vozes da sua conta…</span>
            )}
            {voicesError && (
              <span className="muted small">Não consegui listar as vozes ({voicesError}); cole o ID da voz acima.</span>
            )}
          </label>
        )}
        <div className="modal-actions">
          {settings.key.source === 'app' && (
            <button type="button" className="btn btn-ghost danger-text" onClick={async () => setSettings(await api.setVoiceSettings({ apiKey: null }))}>
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
