// Tela "Identidade visual": edita os perfis de marca com prévia ao vivo do vídeo.
import { Player, Thumbnail, type PlayerRef } from '@remotion/player';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AbsoluteFill } from 'remotion';
import { BrandProvider, palette, type Brand } from '../../src/brand';
import { contrast } from '../../src/color';
import { FONTS, fontStack } from '../../src/font-list';
import { Logo } from '../../src/components/Logo';
import { totalFrames } from '../../src/parse-duration';
import { theme } from '../../src/theme';
import type { VideoSpec } from '../../src/types';
import { FrentyVideo } from '../../src/Video';
import type { BrandList, VideoMeta } from '../api';
import { Icon } from './icons';
import type { ToastFn } from './main';

const api = window.frenty;
const T = theme.video.transitionFrames;

const SAMPLE = (b: Brand) => `---
formato: horizontal
efeitos_sonoros: false
---

# Sua marca em **movimento**

Assim ficam os vídeos com esta identidade.

## Tudo em um só lugar

- **Vendas** no balcão e online
- **Estoque** sempre atualizado
- **Relatórios** prontos em segundos

## Resultados

- **+30%** em vendas
- **8h** economizadas por semana
- **98%** de clientes satisfeitos

## Vendas por mês

- Jan: 120
- Fev: 150
- Mar: 185
- Abr: 240

## Pergunte ao assistente

> **Você:** Quanto vou vender no sábado?
> **${b.assistente}:** Cerca de **18% a mais**.

## Comece hoje

Teste grátis por 14 dias. [Fale com a gente](https://${b.site || 'seusite.com.br'})
`;

const SCENE_LABELS: Record<string, string> = {
  intro: 'Abertura',
  bullets: 'Lista',
  stats: 'Números',
  chart: 'Gráfico',
  quote: 'Conversa',
  cta: 'Chamada',
  outro: 'Final',
};

const COLOR_FIELDS: { key: keyof Brand['cores']; label: string; hint: string }[] = [
  { key: 'primaria', label: 'Primária', hint: 'Fundos escuros, títulos e o logo desenhado' },
  { key: 'destaque', label: 'Destaque', hint: 'Botões, palavras em negrito e o maior número' },
  { key: 'secundaria', label: 'Secundária', hint: 'Gráficos, ícones e detalhes' },
  { key: 'fundo', label: 'Fundo claro', hint: 'Fundo das cenas de lista, números e gráfico' },
  { key: 'texto', label: 'Texto', hint: 'Textos sobre o fundo claro' },
];

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

// Logo renderizado pelo próprio vídeo (mesmo resultado do MP4), sobre fundo claro ou escuro.
const LogoStill: React.FC<{ brand: Brand; dark: boolean }> = ({ brand, dark }) => {
  const C = palette(brand);
  return (
    <BrandProvider brand={brand}>
      <AbsoluteFill style={{ background: dark ? C.primaryDeep : C.background, display: 'grid', placeItems: 'center' }}>
        <Logo size={120} variant={dark ? 'dark' : 'light'} animate={false} />
      </AbsoluteFill>
    </BrandProvider>
  );
};

const LogoTile: React.FC<{ brand: Brand; dark: boolean; onPick: () => void; onClear?: () => void; label: string }> = ({
  brand,
  dark,
  onPick,
  onClear,
  label,
}) => {
  const inputProps = useMemo(() => ({ brand, dark }), [brand, dark]);
  return (
    <div className="logo-tile">
      <span className="logo-tile-label">{label}</span>
      <div className="logo-tile-view">
        <Thumbnail
          component={LogoStill}
          inputProps={inputProps}
          compositionWidth={1000}
          compositionHeight={360}
          frameToDisplay={0}
          durationInFrames={1}
          fps={30}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="logo-tile-actions">
        <button className="btn btn-secondary btn-sm" onClick={onPick}>
          <Icon name="upload" size={14} /> {onClear ? 'Trocar arquivo' : 'Enviar arquivo'}
        </button>
        {onClear && (
          <button className="btn btn-ghost btn-sm" onClick={onClear}>
            Remover
          </button>
        )}
      </div>
    </div>
  );
};

