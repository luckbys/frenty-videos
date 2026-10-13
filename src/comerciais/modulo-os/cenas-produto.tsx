// Cenas 4 a 6 em ilustração (sem telas de sistema): a O.S. se montando numa prancheta, a rota do serviço
// com prazo e custo acompanhados ao vivo, e a pasta de histórico do cliente com a equipe conectada.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, Sfx, tween } from '../../motion/core';
import {
  AviaoPapel,
  Bolha,
  Brilho,
  Carimbo,
  Cronometro,
  Despertador,
  Etiqueta,
  FolhaCalendario,
  Glifo,
  IL,
  Medidor,
  Palco,
  Pessoa,
  PilhaMoedas,
  Pino,
  Pop,
  Sombra,
  Txt,
  useMola,
  Van,
} from './ilustracoes';
import { M } from './tokens';
import { Bg, Burst, Fade, Push, Title } from './ui';

type P = [number, number];
const bez = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t;
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
};
const bezAng = (a: P, b: P, c: P, d: P, t: number) => {
  const u = 1 - t;
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

/* ---------- Cena 4: a O.S. se monta na prancheta ---------- */

const LINHAS = [
  { glifo: 'pessoa', cor: IL.roxo, w1: 250, w2: 170 }, // cliente
  { glifo: 'chave', cor: IL.marinho, w1: 272, w2: 140 }, // serviço
  { glifo: 'tecnico', cor: IL.cianoEscuro, w1: 222, w2: 182 }, // técnico
  { glifo: 'calendario', cor: '#D98A00', w1: 200, w2: 120 }, // prazo
];
const ORIGENS: P[] = [
  [-392, -176],
  [392, -64],
  [-392, 150],
  [392, 262],
];
const LINHA_Y = (i: number) => -112 + i * 112;
const VOO = (i: number) => 44 + i * 22;
const CARIMBO = 148;
const AVIAO = 174;
const AVIAO_FIM = 204;
const ROTA_AVIAO: [P, P, P, P] = [
  [800, 1236],
  [1110, 1330],
  [780, 1720],
  [348, 1572],
];

const Prancheta: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  return (
    <g>
      {/* espessura da prancheta, prancheta e papel */}
      <rect x={-300} y={-386} width={600} height={800} rx={56} fill="#3B1C78" />
      <rect x={-300} y={-400} width={600} height={800} rx={56} fill="url(#il-roxo-fundo)" />
      <rect x={-292} y={-392} width={584} height={784} rx={50} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={3} />
      <rect x={-244} y={-322} width={500} height={690} rx={22} fill="rgba(20,6,60,0.28)" />
      <rect x={-250} y={-330} width={500} height={690} rx={22} fill="url(#il-papel)" />
      <Txt x={-200} y={-252} s={24} cor={IL.tintaSuave} ls={3}>
        ORDEM DE SERVIÇO
      </Txt>
      <Txt x={-200} y={-200} s={50} cor={IL.tinta}>
        O.S. #1248
      </Txt>
      <line x1={-200} y1={-172} x2={200} y2={-172} stroke={IL.lavanda} strokeWidth={4} strokeLinecap="round" />
      {LINHAS.map((l, i) => {
        const y = LINHA_Y(i);
        const chegou = frame >= VOO(i) + 14;
        const w = tween(frame, VOO(i) + 14, 12, EASE.out);
        const w2 = tween(frame, VOO(i) + 18, 12, EASE.out);
        const ck = mola(VOO(i) + 26);
        return (
          <g key={i}>
            <circle cx={-160} cy={y} r={38} fill={chegou ? l.cor : 'none'} opacity={chegou ? 0.14 : 1} stroke={chegou ? 'none' : IL.lavandaEscura} strokeWidth={4} strokeDasharray="8 9" />
            {chegou && <Glifo nome={l.glifo} x={-160} y={y} s={40} cor={l.cor} sw={2.4} />}
            <rect x={-100} y={y - 24} width={260} height={18} rx={9} fill={IL.lavanda} />
            <rect x={-100} y={y + 10} width={180} height={13} rx={6.5} fill={IL.lavanda} />
            <rect x={-100} y={y - 24} width={l.w1 * w} height={18} rx={9} fill={IL.tinta} />
            <rect x={-100} y={y + 10} width={l.w2 * w2} height={13} rx={6.5} fill={IL.lavandaEscura} />
            <circle cx={196} cy={y} r={26} fill="none" stroke={IL.lavandaEscura} strokeWidth={4} opacity={1 - Math.min(1, ck * 2)} />
            {ck > 0.01 && (
              <g transform={`translate(196 ${y}) scale(${ck})`}>
                <circle r={26} fill={IL.ciano} />
                <Glifo nome="check" s={30} cor={IL.branco} sw={3.6} />
              </g>
            )}
          </g>
        );
      })}
      {/* presilha de metal */}
      <rect x={-140} y={-372} width={280} height={74} rx={24} fill="url(#il-metal)" />
      <rect x={-52} y={-424} width={104} height={72} rx={32} fill="none" stroke="url(#il-metal)" strokeWidth={18} />
      <circle cx={-96} cy={-335} r={8} fill="#A69CC6" />
      <circle cx={96} cy={-335} r={8} fill="#A69CC6" />
    </g>
  );
};

