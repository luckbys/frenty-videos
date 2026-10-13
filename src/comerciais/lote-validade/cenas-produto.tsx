// Cenas 4 a 6 do comercial de Lote e Validade, em ilustração: a etiqueta de lote saindo da impressora
// e sendo lida na caixa, o calendário que dispara o alerta antes do vencimento e a rota do lote até a
// auditoria. Sem telas de sistema.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, Sfx, tween } from '../../motion/core';
import { Brilho, Carimbo, Etiqueta, Glifo, IL, Palco, Pessoa, Pop, Sombra, Txt, useMola } from '../modulo-os/ilustracoes';
import { M } from '../modulo-os/tokens';
import { Bg, Fade, Push, Title } from '../modulo-os/ui';
import { Armazem, CalendarioParede, Caixa, Caminhao, Carrinho, CodigoBarras, Cofrinho, EtiquetaLote, Fabrica, Impressora, Leitor, Loja, Lupa, posDia, Prateleira, Sino, TagValidade } from './ilustracoes';

type P = [number, number];

const bez = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t;
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
};

// Selo verde redondo com check (desenhado conforme `draw`).
const Check: React.FC<{ r: number; draw?: number }> = ({ r, draw = 1 }) => (
  <g filter="url(#il-drop-sm)">
    <circle r={r} fill={IL.verde} stroke={IL.branco} strokeWidth={r * 0.18} />
    <Glifo nome="check" s={r * 1.2} cor={IL.branco} sw={3.6} draw={draw} />
  </g>
);

// Mini etiqueta para as caixas da estante (código de barras e um ponto de status).
const MiniEtiqueta: React.FC<{ cor: string }> = ({ cor }) => (
  <g>
    <rect x={-46} y={-28} width={92} height={56} rx={8} fill={IL.branco} />
    <rect x={-46} y={-28} width={92} height={14} rx={7} fill={IL.ciano} />
    <g transform="translate(-6 8)">
      <CodigoBarras w={58} h={22} />
    </g>
    <circle cx={32} cy={8} r={8} fill={cor} />
  </g>
);

/* ---------- Cena 4: cadastro com lote e validade ---------- */

const IMPRESSORA: P = [250, 990];
const CAIXA: P = [640, 1430];
const ALVO_ETIQUETA: P = [640, 1300];
const LEITOR_Y = 1100;
const VOO = 60; // a etiqueta sai da impressora e voa até a caixa
const LEITURA = 112; // o leitor passa o laser no código
const ESTANTE = 150; // a câmera abre e a caixa vai para a estante
const SLOTS = [255, 445, 635, 825];
const TABUAS = [1180, 1500];
const STATUS = [
  [IL.verde, IL.verde, null, IL.ambar],
  [IL.verde, IL.ambar, IL.verde, IL.verde],
];

