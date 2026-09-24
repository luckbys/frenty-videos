import { Player, type PlayerRef } from '@remotion/player';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { totalFrames } from '../../src/parse-duration';
import { formats, theme } from '../../src/theme';
import type { VideoSpec } from '../../src/types';
import { FrentyVideo } from '../../src/Video';
import type { AiInfo, BrandList, VideoMeta } from '../api';
import { sectionAt, setFormat, setFrontmatter } from '../markdown';
import { slugify } from '../slug';
import { AiKeyModal, AiPanel } from './AiPanel';
import { Icon } from './icons';
import type { ToastFn } from './main';
import { FORMAT_SHORT, SCENE, sceneTitle, seconds, SNIPPETS, STATUS } from './util';

const api = window.frenty;
const T = theme.video.transitionFrames;
const MAX = theme.video.maxSeconds;

const useBoxSize = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
};

const Menu: React.FC<{ items: { label: string; icon: string; run: () => void; danger?: boolean; disabled?: boolean }[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);
  return (
    <div className="menu-wrap">
      <button
        className="icon-btn"
        aria-label="Mais ações"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <Icon name="more" />
      </button>
      {open && (
        <div className="menu">
          {items.map((i) => (
            <button key={i.label} className={i.danger ? 'danger' : ''} disabled={i.disabled} onClick={i.run}>
              <Icon name={i.icon} size={16} /> {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Editor: React.FC<{
  meta: VideoMeta;
  brands: BrandList;
  render?: { stage: string; progress: number };
  aiStage?: string; // montagem com IA em andamento
  autoAi?: boolean; // montar com IA assim que abrir (vídeo criado a partir de uma descrição)
  onBack: () => void;
  onChanged: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  toast: ToastFn;
}> = ({ meta, brands, render, aiStage, autoAi, onBack, onChanged, onDuplicate, onRemove, toast }) => {
  const [md, setMd] = useState<string | null>(null);
  const [name, setName] = useState(meta.name);
  const [spec, setSpec] = useState<VideoSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<AiInfo | undefined>();
  const [planRev, setPlanRev] = useState(0);
  const [keyModal, setKeyModal] = useState<null | (() => void)>(null);
  const [saveState, setSaveState] = useState<'salvo' | 'pendente' | 'salvando'>('salvo');
  const [tab, setTab] = useState<'previa' | 'video'>(meta.videoUrl && meta.status === 'pronto' ? 'video' : 'previa');
  const [frame, setFrame] = useState(45);
  const player = useRef<PlayerRef>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const latest = useRef<string | null>(null);
  const [box, boxSize] = useBoxSize();

  useEffect(() => {
    void api.get(meta.id).then((r) => {
      setMd(r.markdown);
      latest.current = r.markdown;
    });
  }, [meta.id]);

  // Troca para a aba do vídeo quando uma nova geração termina.
  const lastRendered = useRef(meta.renderedAt);
  useEffect(() => {
    if (meta.renderedAt && meta.renderedAt !== lastRendered.current) setTab('video');
    lastRendered.current = meta.renderedAt;
  }, [meta.renderedAt]);

  // Pré-visualização: re-interpreta o roteiro a cada pausa na digitação.
  useEffect(() => {
    if (md == null) return;
    const t = setTimeout(async () => {
      const r = await api.parse(md, meta.id);
      setAi(r.ai);
      if (r.ok) {
        setSpec(r.spec);
        setError(null);
      } else setError(r.error);
    }, 250);
    return () => clearTimeout(t);
  }, [md, planRev, meta.id]);

  const flush = useCallback(async () => {
    clearTimeout(saveTimer.current);
    if (latest.current == null) return;
    setSaveState('salvando');
    await api.save(meta.id, latest.current);
    setSaveState('salvo');
    onChanged();
  }, [meta.id, onChanged]);

  const update = (next: string) => {
    setMd(next);
    latest.current = next;
    setSaveState('pendente');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 700);
  };

  useEffect(() => () => void flush(), [flush]);

  // Montagem com IA do vídeo inteiro (scene indefinida) ou de uma cena do plano.
  const runAi = useCallback(
    async (opts: { instruction?: string; scene?: number } = {}) => {
      if (!(await api.aiKeyStatus()).configured) {
        setKeyModal(() => () => void runAi(opts));
        return;
      }
      await flush();
      const r = await api.aiCompose(meta.id, opts);
      if (r.ok) {
        // O processo principal liga "montagem: ia" no arquivo; aqui o texto aberto recebe o mesmo.
        const cur = latest.current ?? r.markdown;
        const next = setFrontmatter(cur, 'montagem', 'ia');
        if (next !== cur) {
          setMd(next);
          latest.current = next;
          await api.save(meta.id, next);
        }
        setPlanRev((n) => n + 1);
        onChanged();
        setTab('previa');
        toast({ tone: 'positive', text: opts.scene != null ? 'Cena refeita pela IA.' : 'Montagem com IA pronta. Confira a prévia.' });
      } else if (r.needsKey) setKeyModal(() => () => void runAi(opts));
      else if (!/cancelada/i.test(r.error)) toast({ tone: 'negative', text: r.error });
    },
    [flush, meta.id, onChanged, toast],
  );

  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoAi && md != null && !autoStarted.current) {
      autoStarted.current = true;
      void runAi();
    }
  }, [autoAi, md, runAi]);

  const generate = useCallback(async () => {
    if (error || render || aiStage) return;
    await flush();
    await api.render(meta.id);
  }, [error, render, aiStage, flush, meta.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void flush();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void generate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flush, generate]);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    p.addEventListener('frameupdate', onFrame);
    return () => p.removeEventListener('frameupdate', onFrame);
  }, [spec != null, tab]);

  const starts = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const s of spec?.scenes ?? []) {
      out.push(acc);
      acc += s.frames - T;
    }
    return out;
  }, [spec]);

  // Marca do roteiro ("marca:" no topo) ou a padrão; a prévia usa exatamente o que vai para o MP4.
  const defaultBrand = brands.brands.find((b) => b.id === brands.defaultId) ?? brands.brands[0];
  const brandRef = spec?.marca ? slugify(spec.marca) : undefined;
  const pinned = brandRef ? brands.brands.find((b) => b.id === brandRef) : undefined;
  const brand = pinned ?? defaultBrand;
  const inputProps = useMemo(() => (spec ? { ...spec, brand } : null), [spec, brand]);
  const changeBrand = (id: string) => md != null && update(setFrontmatter(md, 'marca', id || undefined));

  const duration = spec ? totalFrames(spec.scenes) : 1;
  const secs = duration / theme.video.fps;
  const dims = formats[spec?.format ?? 'horizontal'];
  const scale = Math.min(boxSize.w / dims.width, boxSize.h / dims.height) || 0;
  const activeScene = starts.reduce((a, s, i) => (frame >= s ? i : a), 0);

  const seekToScene = (i: number, play = false) => {
    if (!spec || !player.current) return;
    const s = spec.scenes[i];
    player.current.seekTo(play ? starts[i] : starts[i] + Math.min(s.frames - T - 1, 40));
    if (play) player.current.play();
  };

  const followCursor = () => {
    const el = textarea.current;
    if (!el || !spec || md == null || player.current?.isPlaying()) return;
    const hasIntro = spec.scenes[0]?.type === 'intro';
    const n = sectionAt(md, el.selectionStart);
    const idx = Math.min(spec.scenes.length - 1, Math.max(0, n === 0 ? 0 : n - (hasIntro ? 0 : 1)));
    if (idx !== activeScene) seekToScene(idx);
  };

  const insert = (snippet: string) => {
    const el = textarea.current;
    if (!el || md == null) return;
    // Insere no fim da cena atual (antes do próximo "## "), para não quebrar o texto.
    const from = el.selectionEnd;
    const next = md.slice(from).search(/^##\s/m);
    const at = next === -1 ? md.length : from + next;
    const before = md.slice(0, at).replace(/\s*$/, '');
    const after = md.slice(at);
    const text = `${before}\n\n${snippet}${after ? '\n' + after : ''}`;
    update(text);
    requestAnimationFrame(() => {
      const pos = before.length + 2;
      el.focus();
      el.setSelectionRange(pos + 3, pos + snippet.indexOf('\n'));
    });
  };

  const changeFormat = (f: string) => md != null && update(setFormat(md, f));

  const rename = async () => {
    if (name.trim() && name !== meta.name) {
      await api.rename(meta.id, name);
      onChanged();
    } else setName(meta.name);
  };

  const status = STATUS[meta.status];
  const over = secs > MAX * 0.9;

  return (
    <div className="editor">
      <header className="editor-head">
        <button className="icon-btn" onClick={onBack} aria-label="Voltar para a biblioteca">
          <Icon name="back" />
        </button>
        <div className="title-block">
          <input
            className="title-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={rename}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
          <span className="save-state">
            {saveState === 'salvo' ? 'Salvo' : saveState === 'salvando' ? 'Salvando…' : 'Alterações não salvas'}
            {' · '}
            <span className={`status-text tone-${render ? 'info' : status.tone}`}>{render ? 'Gerando vídeo' : status.label}</span>
          </span>
        </div>

        <div className="segmented small">
          {Object.keys(formats).map((f) => (
            <button key={f} className={spec?.format === f ? 'active' : ''} onClick={() => changeFormat(f)} title={f}>
              <span className={`format-shape mini shape-${f}`} />
              {FORMAT_SHORT[f]}
            </button>
          ))}
        </div>

        <div className={`meter ${over ? 'meter-warn' : ''}`} title="Duração do vídeo (limite de 90 segundos)">
          <div className="meter-label">
            <strong>{seconds(spec ? secs : null)}</strong> <span className="muted">de {MAX} s</span>
          </div>
          <div className="meter-bar">
            <div style={{ width: `${Math.min(100, (secs / MAX) * 100)}%` }} />
          </div>
        </div>

        <Menu
          items={[
            { label: 'Duplicar', icon: 'copy', run: onDuplicate },
            { label: 'Exportar roteiro .md', icon: 'download', run: () => void api.exportMarkdown(meta.id) },
            {
              label: 'Salvar cópia do MP4…',
              icon: 'download',
              disabled: !meta.videoUrl,
              run: async () => (await api.exportVideo(meta.id)) && toast({ tone: 'positive', text: 'Cópia do vídeo salva.' }),
            },
            { label: 'Mostrar na pasta', icon: 'folder', run: () => void api.showInFolder(meta.id) },
            { label: 'Chave da API do Claude…', icon: 'sparkle', run: () => setKeyModal(() => () => undefined) },
            { label: 'Excluir vídeo', icon: 'trash', run: onRemove, danger: true },
          ]}
        />

        {render ? (
          <div className="render-pill">
            <div className="render-pill-fill" style={{ width: `${render.progress * 100}%` }} />
            <span>
              {render.stage} {Math.round(render.progress * 100)}%
            </span>
            <button className="icon-btn" onClick={() => api.cancelRender(meta.id)} aria-label="Cancelar geração">
              <Icon name="x" size={16} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={generate} disabled={!!error || !spec || !!aiStage} title="Ctrl+Enter">
            <Icon name="sparkle" size={16} /> {meta.status === 'pronto' ? 'Gerar de novo' : 'Gerar vídeo'}
          </button>
        )}
      </header>

      <div className="editor-body">
        <section className="pane pane-script">
          <div className="pane-head">
            <span className="pane-title">Roteiro</span>
            <div className="snippets">
              <span className="muted small">Inserir cena</span>
              {SNIPPETS.map((s) => (
                <button key={s.label} className="chip" onClick={() => insert(s.md)} style={{ ['--c' as string]: SCENE[s.type].color }}>
                  <Icon name="plus" size={12} /> {s.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            ref={textarea}
            className="script"
            spellCheck
            lang="pt-BR"
            value={md ?? ''}
            onChange={(e) => update(e.target.value)}
            onClick={followCursor}
            onKeyUp={followCursor}
            placeholder="# Título do vídeo"
          />
          {error && (
            <div className="error-bar">
              <Icon name="alert" size={16} /> {error}
            </div>
          )}
        </section>

        <section className="pane pane-preview">
          <div className="tabs">
            <button className={tab === 'previa' ? 'active' : ''} onClick={() => setTab('previa')}>
              Prévia ao vivo
            </button>
            <button className={tab === 'video' ? 'active' : ''} onClick={() => setTab('video')} disabled={!meta.videoUrl}>
              Vídeo gerado
            </button>
            <label className="brand-pick" title="Identidade visual deste vídeo">
              <Icon name="palette" size={15} />
              <select value={pinned ? pinned.id : brandRef ? '?' : ''} onChange={(e) => changeBrand(e.target.value)}>
                <option value="">Marca padrão ({defaultBrand.nome})</option>
                {brandRef && !pinned && <option value="?">Marca "{spec?.marca}" não encontrada</option>}
                {brands.brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {tab === 'previa' ? (
            <>
              <div className="stage" ref={box}>
                {inputProps && scale > 0 && (
                  <div className="player-frame" style={{ width: dims.width * scale, height: dims.height * scale }}>
                    <Player
                      ref={player}
                      component={FrentyVideo}
                      inputProps={inputProps}
                      durationInFrames={Math.max(1, duration)}
                      compositionWidth={dims.width}
                      compositionHeight={dims.height}
                      fps={theme.video.fps}
                      initialFrame={Math.min(45, Math.max(0, duration - 1))}
                      controls
                      clickToPlay
                      acknowledgeRemotionLicense
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                )}
              </div>
              {spec && (
                <div className="timeline">
                  {spec.scenes.map((s, i) => (
                    <button
                      key={i}
                      className={`scene ${i === activeScene ? 'active' : ''}`}
                      style={{ flexGrow: s.frames, ['--c' as string]: SCENE[s.type].color }}
                      onClick={() => seekToScene(i, true)}
                      title={`${SCENE[s.type].label}: ${sceneTitle(s)}`}
                    >
                      <span className="scene-type">{SCENE[s.type].label}</span>
                      <span className="scene-title">{sceneTitle(s)}</span>
                      <span className="scene-time">{seconds(s.frames / theme.video.fps)}</span>
                    </button>
                  ))}
                </div>
              )}
              <AiPanel
                ai={ai}
                stage={aiStage}
                sceneIndex={ai?.origin?.[activeScene]}
                sceneLabel={spec ? sceneTitle(spec.scenes[activeScene] ?? spec.scenes[0]) : undefined}
                onCompose={(instruction) => void runAi({ instruction })}
                onRedoScene={(instruction) => {
                  const i = ai?.origin?.[activeScene];
                  if (i != null && i >= 0) void runAi({ scene: i, instruction });
                }}
                onCancel={() => void api.aiCancel(meta.id)}
                onDisable={() => md != null && update(setFrontmatter(md, 'montagem', undefined))}
              />
            </>
          ) : (
            <div className="rendered">
              {meta.status === 'alterado' && (
                <div className="notice">
                  <Icon name="alert" size={16} /> O roteiro ou a marca mudou depois da última geração. Gere de novo para atualizar o vídeo.
                </div>
              )}
              <div className="stage">
                <video key={meta.videoUrl} src={meta.videoUrl} controls className={`video-${meta.format}`} />
              </div>
              <div className="rendered-actions">
                <button className="btn btn-secondary" onClick={() => api.openVideo(meta.id)}>
                  <Icon name="external" size={16} /> Abrir no player
                </button>
                <button className="btn btn-secondary" onClick={() => api.showInFolder(meta.id)}>
                  <Icon name="folder" size={16} /> Mostrar na pasta
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={async () => (await api.exportVideo(meta.id)) && toast({ tone: 'positive', text: 'Cópia do vídeo salva.' })}
                >
                  <Icon name="download" size={16} /> Salvar cópia
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      {keyModal && (
        <AiKeyModal
          onClose={(saved) => {
            const then = keyModal;
            setKeyModal(null);
            if (saved) then();
          }}
        />
      )}
    </div>
  );
};
