import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { AiEvent, BrandList, RenderEvent, VideoMeta } from '../api';
import { BrandStudio } from './BrandStudio';
import { Editor } from './Editor';
import { Guide } from './Guide';
import { Icon, LogoMark } from './icons';
import { ago, FORMAT_LABEL, FORMAT_SHORT, seconds, STATUS } from './util';
import { UpdateFoot, UpdateModal, useUpdates } from './Update';
import '@fontsource/plus-jakarta-sans/400.css';
import './styles.css';

export type RenderState = Record<string, { stage: string; progress: number }>;
type Toast = { id: number; tone: 'positive' | 'negative'; text: string; action?: { label: string; run: () => void } };
type View = { name: 'biblioteca' } | { name: 'guia' } | { name: 'marca' } | { name: 'editor'; id: string; autoAi?: boolean };

const api = window.frenty;
// Os efeitos sonoros da prévia vêm de dist-desktop/ui/sfx (o app roda via file://).
window.FRENTY_ASSET_BASE = './';

const Badge: React.FC<{ meta: VideoMeta; render?: { progress: number } }> = ({ meta, render }) => {
  const st = render ? STATUS.gerando : STATUS[meta.status];
  return (
    <span className={`badge badge-${st.tone}`}>
      {st.label}
      {render ? ` ${Math.round(render.progress * 100)}%` : ''}
    </span>
  );
};

const Thumb: React.FC<{ meta: VideoMeta }> = ({ meta }) => (
  <div className="thumb">
    {meta.thumbUrl ? (
      <img src={meta.thumbUrl} alt="" className={`thumb-img thumb-${meta.format}`} />
    ) : (
      <div className="thumb-empty">
        <LogoMark size={44} />
        <span>Ainda sem vídeo</span>
      </div>
    )}
    <span className="thumb-format">{FORMAT_SHORT[meta.format] ?? meta.format}</span>
    {meta.seconds != null && <span className="thumb-duration">{seconds(meta.seconds)}</span>}
  </div>
);