// Ícones que voam de fora para as linhas da O.S. (cliente, serviço, técnico e prazo).
const IconesVoando: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {LINHAS.map((l, i) => {
        const f = tween(frame, VOO(i), 14, EASE.inOut);
        if (f >= 1) return null;
        const [ox, oy] = ORIGENS[i];
        const alvo: P = [-160, LINHA_Y(i)];
        const ctrl: P = [(ox + alvo[0]) / 2, Math.min(oy, alvo[1]) - 170];
        const u = 1 - f;
        const x = u * u * ox + 2 * u * f * ctrl[0] + f * f * alvo[0];
        const y = u * u * oy + 2 * u * f * ctrl[1] + f * f * alvo[1] + Math.sin((frame + i * 20) / 14) * 9 * u;
        const r = 62 - 24 * f;
        return (
          <Pop key={i} at={22 + i * 4} x={x} y={y} rot={20}>
            <Bolha r={r} glifo={l.glifo} cor={l.cor} />
          </Pop>
        );
      })}
    </>
  );
};

export const CenaCriar: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  const entrada = mola(6, { damping: 16, stiffness: 90, mass: 1 });
  const tremor = frame > CARIMBO + 3 && frame < CARIMBO + 14 ? Math.sin(frame * 2.6) * (CARIMBO + 14 - frame) * 1.4 : 0;
  const crono = tween(frame, 44, 96, EASE.inOut);
  const carimbo = mola(CARIMBO, { damping: 13, stiffness: 170, mass: 1 });
  const voo = tween(frame, AVIAO, AVIAO_FIM - AVIAO, EASE.inOut);
  const [ax, ay] = bez(...ROTA_AVIAO, voo);
  const aAng = bezAng(...ROTA_AVIAO, voo);
  const some = tween(frame, AVIAO_FIM, 6);
  const sino = mola(AVIAO_FIM, { damping: 8, stiffness: 160, mass: 0.6 });
  const legenda = tween(frame, AVIAO_FIM + 4, 14, EASE.out);
  return (
    <Bg focus={[50, 55]}>
      <Push from={1} to={1.04} origin="50% 60%">
        <Palco>
          <g transform={`translate(${540 + tremor} ${960 + (1 - entrada) * 760}) rotate(${(1 - entrada) * 9})`} opacity={Math.min(1, entrada * 2)}>
            <Sombra y={440} rx={330} ry={34} />
            <Prancheta />
            {carimbo > 0.01 && (
              <g transform={`translate(64 300) rotate(-11) scale(${2.4 - 1.4 * carimbo})`} opacity={Math.min(1, carimbo * 3)}>
                <Carimbo texto="ABERTA" cor={IL.verde} w={300} h={98} />
              </g>
            )}
            <Pop at={30} x={318} y={-344} rot={30}>
              <Cronometro r={104} p={crono * 0.3} ang={crono * 720} />
            </Pop>
            <IconesVoando />
          </g>
          <Brilho x={330} y={1150} r={26} at={CARIMBO + 6} />
          <Brilho x={860} y={1080} r={20} at={CARIMBO + 10} />
          <Brilho x={760} y={1330} r={16} at={CARIMBO + 14} />
          {/* rastro pontilhado e avião de papel levando o aviso ao técnico */}
          {frame >= AVIAO &&
            new Array(Math.floor(voo * 26)).fill(0).map((_, k) => {
              const [x, y] = bez(...ROTA_AVIAO, k / 26);
              return <circle key={k} cx={x} cy={y} r={5} fill={IL.branco} opacity={0.5 * (1 - some * 0.7)} />;
            })}
          {frame >= AVIAO && some < 1 && (
            <g transform={`translate(${ax} ${ay}) rotate(${aAng}) scale(${1 - some})`}>
              <AviaoPapel s={110} />
            </g>
          )}
          <Pop at={166} x={250} y={1590}>
            <Sombra y={120} rx={100} />
            <g filter="url(#il-drop-sm)">
              <Pessoa id="tec4" r={96} pele="#E0A57E" cabelo="#2B1B14" roupa={IL.marinho} fundo="#C8F2FB" estilo="curto" acessorio="bone" />
            </g>
            {sino > 0.01 && (
              <g transform={`translate(72 -70) scale(${sino}) rotate(${Math.sin(frame / 2.2) * 14 * Math.max(0, 1 - (frame - AVIAO_FIM) / 30)})`}>
                <circle r={32} fill={IL.ambar} stroke={IL.branco} strokeWidth={5} />
                <Glifo nome="sino" s={34} cor={IL.branco} sw={2.6} />
              </g>
            )}
          </Pop>
          <g opacity={legenda} transform={`translate(${(1 - legenda) * -30} 0)`}>
            <Txt x={378} y={1584} s={52}>
              Técnico avisado
            </Txt>
            <Txt x={378} y={1638} s={36} w={700} opacity={0.75}>
              em tempo real
            </Txt>
          </g>
        </Palco>
      </Push>
      <Burst x={604} y={1260} at={CARIMBO + 2} count={16} radius={260} />
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Crie O.S. em\n**segundos**'} at={2} size={112} />
      </div>
      <Sfx name="whoosh" at={6} volume={0.3} />
      {LINHAS.map((_, i) => (
        <React.Fragment key={i}>
          <Sfx name="pop" at={22 + i * 4} volume={0.2} />
          <Sfx name="whoosh" at={VOO(i)} volume={0.12} />
          <Sfx name="type" at={VOO(i) + 15} volume={0.14} />
          <Sfx name="type" at={VOO(i) + 19} volume={0.12} />
          <Sfx name="tick" at={VOO(i) + 26} volume={0.4} />
        </React.Fragment>
      ))}
      <Sfx name="click" at={CARIMBO + 3} volume={0.6} />
      <Sfx name="chime" at={CARIMBO + 6} volume={0.3} />
      <Sfx name="whoosh" at={AVIAO} volume={0.28} />
      <Sfx name="pop" at={AVIAO_FIM} volume={0.32} />
    </Bg>
  );
};

