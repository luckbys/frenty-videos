// Identidade visual como dado: o vídeo recebe um perfil de marca e deriva a paleta completa dele.
import React, { createContext, useContext, useMemo } from 'react';
import { alpha, bestOn, contrast, ensureContrast, isHex, mix } from './color';
import { FONTS, fontStack, type FontName } from './font-list';

export type Brand = {
  id: string;
  nome: string;
  slogan: string;
  site: string;
  assistente: string;
  logo: {
    texto: string; // palavra do logotipo desenhado
    simbolo: boolean; // disco com o F de pontos (logo oficial quando o texto é "frenty")
    arquivoClaro?: string; // data URL (SVG/PNG) para fundos claros
    arquivoEscuro?: string; // data URL para fundos escuros; sem ele, o claro é usado em branco
  };
  cores: {
    primaria: string;
    destaque: string;
    secundaria: string;
    fundo: string;
    texto: string;
    fundoEscuro?: string; // vazio = derivado da primária
  };
  fontes: { titulos: FontName; texto: FontName; logo: FontName };
  estilo: {
    arredondamento: 'reto' | 'suave' | 'redondo';
    marcaDagua: boolean;
    barraProgresso: boolean;
    particulas: boolean;
  };
};

// Padrão: identidade oficial Frenty (ciano da logo oficial, roxo dos posts da marca, tipografia Nunito).
export const FRENTY: Brand = {
  id: 'frenty',
  nome: 'Frenty',
  slogan: 'Gestão completa e inteligente em um único sistema',
  site: 'frenty.com.br',
  assistente: 'IAF',
  logo: { texto: 'frenty', simbolo: true },
  cores: { primaria: '#6F40B2', destaque: '#01C1EB', secundaria: '#4F7FD6', fundo: '#F5F4FA', texto: '#1D1440', fundoEscuro: '#2A1259' },
  fontes: { titulos: 'Nunito', texto: 'Nunito', logo: 'Nunito' },
  estilo: { arredondamento: 'suave', marcaDagua: true, barraProgresso: true, particulas: true },
};

// Perfis com o logotipo "frenty" e símbolo ligado usam o símbolo oficial (disco com o F de pontos).
export const usaLogoFrenty = (b: Brand) => b.logo.simbolo && b.logo.texto.trim().toLowerCase() === 'frenty';

const FONT_NAMES = new Set<string>(FONTS.map((f) => f.name));
const text = (v: unknown, fallback: string) => (typeof v === 'string' ? v.trim() : fallback);
const flag = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const image = (v: unknown) => (typeof v === 'string' && v.startsWith('data:image/') ? v : undefined);

// Completa e valida um perfil parcial (ex.: marca.json escrito à mão) com os valores padrão.
export function normalizeBrand(b: Partial<Brand> | undefined): Brand {
  const base = FRENTY;
  const cores = { ...base.cores, ...(b?.cores ?? {}) };
  for (const k of ['primaria', 'destaque', 'secundaria', 'fundo', 'texto'] as const) if (!isHex(String(cores[k]))) cores[k] = base.cores[k];
  // Fundo escuro só vem do padrão Frenty quando o perfil não traz cores; senão, vazio = derivado da primária.
  const escuro = b?.cores ? b.cores.fundoEscuro : base.cores.fundoEscuro;
  cores.fundoEscuro = escuro && isHex(String(escuro)) ? escuro : undefined;
  const fontes = { ...base.fontes, ...(b?.fontes ?? {}) };
  for (const k of ['titulos', 'texto', 'logo'] as const) if (!FONT_NAMES.has(fontes[k])) fontes[k] = base.fontes[k];
  const estilo = { ...base.estilo, ...(b?.estilo ?? {}) };
  return {
    id: text(b?.id, base.id) || base.id,
    nome: text(b?.nome, base.nome),
    slogan: text(b?.slogan, base.slogan),
    site: text(b?.site, base.site),
    assistente: text(b?.assistente, base.assistente) || base.assistente,
    logo: {
      texto: text(b?.logo?.texto, base.logo.texto),
      simbolo: flag(b?.logo?.simbolo, base.logo.simbolo),
      arquivoClaro: image(b?.logo?.arquivoClaro),
      arquivoEscuro: image(b?.logo?.arquivoEscuro),
    },
    cores,
    fontes,
    estilo: {
      arredondamento: ['reto', 'suave', 'redondo'].includes(estilo.arredondamento) ? estilo.arredondamento : base.estilo.arredondamento,
      marcaDagua: flag(estilo.marcaDagua, true),
      barraProgresso: flag(estilo.barraProgresso, true),
      particulas: flag(estilo.particulas, true),
    },
  };
}

export function palette(b: Brand) {
  const { primaria, destaque, secundaria, fundo, texto } = b.cores;
  const deep = b.cores.fundoEscuro || mix(primaria, '#000000', 0.66);
  return {
    primary: primaria,
    primaryLight: mix(primaria, '#FFFFFF', 0.15),
    primaryDark: mix(primaria, '#000000', 0.25),
    primaryDeep: deep,
    deepest: mix(deep, '#000000', 0.4),
    accent: destaque,
    secondary: secundaria,
    background: fundo,
    tint: mix(fundo, primaria, 0.06),
    surface: mix(fundo, '#FFFFFF', 0.85),
    text: texto,
    textMuted: mix(texto, fundo, 0.35),
    onDark: '#FFFFFF',
    onAccent: bestOn(destaque, [deep, '#FFFFFF', texto]),
    onPrimary: bestOn(primaria, ['#FFFFFF', texto]),
    primaryOnLight: ensureContrast(primaria, fundo, 3),
    accentOnLight: ensureContrast(destaque, fundo, 3),
    accentOnDark: ensureContrast(mix(destaque, '#FFFFFF', 0.3), deep, 4.5),
    bubble: mix(primaria, secundaria, 0.45),
    // Ícone/texto sobre uma cor da marca: branco, a não ser que a cor seja clara demais.
    onColor: (bg: string) => (contrast(bg, '#FFFFFF') >= 1.8 ? '#FFFFFF' : texto),
    alpha,
  };
}

export type Palette = ReturnType<typeof palette>;

const RADIUS = { reto: 0.3, suave: 1, redondo: 1.6 };

function derive(b: Brand) {
  const C = palette(b);
  return {
    brand: b,
    C,
    accents: [C.primary, C.secondary, C.accent] as const,
    fonts: { heading: fontStack(b.fontes.titulos), body: fontStack(b.fontes.texto), logo: fontStack(b.fontes.logo) },
    // Raio proporcional ao estilo escolhido.
    radius: (n: number) => n * RADIUS[b.estilo.arredondamento],
    // Cápsula; no estilo reto vira o raio pequeno informado.
    pill: (reto: number) => (b.estilo.arredondamento === 'reto' ? reto : 999),
  };
}

export type BrandKit = ReturnType<typeof derive>;

const Ctx = createContext<BrandKit>(derive(FRENTY));

export const BrandProvider: React.FC<{ brand?: Partial<Brand>; children: React.ReactNode }> = ({ brand, children }) => {
  const kit = useMemo(() => derive(normalizeBrand(brand)), [brand]);
  return <Ctx.Provider value={kit}>{children}</Ctx.Provider>;
};

export const useBrand = () => useContext(Ctx);
