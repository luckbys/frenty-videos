// Aviso de versão nova: janela "Nova versão disponível", progresso do download e o selo na barra lateral.
import React, { useCallback, useEffect, useState } from 'react';
import type { UpdateEvent, UpdateInfo } from '../api';
import type { ToastFn } from './main';
import { Icon } from './icons';

const api = window.frenty;

type Phase = { name: 'idle' } | { name: 'downloading'; progress: number } | { name: 'installing' };

export const useUpdates = (toast: ToastFn) => {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => void api.updateInfo().then(setInfo), []);

  useEffect(
    () =>
      api.onUpdate((e: UpdateEvent) => {
        if (e.kind === 'available') {
          setInfo(e.info);
          // Depois de "Depois", não volta a abrir sozinha para a mesma versão; fica o selo na barra lateral.
          setDismissed((d) => {
            if (d !== e.info.available?.version) setOpen(true);
            return d;
          });
        } else if (e.kind === 'uptodate') {
          setInfo(e.info);
          toast({ tone: 'positive', text: `Você já está na versão mais nova (${e.info.current}).` });
        } else if (e.kind === 'progress') setPhase({ name: 'downloading', progress: e.progress });
        else if (e.kind === 'installing') setPhase({ name: 'installing' });
        else {
          setPhase({ name: 'idle' });
          toast({ tone: 'negative', text: e.message });
        }
      }),
    [toast],
  );

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const i = await api.checkUpdate();
      setInfo(i);
      if (i.available) setOpen(true); // pedido pelo usuário: abre mesmo depois de "Depois"
    } finally {
      setChecking(false);
    }
  }, []);

  const later = () => {
    setOpen(false);
    setDismissed(info?.available?.version ?? null);
  };

  const install = async () => {
    if (!info?.canInstall) {
      await api.installUpdate(); // abre a página de download
      later();
      return;
    }
    setPhase({ name: 'downloading', progress: 0 });
    await api.installUpdate();
  };

  return { info, open, setOpen, phase, check, checking, later, install };
};

export const UpdateModal: React.FC<{ u: ReturnType<typeof useUpdates> }> = ({ u }) => {
  const a = u.info?.available;
  if (!u.open || !a) return null;
  const busy = u.phase.name !== 'idle';
  return (
    <div className="modal-backdrop" onMouseDown={() => !busy && u.later()}>
      <div className="modal update-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Nova versão disponível">
        <div className="modal-head">
          <h2>Nova versão disponível</h2>
          {!busy && (
            <button className="icon-btn" onClick={u.later} aria-label="Fechar">
              <Icon name="x" />
            </button>
          )}
        </div>
        <div className="update-versions">
          <span className="muted">Instalada: {u.info?.current}</span>
          <Icon name="download" size={16} />
          <strong>Nova: {a.version}</strong>
        </div>
        {a.notes.length > 0 && (
          <div className="update-notes">
            <span className="muted small">O que mudou</span>
            <ul>
              {a.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}
        {u.phase.name === 'downloading' && (
          <div className="update-progress">
            <div className="bar">
              <div style={{ width: `${Math.round(u.phase.progress * 100)}%` }} />
            </div>
            <span className="muted small">Baixando a atualização… {Math.round(u.phase.progress * 100)}%</span>
          </div>
        )}
        {u.phase.name === 'installing' && (
          <div className="notice notice-ok">
            <Icon name="check" size={16} /> Instalando. O programa vai fechar e abrir de novo sozinho em alguns segundos.
          </div>
        )}
        {!busy && (
          <p className="muted small" style={{ margin: 0 }}>
            {u.info?.canInstall
              ? 'A atualização é baixada e instalada automaticamente. Seus vídeos, marcas e configurações são mantidos.'
              : 'Vamos abrir a página de download da nova versão.'}
          </p>
        )}
        <div className="modal-actions">
          {!busy && (
            <button className="btn btn-ghost" onClick={u.later}>
              Depois
            </button>
          )}
          <button className="btn btn-primary" onClick={u.install} disabled={busy}>
            <Icon name="download" size={16} /> {busy ? 'Atualizando…' : 'Atualizar agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Rodapé da barra lateral: versão instalada, selo de versão nova e "Procurar atualizações".
export const UpdateFoot: React.FC<{ u: ReturnType<typeof useUpdates> }> = ({ u }) => {
  if (!u.info) return null;
  const a = u.info.available;
  return (
    <div className="update-foot">
      {a && (
        <button className="update-pill" onClick={() => u.setOpen(true)}>
          <Icon name="download" size={14} /> Atualizar para {a.version}
        </button>
      )}
      <div className="update-line">
        <span>Versão {u.info.current}</span>
        {u.info.enabled && (
          <button className="link" onClick={u.check} disabled={u.checking}>
            {u.checking ? 'Procurando…' : 'Procurar atualizações'}
          </button>
        )}
      </div>
    </div>
  );
};