const ColorField: React.FC<{ label: string; hint: string; value: string; onChange: (v: string) => void; auto?: { on: boolean; toggle: (on: boolean) => void; derived: string } }> = ({
  label,
  hint,
  value,
  onChange,
  auto,
}) => {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const shown = auto?.on ? auto.derived : value;
  return (
    <div className={`color-field ${auto?.on ? 'is-auto' : ''}`}>
      <label className="swatch" style={{ background: shown }}>
        <input type="color" value={shown.length === 4 ? `#${[...shown.slice(1)].map((c) => c + c).join('')}` : shown} disabled={auto?.on} onChange={(e) => onChange(e.target.value.toUpperCase())} />
      </label>
      <div className="color-text">
        <strong>{label}</strong>
        <span className="muted small">{hint}</span>
      </div>
      {auto && (
        <label className="check small">
          <input type="checkbox" checked={auto.on} onChange={(e) => auto.toggle(e.target.checked)} /> Automático
        </label>
      )}
      <input
        className="hex"
        value={auto?.on ? auto.derived : text}
        disabled={auto?.on}
        spellCheck={false}
        onChange={(e) => {
          const v = e.target.value.trim();
          setText(v);
          const hex = v.startsWith('#') ? v : `#${v}`;
          if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) onChange(hex.toUpperCase());
        }}
        onBlur={() => setText(value)}
      />
    </div>
  );
};