export const CenaCadastro: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  const sai = tween(frame, 22, 34, EASE.out);
  const voo = tween(frame, VOO, 24, EASE.inOut);
  const cola = mola(VOO + 24, { damping: 9, stiffness: 220, mass: 0.6 });
  const laser = tween(frame, LEITURA, 20, EASE.inOut);
  const sairCena = tween(frame, ESTANTE, 16, EASE.in);
  const guarda = tween(frame, ESTANTE + 4, 26, EASE.inOut);
  // Etiqueta: saindo da impressora, voando e colada na caixa.
  const [ix, iy] = [IMPRESSORA[0], IMPRESSORA[1] - 108 - sai * 172];
  const [ex, ey] = voo > 0 ? bez([ix, iy], [ix + 120, iy - 240], [ALVO_ETIQUETA[0] - 60, ALVO_ETIQUETA[1] - 300], ALVO_ETIQUETA, voo) : [ix, iy];
  const eRot = voo * -5;
  const eEsc = voo < 1 ? 1 - 0.1 * voo : 0.9 * (1.08 - 0.08 * Math.min(1, cola));
  // A caixa encolhe para a vaga da estante.
  const cx = CAIXA[0] + (SLOTS[2] - CAIXA[0]) * guarda;
  const cy = CAIXA[1] + (TABUAS[0] - CAIXA[1]) * guarda;
  const ce = 1 - (1 - 150 / 360) * guarda;
  const leitorX = 1180 - 330 * mola(LEITURA - 18, { damping: 15, stiffness: 120, mass: 0.8 }) + sairCena * 480;
  return (
    <Bg focus={[55, 58]}>
      <Palco>
        {/* estante (aparece quando a câmera abre) */}
        {frame >= ESTANTE + 10 && (
          <g>
            <Pop at={ESTANTE + 10} x={540} y={1220} rot={0} dy={80} from={0.86}>
              <g transform="translate(-540 -1220)">
                <Prateleira x0={110} x1={970} topo={880} tabuas={TABUAS} />
              </g>
            </Pop>
            {STATUS.map((linha, li) =>
              linha.map((cor, si) =>
                cor ? (
                  <Pop key={`${li}${si}`} at={ESTANTE + 18 + li * 8 + si * 4} x={SLOTS[si]} y={TABUAS[li]} rot={si % 2 ? 8 : -8} dy={-60}>
                    <Caixa w={150} h={118}>
                      <MiniEtiqueta cor={cor} />
                    </Caixa>
                  </Pop>
                ) : null,
              ),
            )}
          </g>
        )}
        {/* etiqueta ainda dentro da impressora fica atrás do corpo */}
        {voo === 0 && sai > 0 && (
          <g transform={`translate(${ix} ${iy})`} opacity={1 - sairCena}>
            <EtiquetaLote w={230} lote="L-2048" validade="18/11/2026" />
          </g>
        )}
        <g transform={`translate(${IMPRESSORA[0] - sairCena * 500} ${IMPRESSORA[1]})`}>
          <Pop at={6} rot={-10}>
            <Impressora w={300} luz={frame > 20 && frame < 58 ? (Math.sin(frame / 2) > 0 ? 1 : 0) : 0.3} />
          </Pop>
        </g>
        {/* caixa */}
        <g transform={`translate(${cx} ${cy}) scale(${ce})`}>
          <Pop at={12} rot={6} dy={120}>
            <Caixa w={360} h={280}>
              {voo >= 1 && (
                <g transform={`rotate(-5) scale(${eEsc})`}>
                  <EtiquetaLote w={230} lote="L-2048" validade="18/11/2026" />
                </g>
              )}
            </Caixa>
          </Pop>
          {frame >= LEITURA + 12 && (
            <g transform="translate(118 -250)">
              <Pop at={LEITURA + 12} rot={0}>
                <Check r={34} draw={tween(frame, LEITURA + 16, 12)} />
              </Pop>
            </g>
          )}
        </g>
        {/* etiqueta em voo */}
        {voo > 0 && voo < 1 && (
          <g transform={`translate(${ex} ${ey}) rotate(${eRot + Math.sin(voo * Math.PI) * 14}) scale(${eEsc})`}>
            <EtiquetaLote w={230} lote="L-2048" validade="18/11/2026" />
          </g>
        )}
        {/* leitor e laser */}
        {frame >= LEITURA - 18 && sairCena < 1 && (
          <g>
            {laser > 0 && laser < 1 && (
              <g>
                <path d={`M${leitorX - 6} ${LEITOR_Y - 10} L${ALVO_ETIQUETA[0] - 96} ${ALVO_ETIQUETA[1] + 10} L${ALVO_ETIQUETA[0] + 96} ${ALVO_ETIQUETA[1] + 10} Z`} fill={IL.vermelho} opacity={0.22} />
                <line x1={ALVO_ETIQUETA[0] - 98} y1={ALVO_ETIQUETA[1] + 10 + (laser - 0.5) * 60} x2={ALVO_ETIQUETA[0] + 98} y2={ALVO_ETIQUETA[1] + 10 + (laser - 0.5) * 60} stroke={IL.vermelho} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
              </g>
            )}
            <g transform={`translate(${leitorX} ${LEITOR_Y}) rotate(-28)`}>
              <Leitor s={150} />
            </g>
          </g>
        )}
        {frame >= VOO + 26 && (
          <g opacity={1 - tween(frame, ESTANTE, 10)}>
            <Pop at={VOO + 26} x={540} y={1650} rot={0} dy={30}>
              <Etiqueta texto="Validade em cada lote" glifo="calendario" cor={IL.ciano} s={40} w={540} />
            </Pop>
          </g>
        )}
        {frame >= ESTANTE + 46 && (
          <Pop at={ESTANTE + 46} x={540} y={1690} rot={0} dy={30}>
            <Etiqueta texto="Estoque sempre à vista" glifo="olho" cor={IL.ciano} s={42} w={590} />
          </Pop>
        )}
        <Brilho x={860} y={LEITOR_Y + 10} r={20} at={LEITURA + 20} />
      </Palco>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Cadastre lote\ne **validade**'} at={2} size={112} />
      </div>
      <Sfx name="whoosh" at={2} volume={0.25} />
      <Sfx name="pop" at={8} volume={0.28} />
      <Sfx name="pop" at={14} volume={0.28} />
      {new Array(8).fill(0).map((_, i) => (
        <Sfx key={i} name="type" at={24 + i * 4} volume={0.14} />
      ))}
      <Sfx name="whoosh" at={VOO} volume={0.26} />
      <Sfx name="click" at={VOO + 24} volume={0.5} />
      <Sfx name="pop" at={VOO + 28} volume={0.2} />
      <Sfx name="tick" at={LEITURA + 6} volume={0.5} />
      <Sfx name="chime" at={LEITURA + 14} volume={0.3} />
      <Sfx name="whoosh" at={ESTANTE} volume={0.26} />
      {new Array(7).fill(0).map((_, i) => (
        <Sfx key={`e${i}`} name="pop" at={ESTANTE + 20 + i * 5} volume={0.14} />
      ))}
      <Sfx name="pop" at={ESTANTE + 48} volume={0.25} />
    </Bg>
  );
};