/* ---------- Cena 5: rota do serviço, prazo e custo ao vivo ---------- */

const ROTA: [P, P, P, P] = [
  [-90, 830],
  [250, 600],
  [700, 1040],
  [1170, 690],
];
const PINOS = [
  { t: 0.25, nome: 'Diagnóstico', cor: IL.verde },
  { t: 0.52, nome: 'Execução', cor: IL.ciano },
  { t: 0.8, nome: 'Entrega', cor: IL.branco },
];

// Posição da van na rota (0 a 1): entra, passa pelo diagnóstico e segue devagar rumo à execução.
const vanT = (frame: number) => -0.1 + 0.44 * tween(frame, 26, 64, EASE.out) + 0.045 * tween(frame, 96, 104, EASE.inOut);

export const CenaTempoReal: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  const estrada = tween(frame, 6, 28, EASE.inOut);
  const t = vanT(frame);
  const [vx, vy] = bez(...ROTA, Math.max(0, t));
  const vAng = bezAng(...ROTA, Math.max(0, t));
  const ponteiro = mola(96, { damping: 7, stiffness: 55, mass: 1 });
  const vivo = 0.35 + 0.65 * Math.abs(Math.sin(frame / 8));
  const amostras = new Array(61).fill(0).map((_, k) => bez(...ROTA, k / 60));
  const d = amostras.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <Bg focus={[50, 50]}>
      <Push from={1} to={1.035} origin="50% 55%">
        <Palco>
          {/* estrada */}
          <path d={d} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={116} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - estrada} />
          <path d={d} fill="none" stroke="#2A1366" strokeWidth={92} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - estrada} />
          <path d={d} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={6} strokeDasharray="26 24" strokeDashoffset={-frame * 2} opacity={tween(frame, 26, 12)} />
          {PINOS.map((p, i) => {
            const [x, y] = bez(...ROTA, p.t);
            const pulso = (frame % 40) / 40;
            return (
              <g key={p.nome}>
                {i === 1 && frame > 44 && <circle cx={x} cy={y} r={30 + pulso * 70} fill="none" stroke={IL.ciano} strokeWidth={5} opacity={0.7 * (1 - pulso)} />}
                <Pop at={24 + i * 8} x={x} y={y} dy={-60} rot={0} from={0.2}>
                  <Pino cor={p.cor} s={104}>
                    {i === 0 && <Glifo nome="check" s={30} cor={IL.verde} sw={3.6} draw={tween(frame, 56, 12)} />}
                    {i === 1 && <circle r={11 * (0.85 + 0.15 * Math.sin(frame / 5))} fill={IL.ciano} />}
                    {i === 2 && <Glifo nome="bandeira" s={30} cor={IL.roxo} sw={2.6} />}
                  </Pino>
                </Pop>
                <g opacity={tween(frame, 34 + i * 8, 14)}>
                  <Txt x={x} y={y + 92} s={34} w={800} anchor="middle" cor={i === 1 ? IL.cianoClaro : IL.branco}>
                    {p.nome}
                  </Txt>
                </g>
              </g>
            );
          })}
          {/* sinal ao vivo saindo da van */}
          {[0, 1, 2, 3].map((k) => {
            const age = frame - (78 + k * 34);
            if (age < 0 || age > 40) return null;
            return <circle key={k} cx={vx} cy={vy - 50} r={50 + age * 3.6} fill="none" stroke={IL.ciano} strokeWidth={5} opacity={0.6 * (1 - age / 40)} />;
          })}
          {t > -0.07 && (
            <g transform={`translate(${vx} ${vy + 14}) rotate(${vAng})`}>
              <Van s={206} roda={t * 5200} />
            </g>
          )}
          <Pop at={62} x={870} y={520} rot={0} dy={20}>
            <rect x={-118} y={-34} width={236} height={68} rx={34} fill="rgba(20,8,50,0.55)" stroke="rgba(255,255,255,0.22)" strokeWidth={2} />
            <circle cx={-80} cy={0} r={11} fill={IL.vermelho} opacity={vivo} />
            <Txt x={-58} y={11} s={30} ls={2}>
              AO VIVO
            </Txt>
          </Pop>
          {/* prazo: despertador com a data de entrega colada por cima */}
          <Pop at={60} x={318} y={1270} rot={14}>
            <Despertador r={160} p={tween(frame, 80, 90, EASE.inOut) * 0.65} min={frame * 5} />
          </Pop>
          <Pop at={70} x={150} y={1090} rot={-24}>
            <g transform="rotate(-12)">
              <FolhaCalendario w={160} dia="18" mes="OUT" />
            </g>
          </Pop>
          <Pop at={150} x={318} y={1560} rot={0} dy={30}>
            <Etiqueta texto="No prazo" w={270} />
          </Pop>
          {/* custo: medidor e moedas */}
          <Pop at={82} x={792} y={1262} rot={0}>
            <Medidor r={166} ang={180 + 76 * ponteiro} />
          </Pop>
          {[3, 5, 7].map((n, k) => (
            <g key={n} transform={`translate(${692 + k * 100} 1470)`}>
              <PilhaMoedas n={n} rx={40} caindo={new Array(n).fill(0).map((_, i) => (1 - mola(100 + k * 6 + i * 4, { damping: 11, stiffness: 160, mass: 0.6 })) * 520)} />
            </g>
          ))}
          <Pop at={162} x={792} y={1560} rot={0} dy={30}>
            <Etiqueta texto="Dentro do orçado" w={400} />
          </Pop>
          <Brilho x={470} y={1080} r={18} at={110} />
          <Brilho x={990} y={1150} r={22} at={140} />
        </Palco>
      </Push>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Prazo e custo\nem **tempo real**'} at={2} size={108} />
      </div>
      <Sfx name="whoosh" at={4} volume={0.3} />
      {PINOS.map((_, i) => (
        <Sfx key={i} name="pop" at={26 + i * 8} volume={0.22} />
      ))}
      <Sfx name="whoosh" at={30} volume={0.22} />
      <Sfx name="tick" at={58} volume={0.4} />
      <Sfx name="pop" at={62} volume={0.25} />
      <Sfx name="pop" at={72} volume={0.22} />
      <Sfx name="pop" at={84} volume={0.25} />
      {new Array(10).fill(0).map((_, i) => (
        <Sfx key={`m${i}`} name="tick" at={102 + i * 5} volume={0.16} />
      ))}
      <Sfx name="chime" at={152} volume={0.24} />
      <Sfx name="pop" at={164} volume={0.25} />
    </Bg>
  );
};