const Toggle: React.FC<{ label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, hint, checked, onChange }) => (
  <label className="toggle-row">
    <span>
      <strong>{label}</strong>
      <span className="muted small">{hint}</span>
    </span>
    <input type="checkbox" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

const ratio = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}:1`;

function contrastNotes(b: Brand) {
  const C = palette(b);
  const notes: { tone: 'attention' | 'info'; text: string }[] = [];
  const text = contrast(b.cores.texto, b.cores.fundo);
  if (text < 4.5) notes.push({ tone: 'attention', text: `O texto fica difícil de ler sobre o fundo claro (contraste ${ratio(text)}; o ideal é 4,5:1 ou mais).` });
  const deep = contrast('#FFFFFF', C.primaryDeep);
  if (deep < 4.5) notes.push({ tone: 'attention', text: `O fundo escuro está claro demais para texto branco (contraste ${ratio(deep)}). Escureça a primária ou defina o fundo escuro.` });
  if (contrast(b.cores.primaria, b.cores.fundo) < 3)
    notes.push({ tone: 'info', text: 'A primária é clara para textos sobre o fundo claro. Nessas cenas ela aparece um pouco mais escura, para continuar legível.' });
  if (contrast(b.cores.destaque, C.primaryDeep) < 2)
    notes.push({ tone: 'attention', text: 'O destaque quase some sobre o fundo escuro. Use uma cor mais viva ou mais clara para o destaque.' });
  return notes;
}

export const BrandStudio: React.FC<{ list: BrandList; videos: VideoMeta[]; onChanged: () => Promise<void>; toast: ToastFn }> = ({
  list,
  videos,
  onChanged,
  toast,
}) => {
  const [selected, setSelected] = useState(list.defaultId);
  const saved = list.brands.find((b) => b.id === selected) ?? list.brands[0];
  const [draft, setDraft] = useState<Brand>(saved);
  const [spec, setSpec] = useState<VideoSpec | null>(null);
  const [menu, setMenu] = useState(false);
  const [box, boxSize] = useBoxSize();
  const player = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);

  // Troca de marca na lista (ou marca recarregada depois de salvar).
  useEffect(() => setDraft(saved), [saved]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const select = (id: string) => {
    if (id === selected) return;
    if (dirty && !window.confirm('Descartar as alterações desta marca?')) return;
    setSelected(id);
  };

  // O roteiro de amostra usa o nome do assistente e o site da marca.
  useEffect(() => {
    const t = setTimeout(async () => {
      const r = await api.parse(SAMPLE(draft));
      if (r.ok) setSpec(r.spec);
    }, 150);
    return () => clearTimeout(t);
  }, [draft.assistente, draft.site]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    p.addEventListener('frameupdate', onFrame);
    return () => p.removeEventListener('frameupdate', onFrame);
  }, [spec != null]);

  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setIn = <K extends 'logo' | 'cores' | 'fontes' | 'estilo'>(k: K, patch: Partial<Brand[K]>) =>
    setDraft((d) => ({ ...d, [k]: { ...d[k], ...patch } }));

  const inputProps = useMemo(() => (spec ? { ...spec, brand: draft } : null), [spec, draft]);
  const duration = spec ? totalFrames(spec.scenes) : 1;
  const starts = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const s of spec?.scenes ?? []) out.push(acc), (acc += s.frames - T);
    return out;
  }, [spec]);
  const scale = Math.min(boxSize.w / 1920, boxSize.h / 1080) || 0;
  const active = starts.reduce((a, s, i) => (frame >= s ? i : a), 0);
  const seek = (i: number) => {
    if (!spec || !player.current) return;
    player.current.pause();
    player.current.seekTo(starts[i] + Math.min(spec.scenes[i].frames - T - 1, spec.scenes[i].type === 'intro' || spec.scenes[i].type === 'outro' ? 80 : 60));
  };

  const pickLogo = async (key: 'arquivoClaro' | 'arquivoEscuro') => {
    const r = await api.pickLogo();
    if (!r) return;
    if ('error' in r) toast({ tone: 'negative', text: r.error });
    else setIn('logo', { [key]: r.dataUrl });
  };

  const save = async () => {
    const before = videos.filter((v) => v.brandId === draft.id && v.status === 'pronto').length;
    await api.saveBrand(draft);
    await onChanged();
    toast({
      tone: 'positive',
      text: before ? `Marca salva. Gere de novo ${before === 1 ? 'o vídeo que usa' : `os ${before} vídeos que usam`} esta marca para aplicar.` : 'Marca salva.',
    });
  };

  const create = async (fromId?: string) => {
    if (dirty && !window.confirm('Descartar as alterações desta marca?')) return;
    const b = await api.createBrand(fromId);
    await onChanged();
    setSelected(b.id);
  };

  const menuItems = [
    { label: 'Usar como padrão', icon: 'star', disabled: list.defaultId === saved.id, run: async () => (await api.setDefaultBrand(saved.id), onChanged()) },
    { label: 'Duplicar marca', icon: 'copy', run: () => create(saved.id) },
    { label: 'Exportar perfil .json', icon: 'download', run: async () => (await api.exportBrand(saved.id)) && toast({ tone: 'positive', text: 'Perfil exportado.' }) },
    saved.id === 'frenty'
      ? { label: 'Restaurar padrão Frenty', icon: 'refresh', run: async () => (await api.resetBrand()) && (await onChanged()) }
      : {
          label: 'Excluir marca',
          icon: 'trash',
          danger: true,
          run: async () => {
            if (await api.removeBrand(saved.id)) {
              setSelected(list.defaultId === saved.id ? 'frenty' : list.defaultId);
              await onChanged();
            }
          },
        },
  ];

  const C = palette(draft);
  const notes = contrastNotes(draft);
  const hasFile = !!(draft.logo.arquivoClaro || draft.logo.arquivoEscuro);
  const usedBy = videos.filter((v) => v.brandId === saved.id).length;

  return (
    <div className="brand-page">
      <header className="brand-head">
        <div>
          <h1>Identidade visual</h1>
          <p className="muted">Cores, fontes, logo e estilo usados nos vídeos. Cada vídeo usa a marca padrão ou a que você escolher no editor.</p>
        </div>
        <div className="head-actions">
          <button
            className="btn btn-secondary"
            onClick={async () => {
              const b = await api.importBrand();
              if (b) {
                await onChanged();
                setSelected(b.id);
                toast({ tone: 'positive', text: `Marca "${b.nome}" importada.` });
              }
            }}
          >
            <Icon name="upload" size={16} /> Importar perfil
          </button>
          <button className="btn btn-primary" onClick={() => create()}>
            <Icon name="plus" size={16} /> Nova marca
          </button>
        </div>
      </header>

      <div className="brand-tabs" role="tablist">
        {list.brands.map((b) => {
          const p = palette(b.id === selected ? draft : b);
          return (
            <button key={b.id} role="tab" aria-selected={b.id === selected} className={`brand-tab ${b.id === selected ? 'active' : ''}`} onClick={() => select(b.id)}>
              <span className="brand-dots">
                {[p.primary, p.accent, p.secondary].map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
              <span className="brand-tab-name">{b.id === selected ? draft.nome || 'Sem nome' : b.nome}</span>
              {b.id === list.defaultId && <span className="badge badge-positive">Padrão</span>}
            </button>
          );
        })}
      </div>

      <div className="brand-body">
        <div className="brand-form">
          <section className="form-card">
            <h2>Empresa</h2>
            <div className="form-grid">
              <label className="field">
                <span>Nome da empresa</span>
                <input value={draft.nome} onChange={(e) => set('nome', e.target.value)} />
              </label>
              <label className="field">
                <span>Nome do assistente</span>
                <input value={draft.assistente} onChange={(e) => set('assistente', e.target.value)} placeholder="Ex.: IAF" />
              </label>
              <label className="field span-2">
                <span>Slogan</span>
                <input value={draft.slogan} onChange={(e) => set('slogan', e.target.value)} placeholder="Aparece na cena final" />
              </label>
              <label className="field span-2">
                <span>Site</span>
                <input value={draft.site} onChange={(e) => set('site', e.target.value)} placeholder="Ex.: suaempresa.com.br" />
              </label>
            </div>
          </section>

          <section className="form-card">
            <h2>Logo</h2>
            <div className="logo-tiles">
              <LogoTile
                brand={draft}
                dark={false}
                label="Em fundo claro"
                onPick={() => pickLogo('arquivoClaro')}
                onClear={draft.logo.arquivoClaro ? () => setIn('logo', { arquivoClaro: undefined }) : undefined}
              />
              <LogoTile
                brand={draft}
                dark
                label="Em fundo escuro"
                onPick={() => pickLogo('arquivoEscuro')}
                onClear={draft.logo.arquivoEscuro ? () => setIn('logo', { arquivoEscuro: undefined }) : undefined}
              />
            </div>
            <p className="muted small">
              SVG ou PNG com fundo transparente, até 2 MB. Sem a versão para fundo escuro, o vídeo usa a clara em branco.
            </p>
            {hasFile ? (
              <p className="note">O arquivo enviado substitui o logo desenhado.</p>
            ) : (
              <div className="form-grid">
                <label className="field">
                  <span>Texto do logo desenhado</span>
                  <input value={draft.logo.texto} onChange={(e) => setIn('logo', { texto: e.target.value })} />
                </label>
                <label className="check span-2">
                  <input type="checkbox" checked={draft.logo.simbolo} onChange={(e) => setIn('logo', { simbolo: e.target.checked })} /> Mostrar o símbolo (anel com três
                  pontos)
                </label>
              </div>
            )}
          </section>

          <section className="form-card">
            <h2>Cores</h2>
            <div className="palette-strip">
              {[C.primaryDeep, C.primary, C.secondary, C.accent, C.background, C.text].map((c, i) => (
                <i key={i} style={{ background: c }} />
              ))}
            </div>
            <div className="color-list">
              {COLOR_FIELDS.map((f) => (
                <ColorField key={f.key} label={f.label} hint={f.hint} value={draft.cores[f.key] ?? ''} onChange={(v) => setIn('cores', { [f.key]: v })} />
              ))}
              <ColorField
                label="Fundo escuro"
                hint="Abertura, conversa, chamada e final"
                value={draft.cores.fundoEscuro ?? C.primaryDeep}
                onChange={(v) => setIn('cores', { fundoEscuro: v })}
                auto={{
                  on: !draft.cores.fundoEscuro,
                  derived: C.primaryDeep,
                  toggle: (on) => setIn('cores', { fundoEscuro: on ? undefined : C.primaryDeep }),
                }}
              />
            </div>
            {notes.map((n) => (
              <p key={n.text} className={`note note-${n.tone}`}>
                <Icon name="alert" size={15} /> {n.text}
              </p>
            ))}
          </section>

          <section className="form-card">
            <h2>Tipografia</h2>
            {(
              [
                ['titulos', 'Títulos', 'Vendas que crescem'],
                ['texto', 'Textos', 'Estoque sempre atualizado, sem planilha.'],
                ['logo', 'Logo desenhado', draft.logo.texto || draft.nome],
              ] as const
            ).map(([k, label, sample]) => (
              <div key={k} className="font-row">
                <label className="field">
                  <span>{label}</span>
                  <select value={draft.fontes[k]} onChange={(e) => setIn('fontes', { [k]: e.target.value as Brand['fontes']['titulos'] })}>
                    {FONTS.map((f) => (
                      <option key={f.name}>{f.name}</option>
                    ))}
                  </select>
                </label>
                <div
                  className="font-sample"
                  style={{ fontFamily: fontStack(draft.fontes[k]), fontWeight: k === 'texto' ? 500 : 800, color: k === 'texto' ? C.text : C.primaryOnLight }}
                >
                  {sample}
                </div>
              </div>
            ))}
          </section>

          <section className="form-card">
            <h2>Estilo</h2>
            <div className="field">
              <span>Cantos</span>
              <div className="segmented">
                {(
                  [
                    ['reto', 'Retos'],
                    ['suave', 'Suaves'],
                    ['redondo', 'Redondos'],
                  ] as const
                ).map(([v, l]) => (
                  <button key={v} className={draft.estilo.arredondamento === v ? 'active' : ''} onClick={() => setIn('estilo', { arredondamento: v })}>
                    <span className={`corner corner-${v}`} /> {l}
                  </button>
                ))}
              </div>
            </div>
            <Toggle label="Logo no canto" hint="Marca d'água nas cenas claras" checked={draft.estilo.marcaDagua} onChange={(v) => setIn('estilo', { marcaDagua: v })} />
            <Toggle label="Barra de progresso" hint="Linha colorida no rodapé do vídeo" checked={draft.estilo.barraProgresso} onChange={(v) => setIn('estilo', { barraProgresso: v })} />
            <Toggle label="Partículas no fundo" hint="Pontos de luz subindo nas cenas escuras" checked={draft.estilo.particulas} onChange={(v) => setIn('estilo', { particulas: v })} />
          </section>
        </div>

        <aside className="brand-preview">
          <div className="preview-box" ref={box}>
            {inputProps && scale > 0 && (
              <div className="player-frame" style={{ width: 1920 * scale, height: 1080 * scale }}>
                <Player
                  ref={player}
                  component={FrentyVideo}
                  inputProps={inputProps}
                  durationInFrames={Math.max(1, duration)}
                  compositionWidth={1920}
                  compositionHeight={1080}
                  fps={theme.video.fps}
                  initialFrame={80}
                  controls
                  loop
                  clickToPlay
                  acknowledgeRemotionLicense
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
          </div>
          {spec && (
            <div className="scene-chips">
              {spec.scenes.map((s, i) => (
                <button key={i} className={`chip-btn ${i === active ? 'active' : ''}`} onClick={() => seek(i)}>
                  {SCENE_LABELS[s.type] ?? s.type}
                </button>
              ))}
            </div>
          )}
          <div className="grow" />
          <div className={`save-bar ${dirty ? 'dirty' : ''}`}>
            <span className="muted small">
              {dirty ? 'Alterações não salvas' : usedBy ? `Salva · usada em ${usedBy} ${usedBy === 1 ? 'vídeo' : 'vídeos'}` : 'Salva'}
            </span>
            <div className="menu-wrap">
              <button
                className="icon-btn"
                aria-label="Mais ações da marca"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu(!menu);
                }}
              >
                <Icon name="more" />
              </button>
              {menu && (
                <div className="menu menu-up">
                  {menuItems.map((i) => (
                    <button key={i.label} className={'danger' in i && i.danger ? 'danger' : ''} disabled={'disabled' in i && i.disabled} onClick={i.run}>
                      <Icon name={i.icon} size={16} /> {i.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-ghost" disabled={!dirty} onClick={() => setDraft(saved)}>
              Descartar
            </button>
            <button className="btn btn-primary" disabled={!dirty} onClick={save}>
              <Icon name="save" size={16} /> Salvar marca
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