const NewVideoModal: React.FC<{ brands: BrandList; onClose: () => void; onCreate: (m: VideoMeta, ai: boolean) => void }> = ({ brands, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [format, setFormat] = useState('horizontal');
  const [template, setTemplate] = useState<'exemplo' | 'branco' | 'ia'>('ia');
  const [brandId, setBrandId] = useState(brands.defaultId);
  const [brief, setBrief] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(await api.create({ name: name || 'Novo vídeo', format, template, brandId, brief }), template === 'ia' && !!brief.trim());
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>Novo vídeo</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <Icon name="x" />
          </button>
        </div>
        <label className="field">
          <span>Nome do vídeo</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Lançamento do PDV" />
        </label>
        <div className="field">
          <span>Formato</span>
          <div className="format-options">
            {Object.entries(FORMAT_LABEL).map(([k, label]) => (
              <button type="button" key={k} className={`format-option ${format === k ? 'active' : ''}`} onClick={() => setFormat(k)}>
                <span className={`format-shape shape-${k}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
        {brands.brands.length > 1 && (
          <label className="field">
            <span>Marca</span>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              {brands.brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                  {b.id === brands.defaultId ? ' (padrão)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="field">
          <span>Começar com</span>
          <div className="segmented">
            <button type="button" className={template === 'ia' ? 'active' : ''} onClick={() => setTemplate('ia')}>
              <Icon name="sparkle" size={14} /> Descrever para a IA
            </button>
            <button type="button" className={template === 'exemplo' ? 'active' : ''} onClick={() => setTemplate('exemplo')}>
              Roteiro de exemplo
            </button>
            <button type="button" className={template === 'branco' ? 'active' : ''} onClick={() => setTemplate('branco')}>
              Em branco
            </button>
          </div>
        </div>
        {template === 'ia' && (
          <label className="field">
            <span>O que o vídeo deve comunicar?</span>
            <textarea
              className="brief"
              rows={6}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={'Escreva livremente: o assunto, o público, os números, a oferta e o link.\nEx.: Vídeo para Instagram anunciando 30% de desconto no plano anual até 30/11. Mostrar que a IAF prevê a demanda e monta o pedido de reposição. Link: frenty.com.br/black'}
            />
            <span className="muted small">A IA escolhe as cenas, os textos de tela, os ícones e o ritmo. Depois você pode pedir ajustes.</span>
          </label>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {template === 'ia' && brief.trim() ? (
              <>
                <Icon name="sparkle" size={16} /> Criar e montar com IA
              </>
            ) : (
              'Criar e editar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const LibraryView: React.FC<{
  videos: VideoMeta[];
  showBrand: boolean;
  renders: RenderState;
  onOpen: (id: string) => void;
  onNew: () => void;
  onImport: () => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ videos, showBrand, renders, onOpen, onNew, onImport, onDuplicate, onRemove }) => {
  const [q, setQ] = useState('');
  const shown = useMemo(() => videos.filter((v) => v.name.toLowerCase().includes(q.toLowerCase())), [videos, q]);
  const ready = videos.filter((v) => v.status === 'pronto').length;
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Seus vídeos</h1>
          <p className="muted">
            {videos.length} {videos.length === 1 ? 'vídeo' : 'vídeos'} · {ready} {ready === 1 ? 'pronto' : 'prontos'} para publicar
          </p>
        </div>
        <div className="head-actions">
          <div className="search">
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar vídeo" />
          </div>
          <button className="btn btn-secondary" onClick={onImport}>
            <Icon name="upload" size={16} /> Importar .md
          </button>
          <button className="btn btn-primary" onClick={onNew}>
            <Icon name="plus" size={16} /> Novo vídeo
          </button>
        </div>
      </header>

      {videos.length === 0 ? (
        <div className="empty">
          <LogoMark size={64} color="#6C5CE7" />
          <h2>Crie seu primeiro vídeo</h2>
          <p className="muted">Escreva o roteiro em Markdown e a identidade visual cuida do resto.</p>
          <button className="btn btn-primary" onClick={onNew}>
            <Icon name="plus" size={16} /> Novo vídeo
          </button>
        </div>
      ) : (
        <div className="grid">
          {shown.map((v) => (
            <article key={v.id} className="card" onClick={() => onOpen(v.id)}>
              <Thumb meta={v} />
              {renders[v.id] && (
                <div className="card-progress">
                  <div style={{ width: `${renders[v.id].progress * 100}%` }} />
                </div>
              )}
              <div className="card-body">
                <div className="card-title-row">
                  <h3 title={v.name}>{v.name}</h3>
                  {v.ai && (
                    <span className="badge badge-ai" title="Montado com IA">
                      <Icon name="sparkle" size={11} /> IA
                    </span>
                  )}
                  <Badge meta={v} render={renders[v.id]} />
                </div>
                <p className="muted small">
                  Editado {ago(v.updatedAt)}
                  {showBrand && <> · {v.brandName}</>}
                </p>
              </div>
              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn" title="Duplicar" onClick={() => onDuplicate(v.id)}>
                  <Icon name="copy" size={16} />
                </button>
                <button className="icon-btn danger" title="Excluir" onClick={() => onRemove(v.id)}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </article>
          ))}
          <button className="card card-new" onClick={onNew}>
            <Icon name="plus" size={28} />
            <span>Novo vídeo</span>
          </button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [view, setView] = useState<View>({ name: 'biblioteca' });
  const [renders, setRenders] = useState<RenderState>({});
  const [aiRuns, setAiRuns] = useState<Record<string, string>>({});
  const [modal, setModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [libPath, setLibPath] = useState('');
  const [brands, setBrands] = useState<BrandList | null>(null);

  const refresh = useCallback(async () => setVideos(await api.list()), []);
  const refreshBrands = useCallback(async () => {
    setBrands(await api.brands());
    await refresh();
  }, [refresh]);
  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all, { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 6000);
  }, []);

  const updates = useUpdates(toast);

  useEffect(() => {
    void refreshBrands();
    void api.libraryPath().then(setLibPath);
  }, [refreshBrands]);

  useEffect(
    () =>
      api.onRender((e: RenderEvent) => {
        if (e.kind === 'progress') setRenders((r) => ({ ...r, [e.id]: { stage: e.stage, progress: e.progress } }));
        else {
          setRenders(({ [e.id]: _, ...rest }) => rest);
          void refresh();
          if (e.kind === 'done')
            toast({ tone: 'positive', text: `"${e.meta.name}" está pronto.`, action: { label: 'Abrir vídeo', run: () => api.openVideo(e.id) } });
          else toast({ tone: 'negative', text: e.message });
        }
      }),
    [refresh, toast],
  );

  useEffect(
    () =>
      api.onAi((e: AiEvent) => {
        if (e.kind === 'progress') setAiRuns((r) => ({ ...r, [e.id]: e.stage }));
        else {
          setAiRuns(({ [e.id]: _, ...rest }) => rest);
          void refresh();
        }
      }),
    [refresh],
  );

  const current = view.name === 'editor' ? videos.find((v) => v.id === view.id) : undefined;

  const importMd = async () => {
    const created = await api.importMarkdown();
    await refresh();
    if (created.length === 1) setView({ name: 'editor', id: created[0].id });
    else if (created.length > 1) toast({ tone: 'positive', text: `${created.length} roteiros importados.` });
  };
  const duplicate = async (id: string) => {
    const m = await api.duplicate(id);
    await refresh();
    toast({ tone: 'positive', text: `Cópia criada: ${m.name}` });
  };
  const remove = async (id: string) => {
    if (await api.remove(id)) {
      if (view.name === 'editor' && view.id === id) setView({ name: 'biblioteca' });
      await refresh();
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <LogoMark size={30} />
          <span className="brand-name">frenty</span>
          <span className="brand-tag">vídeos</span>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => setModal(true)}>
          <Icon name="plus" size={16} /> Novo vídeo
        </button>
        <nav>
          <button className={`nav-item ${view.name === 'biblioteca' ? 'active' : ''}`} onClick={() => setView({ name: 'biblioteca' })}>
            <Icon name="film" size={18} /> Biblioteca
          </button>
          <button className={`nav-item ${view.name === 'marca' ? 'active' : ''}`} onClick={() => setView({ name: 'marca' })}>
            <Icon name="palette" size={18} /> Identidade visual
          </button>
          <button className={`nav-item ${view.name === 'guia' ? 'active' : ''}`} onClick={() => setView({ name: 'guia' })}>
            <Icon name="book" size={18} /> Como escrever o roteiro
          </button>
        </nav>
        <div className="side-section">Recentes</div>
        <div className="recent">
          {videos.slice(0, 12).map((v) => (
            <button
              key={v.id}
              className={`recent-item ${view.name === 'editor' && view.id === v.id ? 'active' : ''}`}
              onClick={() => setView({ name: 'editor', id: v.id })}
            >
              <span className={`dot dot-${renders[v.id] || aiRuns[v.id] ? 'info' : STATUS[v.status].tone}`} />
              <span className="recent-name">{v.name}</span>
              {renders[v.id] && <span className="recent-pct">{Math.round(renders[v.id].progress * 100)}%</span>}
            </button>
          ))}
        </div>
        <div className="side-foot">
          <button className="lib-path" onClick={() => api.openLibrary()} title={libPath}>
            <Icon name="folder" size={14} />
            <span>{libPath}</span>
          </button>
          <button
            className="link"
            onClick={async () => {
              const p = await api.chooseLibrary();
              if (p) {
                setLibPath(p);
                setView({ name: 'biblioteca' });
                await refreshBrands();
              }
            }}
          >
            Trocar pasta
          </button>
          <UpdateFoot u={updates} />
        </div>
      </aside>

      <main className="main">
        {view.name === 'biblioteca' && (
          <LibraryView
            videos={videos}
            showBrand={(brands?.brands.length ?? 1) > 1}
            renders={renders}
            onOpen={(id) => setView({ name: 'editor', id })}
            onNew={() => setModal(true)}
            onImport={importMd}
            onDuplicate={duplicate}
            onRemove={remove}
          />
        )}
        {view.name === 'guia' && <Guide />}
        {view.name === 'marca' && brands && <BrandStudio list={brands} videos={videos} onChanged={refreshBrands} toast={toast} />}
        {view.name === 'editor' && current && brands && (
          <Editor
            key={current.id}
            meta={current}
            brands={brands}
            render={renders[current.id]}
            aiStage={aiRuns[current.id]}
            autoAi={view.name === 'editor' && view.autoAi}
            onBack={() => setView({ name: 'biblioteca' })}
            onChanged={refresh}
            onDuplicate={() => duplicate(current.id)}
            onRemove={() => remove(current.id)}
            toast={toast}
          />
        )}
      </main>

      {modal && brands && (
        <NewVideoModal
          brands={brands}
          onClose={() => setModal(false)}
          onCreate={async (m, ai) => {
            setModal(false);
            await refresh();
            setView({ name: 'editor', id: m.id, autoAi: ai });
          }}
        />
      )}

      <UpdateModal u={updates} />

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Icon name={t.tone === 'positive' ? 'check' : 'alert'} size={18} />
            <span>{t.text}</span>
            {t.action && (
              <button className="link" onClick={t.action.run}>
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export type ToastFn = (t: Omit<Toast, 'id'>) => void;

createRoot(document.getElementById('root')!).render(<App />);