/* ---------- Cena 6: histórico do cliente e equipe conectada ---------- */

const BEAT = 106;
const FOLHAS = [
  { ano: '2021', cor: IL.verde, glifo: 'check' },
  { ano: '2023', cor: IL.verde, glifo: 'check' },
  { ano: '2025', cor: IL.verde, glifo: 'check' },
  { ano: 'Hoje', cor: IL.ambar, glifo: 'relogio' },
];
const LEQUE = { cx: 540, cy: 1470, r: 640, angs: [-36, -12, 12, 36] };
const CENTRO: P = [540, 1080];
const PASTA: P = [540, 1240];

const EQUIPE = [
  { x: 170, y: 740, nome: 'Técnico', glifo: 'chave', badge: IL.marinho, p: { pele: '#E0A57E', cabelo: '#2B1B14', roupa: IL.marinho, fundo: '#C8F2FB', estilo: 'curto', acessorio: 'bone' } },
  { x: 910, y: 740, nome: 'Atendimento', glifo: 'chat', badge: IL.roxo, p: { pele: '#F4C9A8', cabelo: '#7B4A2A', roupa: IL.roxo, fundo: '#E6DBFB', estilo: 'longo', acessorio: 'fone' } },
  { x: 170, y: 1420, nome: 'Gestão', glifo: 'grafico', badge: IL.cianoEscuro, p: { pele: '#B87A55', cabelo: '#2B1B14', roupa: '#0E9CC0', fundo: '#CFF3DF', estilo: 'coque', acessorio: 'oculos' } },
  { x: 910, y: 1420, nome: 'Cliente', glifo: 'sino', badge: IL.ambar, p: { pele: '#7A4B32', cabelo: '#1E120C', roupa: '#E8833A', fundo: '#FFE3CC', estilo: 'ondulado' } },
] as const;