/* ---------- Cena 5: alertas antes do vencimento ---------- */

const CAL: P = [360, 930];
const CAL_W = 520;
const ALVO = 18;
const SINO: P = [850, 700];
const ALERTA = 70; // o sino toca
const ACAO = 104; // a promoção tira o produto antes de vencer
const PRODUTO: P = [220, 1560];
const CARRINHO: P = [560, 1590];
const COFRE: P = [880, 1540];

const Oferta: React.FC<{ r: number }> = ({ r }) => {
  const pts = new Array(24).fill(0).map((_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r * 0.82 : r;
    return `${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  });
  return (
    <g filter="url(#il-drop-sm)">
      <path d={`M${pts.join(' L')} Z`} fill={IL.ciano} />
      <Txt y={r * 0.16} s={r * 0.42} anchor="middle" ls={1}>
        OFERTA
      </Txt>
    </g>
  );
};

export const CenaAlertas: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  const hoje = 4 + Math.floor(tween(frame, 22, 44, EASE.inOut) * 7);
  const pulso = frame > ALERTA ? ((frame - ALERTA) % 30) / 30 : 0;
  const balanco = frame > ALERTA ? Math.sin((frame - ALERTA) / 2.6) * 22 * Math.max(0, 1 - (frame - ALERTA) / 50) : 0;
  const [dx, dy] = posDia(CAL_W, ALVO);
  const diaAlvo: P = [CAL[0] + dx, CAL[1] + dy];
  const ligacao = tween(frame, ALERTA - 6, 16, EASE.out);
  // Produto: ganha a oferta, pula para o carrinho e o dinheiro vai para o cofrinho.
  const pula = tween(frame, ACAO + 22, 22, EASE.inOut);
  const [px, py] = pula > 0 ? bez(PRODUTO, [PRODUTO[0] + 80, PRODUTO[1] - 260], [CARRINHO[0] - 40, CARRINHO[1] - 340], [CARRINHO[0] + 8, CARRINHO[1] - 92], pula) : PRODUTO;
  const rola = tween(frame, ACAO + 46, 24, EASE.inOut);
  const carX = CARRINHO[0] + rola * 40;
  return (
    <Bg focus={[45, 50]}>
      <Push from={1} to={1.03} origin="50% 50%">
        <Palco>
          <Pop at={6} x={CAL[0]} y={CAL[1]} rot={-6} dy={60}>
            <CalendarioParede w={CAL_W} hoje={hoje} alvo={ALVO} pulso={pulso} />
          </Pop>
          {/* ligação pontilhada do dia do vencimento até o sino */}
          {new Array(16).fill(0).map((_, k) => {
            const t = (k + 0.5) / 16;
            if (t > ligacao) return null;
            const [lx, ly] = bez([diaAlvo[0] + 30, diaAlvo[1] - 24], [diaAlvo[0] + 220, diaAlvo[1] - 170], [SINO[0] - 220, SINO[1] + 270], [SINO[0] - 70, SINO[1] + 150], t);
            return <circle key={k} cx={lx} cy={ly} r={6} fill={IL.ambar} opacity={0.9} />;
          })}
          <Pop at={ALERTA - 10} x={SINO[0]} y={SINO[1]} rot={0} dy={-60}>
            {frame > ALERTA &&
              [0, 1, 2].map((k) => {
                const t = ((frame - ALERTA + k * 10) % 30) / 30;
                return (
                  <g key={k} opacity={(1 - t) * 0.9}>
                    <path d={`M${-120 - t * 40} ${60 - t * 10} A 150 150 0 0 1 ${-104 - t * 30} ${-20 - t * 30}`} stroke={IL.ambar} strokeWidth={8} fill="none" strokeLinecap="round" />
                    <path d={`M${120 + t * 40} ${60 - t * 10} A 150 150 0 0 0 ${104 + t * 30} ${-20 - t * 30}`} stroke={IL.ambar} strokeWidth={8} fill="none" strokeLinecap="round" />
                  </g>
                );
              })}
            <Sino r={96} ang={balanco} />
          </Pop>
          {frame >= ALERTA + 12 && (
            <Pop at={ALERTA + 12} x={835} y={1010} rot={0} dy={30}>
              <Etiqueta texto="Vence em 7 dias" glifo="sino" cor={IL.ambar} s={38} w={420} />
            </Pop>
          )}
          {/* ação antes da perda */}
          {frame >= ACAO - 8 && (
            <g>
              <Pop at={ACAO + 6} x={CARRINHO[0]} y={CARRINHO[1]} rot={0} dy={60}>
                <g transform={`translate(${carX - CARRINHO[0]} 0)`}>
                  <Carrinho s={150} roda={rola * 400} />
                </g>
              </Pop>
              <Pop at={ACAO + 14} x={COFRE[0]} y={COFRE[1]} rot={10}>
                <Cofrinho s={118} />
              </Pop>
              <g transform={`translate(${px + (pula >= 1 ? rola * 40 : 0)} ${py}) rotate(${pula * 12})`}>
                <Pop at={ACAO - 8} rot={-8} dy={80}>
                  <g transform={`scale(${1 - pula * 0.32})`}>
                    <Caixa w={150} h={118}>
                      <MiniEtiqueta cor={IL.ambar} />
                    </Caixa>
                    {frame >= ACAO + 4 && (
                      <g transform="translate(66 -150)">
                        <Pop at={ACAO + 4} rot={-30}>
                          <Oferta r={74} />
                        </Pop>
                      </g>
                    )}
                  </g>
                </Pop>
              </g>
              {[0, 1, 2].map((k) => {
                const t = tween(frame, ACAO + 58 + k * 7, 22, EASE.inOut);
                if (t <= 0 || t >= 1) return null;
                const [mx, my] = bez([carX + 40, CARRINHO[1] - 150], [carX + 120, CARRINHO[1] - 330], [COFRE[0] - 60, COFRE[1] - 260], [COFRE[0], COFRE[1] - 70], t);
                return (
                  <g key={k} transform={`translate(${mx} ${my}) rotate(${t * 180})`}>
                    <circle r={22} fill="url(#il-ouro)" stroke={IL.ouroEscuro} strokeWidth={3} />
                    <Txt y={7} s={18} cor={IL.ouroEscuro} anchor="middle">
                      R$
                    </Txt>
                  </g>
                );
              })}
            </g>
          )}
          {frame >= ACAO + 84 && (
            <Pop at={ACAO + 84} x={540} y={1730} rot={0} dy={30}>
              <Etiqueta texto="Perda evitada" s={40} w={400} />
            </Pop>
          )}
          <Brilho x={980} y={600} r={20} at={ALERTA + 6} />
          <Brilho x={950} y={1430} r={18} at={ACAO + 80} />
        </Palco>
      </Push>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Alertas **antes**\nde vencer'} at={2} size={120} />
      </div>
      <Sfx name="whoosh" at={2} volume={0.25} />
      <Sfx name="pop" at={8} volume={0.28} />
      {new Array(7).fill(0).map((_, i) => (
        <Sfx key={i} name="tick" at={26 + i * 6} volume={0.22} />
      ))}
      <Sfx name="chime" at={ALERTA} volume={0.42} />
      <Sfx name="chime" at={ALERTA + 10} volume={0.3} />
      <Sfx name="pop" at={ALERTA + 14} volume={0.28} />
      <Sfx name="pop" at={ACAO - 6} volume={0.25} />
      <Sfx name="click" at={ACAO + 6} volume={0.4} />
      <Sfx name="pop" at={ACAO + 8} volume={0.2} />
      <Sfx name="pop" at={ACAO + 16} volume={0.2} />
      <Sfx name="whoosh" at={ACAO + 22} volume={0.24} />
      <Sfx name="pop" at={ACAO + 44} volume={0.25} />
      {[0, 1, 2].map((k) => (
        <Sfx key={`m${k}`} name="tick" at={ACAO + 78 + k * 7} volume={0.3} />
      ))}
      <Sfx name="chime" at={ACAO + 86} volume={0.28} />
    </Bg>
  );
};

/* ---------- Cena 6: rastreio do lote e auditoria ---------- */

const BEAT = 112;
const PREDIOS = [
  { x: 190, nome: 'Origem', data: '10/out', el: <Fabrica w={290} /> },
  { x: 540, nome: 'Armazém', data: '12/out', el: <Armazem w={290} /> },
  { x: 890, nome: 'Loja', data: '15/out', el: <Loja w={280} /> },
];
const CHAO = 1150;
const CHAO_AUDITORIA = 740; // onde o chão da rota fica depois de encolher
// Paradas do caminhão: [quadro de chegada, x]
const PARADAS: [number, number][] = [
  [34, 190],
  [70, 540],
  [100, 890],
];

const caminhaoX = (f: number) => {
  if (f < 22) return -200;
  if (f < 34) return -200 + 390 * tween(f, 22, 12, EASE.out);
  if (f < 44) return 190;
  if (f < 70) return 190 + 350 * tween(f, 44, 26, EASE.inOut);
  if (f < 78) return 540;
  return 540 + 350 * tween(f, 78, 22, EASE.inOut);
};

const HISTORICO = [
  { nome: 'Origem', data: '10/10' },
  { nome: 'Armazém', data: '12/10' },
  { nome: 'Loja', data: '15/10' },
];

const FolhaAuditoria: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    <Sombra y={290} rx={210} ry={26} />
    <rect x={-200} y={-262} width={400} height={540} rx={34} fill={IL.roxoEscuro} />
    <rect x={-176} y={-232} width={352} height={486} rx={20} fill="url(#il-papel)" />
    <rect x={-70} y={-282} width={140} height={46} rx={16} fill="url(#il-metal)" />
    <rect x={-176} y={-232} width={352} height={70} rx={20} fill={IL.ciano} />
    <rect x={-176} y={-182} width={352} height={20} fill={IL.ciano} />
    <Txt x={-150} y={-184} s={34} cor={IL.branco} ls={1}>
      LOTE L-2048
    </Txt>
    {HISTORICO.map((h, i) => {
      const y = -112 + i * 92;
      const ok = tween(frame, BEAT + 40 + i * 12, 10);
      return (
        <g key={h.nome}>
          <circle cx={-136} cy={y} r={14} fill={[IL.roxo, IL.azul, IL.ciano][i]} />
          {i < 2 && <line x1={-136} y1={y + 16} x2={-136} y2={y + 76} stroke={IL.lavandaEscura} strokeWidth={5} strokeDasharray="3 9" strokeLinecap="round" />}
          <Txt x={-108} y={y + 2} s={30} cor={IL.tinta}>
            {h.nome}
          </Txt>
          <Txt x={-108} y={y + 34} s={24} w={800} cor={IL.tintaSuave}>
            {h.data}
          </Txt>
          <g transform={`translate(128 ${y + 6}) scale(${ok})`}>
            <circle r={22} fill={IL.verde} />
            <Glifo nome="check" s={26} cor={IL.branco} sw={3.6} />
          </g>
        </g>
      );
    })}
  </g>
);

export const CenaRastreio: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  const g = tween(frame, BEAT, 22, EASE.inOut);
  const tx = caminhaoX(frame);
  const andando = frame > 22 && frame < 100 && !(frame >= 34 && frame < 44) && !(frame >= 70 && frame < 78);
  const estrada = tween(frame, 8, 22, EASE.inOut);
  const carimbo = mola(BEAT + 84, { damping: 11, stiffness: 240, mass: 0.6 });
  return (
    <Bg focus={[50, 50]}>
      <Palco>
        {/* rota do lote (encolhe e sobe no segundo momento) */}
        <g transform={`translate(0 ${-g * (CHAO - CHAO_AUDITORIA)}) translate(540 ${CHAO}) scale(${1 - 0.3 * g}) translate(-540 ${-CHAO})`}>
          <rect x={40} y={CHAO + 4} width={1000 * estrada} height={56} rx={28} fill="#2A1366" />
          <line x1={70} y1={CHAO + 32} x2={70 + 940 * estrada} y2={CHAO + 32} stroke="rgba(255,255,255,0.5)" strokeWidth={5} strokeDasharray="22 22" strokeDashoffset={-frame * 2} />
          {PREDIOS.map((pr, i) => (
            <g key={pr.nome}>
              <Pop at={6 + i * 6} x={pr.x} y={CHAO} rot={i % 2 ? 6 : -6} dy={60}>
                {pr.el}
              </Pop>
              <g opacity={tween(frame, 16 + i * 6, 12)}>
                <Txt x={pr.x} y={CHAO + 120} s={34} anchor="middle">
                  {pr.nome}
                </Txt>
              </g>
              {frame >= PARADAS[i][0] && (
                <g>
                  <Pop at={PARADAS[i][0]} x={pr.x} y={CHAO - 270} rot={0} dy={-40}>
                    <circle r={30} fill={IL.verde} stroke={IL.branco} strokeWidth={6} filter="url(#il-drop-sm)" />
                    <Glifo nome="check" s={32} cor={IL.branco} sw={3.8} draw={tween(frame, PARADAS[i][0] + 3, 10)} />
                  </Pop>
                  <g opacity={tween(frame, PARADAS[i][0] + 4, 10)}>
                    <Txt x={pr.x} y={CHAO + 162} s={28} w={800} cor={IL.cianoClaro} anchor="middle">
                      {pr.data}
                    </Txt>
                  </g>
                </g>
              )}
            </g>
          ))}
          {tx > -190 && (
            <g transform={`translate(${tx} ${CHAO + 40})`}>
              <g transform={`translate(0 ${andando ? Math.sin(frame * 1.3) * 1.5 : 0})`}>
                <Caminhao s={190} roda={tx * 3} />
              </g>
              <g transform={`translate(-30 -190)`}>
                <TagValidade texto="L-2048" cor={IL.ciano} s={22} />
              </g>
              <g transform={`translate(70 -260) rotate(-10)`} opacity={tween(frame, 26, 10) * (1 - g)}>
                <Lupa r={40} />
              </g>
            </g>
          )}
        </g>
        {frame >= 40 && (
          <g opacity={1 - tween(frame, BEAT - 10, 10)}>
            <Pop at={40} x={540} y={1510} rot={0} dy={30}>
              <Etiqueta texto="Da origem até a loja" glifo="bandeira" cor={IL.ciano} s={40} w={520} />
            </Pop>
          </g>
        )}
        {/* auditoria */}
        {frame >= BEAT && (
          <g>
            <Pop at={BEAT + 14} x={270} y={1220} rot={-8} dy={60}>
              <circle r={128} fill="rgba(255,255,255,0.08)" />
              <Pessoa r={112} pele="#E8B48E" cabelo="#4A2C1C" roupa={IL.branco} fundo="#D9F4FF" estilo="coque" acessorio="oculos" id="fiscal-lote" />
            </Pop>
            <g opacity={tween(frame, BEAT + 26, 12)}>
              <Txt x={270} y={1410} s={34} anchor="middle">
                Fiscalização
              </Txt>
            </g>
            <Pop at={BEAT + 24} x={720} y={1200} rot={8} dy={100}>
              <FolhaAuditoria frame={frame} />
              {carimbo > 0.01 && (
                <g transform={`translate(10 196) rotate(-10) scale(${2.2 - 1.2 * Math.min(1, carimbo)})`} opacity={Math.min(1, carimbo * 1.6)}>
                  <Carimbo texto="CONFORME" cor={IL.verde} w={300} h={84} />
                </g>
              )}
            </Pop>
            <Brilho x={930} y={960} r={22} at={BEAT + 90} />
            <Brilho x={520} y={1080} r={16} at={BEAT + 96} />
          </g>
        )}
      </Palco>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Rastreio de\n**cada lote**'} at={2} size={112} out={BEAT - 8} />
      </div>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Pronto para a\n**auditoria**'} at={BEAT + 4} size={112} />
      </div>
      <Fade at={BEAT + 96} style={{ position: 'absolute', left: M, right: M, top: 1610, textAlign: 'center', fontSize: 40, fontWeight: 800 }}>
        Histórico completo de <span style={{ color: IL.cianoClaro }}>movimentações</span>
      </Fade>
      <Sfx name="whoosh" at={2} volume={0.25} />
      {PREDIOS.map((_, i) => (
        <Sfx key={i} name="pop" at={8 + i * 6} volume={0.24} />
      ))}
      <Sfx name="whoosh" at={22} volume={0.22} />
      {PARADAS.map(([f], i) => (
        <Sfx key={`p${i}`} name="tick" at={f + 2} volume={0.35} />
      ))}
      <Sfx name="pop" at={42} volume={0.22} />
      <Sfx name="whoosh" at={BEAT} volume={0.3} />
      <Sfx name="pop" at={BEAT + 16} volume={0.26} />
      <Sfx name="pop" at={BEAT + 26} volume={0.26} />
      {HISTORICO.map((_, i) => (
        <Sfx key={`h${i}`} name="tick" at={BEAT + 40 + i * 12} volume={0.3} />
      ))}
      <Sfx name="click" at={BEAT + 86} volume={0.6} />
      <Sfx name="chime" at={BEAT + 90} volume={0.3} />
    </Bg>
  );
};