const FolhaOS: React.FC<{ ano: string; cor: string; glifo: string }> = ({ ano, cor, glifo }) => (
  <g filter="url(#il-drop-sm)">
    <rect x={-110} y={-140} width={220} height={280} rx={22} fill="url(#il-papel)" />
    <path d="M-110 -118 Q-110 -140 -88 -140 L88 -140 Q110 -140 110 -118 L110 -72 L-110 -72 Z" fill={cor} />
    <circle cx={-64} cy={-106} r={24} fill={IL.branco} />
    <Glifo nome={glifo} x={-64} y={-106} s={30} cor={cor} sw={3} />
    <rect x={-20} y={-114} width={100} height={14} rx={7} fill="rgba(255,255,255,0.55)" />
    <Txt y={-4} s={58} cor={IL.tinta} anchor="middle">
      {ano}
    </Txt>
    <rect x={-76} y={30} width={152} height={13} rx={6.5} fill={IL.lavandaEscura} />
    <rect x={-76} y={56} width={118} height={13} rx={6.5} fill={IL.lavanda} />
    <rect x={-76} y={82} width={136} height={13} rx={6.5} fill={IL.lavanda} />
  </g>
);

const Pasta: React.FC<{ abre: number }> = ({ abre }) => (
  <g>
    <Sombra y={262} rx={350} ry={32} />
    <path d="M-320 -196 Q-320 -226 -290 -226 L-112 -226 Q-94 -226 -84 -212 L-68 -192 L290 -192 Q320 -192 320 -162 L320 210 Q320 240 290 240 L-290 240 Q-320 240 -320 210 Z" fill={IL.roxoEscuro} />
    <rect x={-270} y={-176} width={520} height={160} rx={12} fill={IL.lavanda} transform="rotate(-2)" />
    <rect x={-262} y={-160} width={500} height={150} rx={12} fill={IL.branco} transform="rotate(1.5)" />
    <g transform={`translate(0 240) scale(1 ${1 - abre * 0.1}) translate(0 -240)`}>
      <path d="M-320 -112 Q-320 -136 -296 -136 L296 -136 Q320 -136 320 -112 L320 210 Q320 240 290 240 L-290 240 Q-320 240 -320 210 Z" fill="url(#il-roxo-fundo)" />
      <path d="M-300 -126 L300 -126" stroke="rgba(255,255,255,0.22)" strokeWidth={4} strokeLinecap="round" />
      <rect x={-190} y={-6} width={380} height={136} rx={26} fill={IL.branco} filter="url(#il-drop-sm)" />
      <Txt y={52} s={40} cor={IL.tinta} anchor="middle">
        Oficina Ribeiro
      </Txt>
      <Txt y={102} s={32} w={800} cor={IL.roxo} anchor="middle">
        14 O.S. no histórico
      </Txt>
    </g>
  </g>
);

export const CenaHistorico: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  const entrada = mola(6, { damping: 16, stiffness: 90, mass: 1 });
  const abre = tween(frame, 20, 12, EASE.out);
  const g = tween(frame, BEAT, 22, EASE.inOut);
  const s = 1 - 0.38 * g;
  const brilhoHub = tween(frame, BEAT + 10, 20);
  return (
    <Bg focus={[50, 55]}>
      <Palco>
        {brilhoHub > 0 && <circle cx={CENTRO[0]} cy={CENTRO[1]} r={360} fill="url(#il-brilho-ciano)" opacity={brilhoHub} />}
        <g transform={`translate(${CENTRO[0]} ${CENTRO[1]}) scale(${s}) translate(${-CENTRO[0]} ${-CENTRO[1]})`}>
          {/* linha do tempo pontilhada passando pelas folhas */}
          {new Array(21).fill(0).map((_, k) => {
            const a = ((-40 + k * 4) * Math.PI) / 180;
            const vis = tween(frame, 30 + k * 1.6, 6);
            return <circle key={k} cx={LEQUE.cx + LEQUE.r * Math.sin(a)} cy={LEQUE.cy - LEQUE.r * Math.cos(a)} r={6} fill={IL.branco} opacity={0.4 * vis * (1 - g)} />;
          })}
          <g transform={`translate(${PASTA[0]} ${PASTA[1] + (1 - entrada) * 700})`} opacity={Math.min(1, entrada * 2)}>
            <Pasta abre={abre} />
          </g>
          {FOLHAS.map((f, i) => {
            const p = mola(26 + i * 12, { damping: 13, stiffness: 120, mass: 0.8 });
            if (p <= 0.001) return null;
            const a = (LEQUE.angs[i] * Math.PI) / 180;
            const tx = LEQUE.cx + LEQUE.r * Math.sin(a);
            const ty = LEQUE.cy - LEQUE.r * Math.cos(a);
            const x = PASTA[0] + (tx - PASTA[0]) * p;
            const y = PASTA[1] - 120 + (ty - (PASTA[1] - 120)) * p;
            return (
              <g key={f.ano} transform={`translate(${x} ${y}) rotate(${LEQUE.angs[i] * 0.5 * p}) scale(${0.45 + 0.55 * p})`} opacity={Math.min(1, p * 2)}>
                <FolhaOS {...f} />
              </g>
            );
          })}
          <Brilho x={880} y={720} r={20} at={80} />
          <Brilho x={196} y={790} r={16} at={88} />
        </g>
        {/* equipe em volta da O.S. compartilhada */}
        {EQUIPE.map((m, i) => {
          const at = BEAT + 18 + i * 8;
          const linha = tween(frame, at + 6, 16, EASE.out);
          const dx = CENTRO[0] - m.x;
          const dy = CENTRO[1] - m.y;
          const len = Math.hypot(dx, dy);
          const ux = dx / len;
          const uy = dy / len;
          const a0 = 112;
          const a1 = len - 210;
          const pts = Math.floor((a1 - a0) / 22);
          const ida = ((frame - at - 20) % 44) / 44;
          return (
            <g key={m.nome}>
              {frame > at + 6 &&
                new Array(pts).fill(0).map((_, k) => (k / pts <= linha ? <circle key={k} cx={m.x + ux * (a0 + k * 22)} cy={m.y + uy * (a0 + k * 22)} r={5} fill={IL.branco} opacity={0.45} /> : null))}
              {frame > at + 20 && (
                <circle
                  cx={m.x + ux * (a0 + (a1 - a0) * (i % 2 ? 1 - ida : ida))}
                  cy={m.y + uy * (a0 + (a1 - a0) * (i % 2 ? 1 - ida : ida))}
                  r={11}
                  fill={IL.ciano}
                  stroke={IL.branco}
                  strokeWidth={4}
                />
              )}
              <Pop at={at} x={m.x} y={m.y}>
                <g filter="url(#il-drop-sm)">
                  <Pessoa id={`eq${i}`} r={100} {...m.p} />
                </g>
                <Pop at={at + 10} x={74} y={-74} rot={30}>
                  <circle r={30} fill={m.badge} stroke={IL.branco} strokeWidth={5} />
                  <Glifo nome={m.glifo} s={32} cor={IL.branco} sw={2.6} />
                </Pop>
                <Txt y={152} s={34} w={800} anchor="middle">
                  {m.nome}
                </Txt>
              </Pop>
            </g>
          );
        })}
      </Palco>
      <Fade at={BEAT + 70} style={{ position: 'absolute', left: 0, right: 0, top: 1680, textAlign: 'center', fontSize: 42, fontWeight: 800, lineHeight: 1.2 }}>
        Toda a equipe vendo a <span style={{ color: IL.cianoClaro }}>mesma informação</span>
      </Fade>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Histórico de\ncada **cliente**'} at={2} size={108} out={BEAT - 8} />
      </div>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Equipe toda\n**conectada**'} at={BEAT + 6} size={108} />
      </div>
      <Sfx name="whoosh" at={6} volume={0.25} />
      {FOLHAS.map((_, i) => (
        <Sfx key={i} name="pop" at={28 + i * 12} volume={0.2} />
      ))}
      <Sfx name="whoosh" at={BEAT} volume={0.3} />
      {EQUIPE.map((_, i) => (
        <Sfx key={`e${i}`} name="pop" at={BEAT + 20 + i * 8} volume={0.28} />
      ))}
    </Bg>
  );
};
