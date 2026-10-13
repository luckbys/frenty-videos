// Cenas 1 a 3 do comercial de Lote e Validade: a prateleira com produtos vencendo, os problemas e a
// entrada da marca com o módulo. Mesma linguagem do comercial do Módulo de O.S., só com ilustrações.
import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { alpha } from '../../color';
import { FrentyLogo } from '../../components/FrentyLogo';
import { LineIcon } from '../../components/Icons';
import { EASE, SPRING, Sfx, tween } from '../../motion/core';
import { OldWays, Streaks, SWEEP } from '../modulo-os/cenas-abertura';
import { FolhaCalendario, IL, MiniPalco, MoedaAsas, Palco, Pop, Selo, Txt, useMola } from '../modulo-os/ilustracoes';
import { K, M } from '../modulo-os/tokens';
import { Bg, Fade, Kicker, Title, useSpring } from '../modulo-os/ui';
import { Caixa, Caixinha, CodigoBarras, FolhaMulta, Garrafa, Lata, Lixeira, Lupa, Pote, Prateleira, TagValidade } from './ilustracoes';

type P = [number, number];

/* ---------- Cena 1: a prateleira com produtos vencendo ---------- */

const TABUA_1 = 1060;
const TABUA_2 = 1360;
const LIXO: P = [905, 1610];

type Produto = { x: number; y: number; el: React.ReactNode; vence?: number; at: number };
const PRODUTOS: Produto[] = [
  { x: 190, y: TABUA_1, at: 6, el: <Caixa w={150} h={118} /> },
  { x: 330, y: TABUA_1, at: 9, el: <Garrafa s={100} /> },
  { x: 432, y: TABUA_1, at: 12, el: <Lata s={100} /> },
  { x: 516, y: TABUA_1, at: 15, el: <Lata s={100} cor={IL.ambar} />, vence: 0 },
  { x: 632, y: TABUA_1, at: 18, el: <Caixinha s={104} />, vence: 1 },
  { x: 184, y: TABUA_2, at: 10, el: <Pote s={112} /> },
  { x: 336, y: TABUA_2, at: 13, el: <Caixa w={170} h={136} /> },
  { x: 476, y: TABUA_2, at: 16, el: <Garrafa s={104} cor={IL.roxo} />, vence: 2 },
  { x: 580, y: TABUA_2, at: 19, el: <Caixinha s={100} cor={IL.verde} /> },
  { x: 680, y: TABUA_2, at: 22, el: <Pote s={100} cor={IL.vermelho} />, vence: 3 },
];
const VENCE_AT = 40; // quando aparece a primeira plaquinha "VENCIDO"
const CAI_AT = 66; // quando o primeiro vencido pula para a lixeira

const bezQ = (a: P, c: P, b: P, t: number): P => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];

const PrateleiraVencendo: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  const e = tween(frame, SWEEP - 2, 16, EASE.in);
  const fora = (x: number, y: number, k: number) => {
    const dx = x - 540;
    const dy = y - 1200;
    const len = Math.hypot(dx, dy) || 1;
    return `translate(${(dx / len) * 1500 * e} ${(dy / len) * 1500 * e}) rotate(${(k % 2 ? 1 : -1) * 60 * e} ${x} ${y})`;
  };
  const dia = 14 + Math.min(7, Math.max(0, Math.floor((frame - 24) / 4)));
  const vira = frame >= 24 && frame < 56 ? Math.abs(Math.cos((((frame - 24) % 4) / 4) * Math.PI)) : 1;
  const abre = tween(frame, CAI_AT - 6, 8, EASE.out) * (1 - tween(frame, CAI_AT + 40, 8, EASE.in));
  const tremeLixo = frame > CAI_AT + 14 && frame < CAI_AT + 44 ? Math.sin(frame * 2.4) * 3 : 0;
  const entra = mola(2, { damping: 16, stiffness: 110, mass: 1 });
  return (
    <Palco style={{ filter: e > 0.05 ? `blur(${e * 10}px)` : undefined, opacity: 1 - e * 0.6 }}>
      <g transform={`${fora(420, 1100, 1)} translate(0 ${(1 - entra) * 500})`} opacity={Math.min(1, entra * 2)}>
        <Prateleira x0={90} x1={760} topo={770} tabuas={[TABUA_1, TABUA_2]} />
      </g>
      {PRODUTOS.map((pr, k) => {
        const p = mola(pr.at, { damping: 12, stiffness: 150, mass: 0.7 });
        if (p <= 0.001) return null;
        let x = pr.x;
        let y = pr.y;
        let rot = 0;
        let some = 1;
        let tag = 0;
        if (pr.vence !== undefined) {
          tag = mola(VENCE_AT + pr.vence * 6, { damping: 9, stiffness: 200, mass: 0.6 });
          const t = tween(frame, CAI_AT + pr.vence * 5, 22, EASE.inOut);
          if (t > 0) {
            const [bx, by] = bezQ([pr.x, pr.y], [(pr.x + LIXO[0]) / 2 + 40, Math.min(pr.y, LIXO[1]) - 320], [LIXO[0], LIXO[1] - 150], t);
            x = bx;
            y = by;
            rot = t * (pr.vence % 2 ? 160 : -140);
            some = t > 0.92 ? 0 : 1;
          }
        }
        const treme = pr.vence !== undefined && frame > VENCE_AT + pr.vence * 6 && frame < VENCE_AT + pr.vence * 6 + 10 ? Math.sin(frame * 3) * 4 : 0;
        return (
          <g key={k} transform={fora(pr.x, pr.y, k)} opacity={some}>
            <g transform={`translate(${x + treme} ${y + (1 - p) * -80}) rotate(${rot}) scale(${0.4 + 0.6 * p})`}>
              {pr.el}
              {tag > 0.01 && (
                <g transform={`translate(18 -150) rotate(-12) scale(${tag})`}>
                  <TagValidade texto="VENCIDO" cor={IL.vermelho} s={22} />
                </g>
              )}
            </g>
          </g>
        );
      })}
      <g transform={`${fora(LIXO[0], LIXO[1], 2)} translate(${LIXO[0] + tremeLixo} ${LIXO[1]})`}>
        <Pop at={30} rot={8}>
          <Lixeira w={190} abre={abre} />
        </Pop>
      </g>
      {[0, 1, 2].map((k) => {
        const t = tween(frame, CAI_AT + 26 + k * 6, 34, EASE.out);
        if (t <= 0 || t >= 1) return null;
        return (
          <g key={k} transform={`translate(${LIXO[0] - 30 + k * 40 + t * (60 + k * 30)} ${LIXO[1] - 230 - t * (420 + k * 90)}) rotate(${-10 + k * 12})`} opacity={Math.min(1, t * 5, (1 - t) * 3)}>
            <MoedaAsas r={30} bate={0.5 + 0.5 * Math.abs(Math.sin(frame / 3))} />
          </g>
        );
      })}
      <g transform={fora(905, 880, 3)}>
        <Pop at={20} x={905} y={880} rot={14}>
          <g transform={`rotate(8) scale(1 ${vira})`}>
            <FolhaCalendario w={160} dia={String(dia)} mes="NOV" />
          </g>
        </Pop>
      </g>
    </Palco>
  );
};

export const CenaCaos: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = frame >= CAI_AT + 16 && frame < CAI_AT + 26 ? Math.sin(frame * 3.1) * (CAI_AT + 26 - frame) * 1.1 : 0;
  return (
    <Bg focus={[45, 62]}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        <PrateleiraVencendo />
      </div>
      <div style={{ position: 'absolute', left: M, top: 210 }}>
        <Title text={'Ainda perde\nproduto **vencido**?'} at={4} size={100} out={SWEEP - 6} />
      </div>
      <Streaks />
      <div style={{ position: 'absolute', left: M, top: 620 }}>
        <Kicker at={SWEEP + 14} text="Chega de desperdício" />
      </div>
      <div style={{ position: 'absolute', left: M, top: 710 }}>
        <Title text={'Evite perdas e\ngaranta\n**conformidade.**'} at={SWEEP + 18} size={120} lh={0.98} />
      </div>
      <div style={{ position: 'absolute', left: M, top: 1170 }}>
        <OldWays at={SWEEP + 40} itens={['Planilha', 'Etiqueta à mão', 'Conferência no olho']} />
      </div>
      <Sfx name="whoosh" at={2} volume={0.25} />
      {PRODUTOS.map((pr, i) => (
        <Sfx key={i} name="pop" at={pr.at + 3} volume={0.16} />
      ))}
      {[0, 1, 2, 3].map((k) => (
        <Sfx key={`v${k}`} name="tick" at={VENCE_AT + k * 6} volume={0.4} />
      ))}
      <Sfx name="click" at={CAI_AT - 5} volume={0.4} />
      <Sfx name="whoosh" at={CAI_AT + 2} volume={0.22} />
      <Sfx name="whoosh" at={SWEEP - 2} volume={0.5} />
      {[0, 1, 2].map((i) => (
        <React.Fragment key={`o${i}`}>
          <Sfx name="pop" at={SWEEP + 41 + i * 6} volume={0.22} />
          <Sfx name="tick" at={SWEEP + 54 + i * 6} volume={0.35} />
        </React.Fragment>
      ))}
    </Bg>
  );
};

/* ---------- Cena 2: os problemas ---------- */

const PerdaVencimento: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame % 48) / 48;
  return (
    <g>
      <g transform="translate(8 96)">
        <Lixeira w={124} abre={1} />
      </g>
      <g transform={`translate(-4 ${-46 + Math.sin(frame / 6) * 4}) rotate(-28)`}>
        <Garrafa s={62} cor={IL.roxo} />
        <g transform="translate(18 -96)">
          <circle r={17} fill={IL.vermelho} />
          <path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke={IL.branco} strokeWidth={4} strokeLinecap="round" />
        </g>
      </g>
      <g transform={`translate(${44 + t * 50} ${-40 - t * 70})`} opacity={Math.min(1, t * 6, (1 - t) * 3)}>
        <MoedaAsas r={22} bate={0.5 + 0.5 * Math.abs(Math.sin(frame / 3))} />
      </g>
    </g>
  );
};

const RiscoMulta: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 7) * 4;
  return (
    <g>
      <g transform="translate(-12 6) rotate(-7)">
        <FolhaMulta w={124} />
      </g>
      <g transform={`translate(64 ${-74 + bob})`} filter="url(#il-drop-sm)">
        <path d="M0 -34 L34 26 Q36 32 30 32 L-30 32 Q-36 32 -34 26 Z" fill={IL.ambar} stroke={IL.ambar} strokeWidth={6} strokeLinejoin="round" />
        <Txt y={24} s={40} anchor="middle">
          !
        </Txt>
      </g>
    </g>
  );
};

const LoteSemRastreio: React.FC = () => {
  const frame = useCurrentFrame();
  const vai = Math.sin(frame / 10);
  return (
    <g>
      <g transform="translate(-12 92)">
        <Caixa w={138} h={110}>
          <rect x={-34} y={-26} width={68} height={52} rx={8} fill={IL.branco} />
          <Txt y={18} s={44} cor={IL.vermelho} anchor="middle">
            ?
          </Txt>
        </Caixa>
      </g>
      <g transform={`translate(${40 + vai * 18} ${-56 + vai * 6}) rotate(-8)`}>
        <Lupa r={34} />
      </g>
    </g>
  );
};

const PROBLEMS = [
  { title: 'Perdas por vencimento', sub: 'Produto vencido vira prejuízo', Il: PerdaVencimento },
  { title: 'Risco de multa', sub: 'Fiscalização sem conformidade', Il: RiscoMulta },
  { title: 'Lote sem rastreio', sub: 'Ninguém sabe a origem', Il: LoteSemRastreio },
];
const STRIKE = 78;

export const CenaProblemas: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  return (
    <Bg focus={[50, 45]}>
      <div style={{ position: 'absolute', left: M, top: 460 }}>
        <Kicker at={2} text="O dia a dia sem controle" />
      </div>
      {PROBLEMS.map((pb, i) => {
        const at = 8 + i * 15;
        const pop = mola(at, { damping: 11, stiffness: 150, mass: 0.7 });
        const txt = tween(frame, at + 4, 16, EASE.out);
        const strike = tween(frame, STRIKE + i * 5, 12, EASE.out);
        const fall = tween(frame, STRIKE + 12 + i * 3, 16, EASE.in);
        const shake = frame > at + 6 && frame < at + 16 ? Math.sin(frame * 2.7) * (at + 16 - frame) * 1.1 : 0;
        return (
          <div key={pb.title} style={{ position: 'absolute', left: M, top: 620 + i * 250, width: 1080 - M * 2, height: 214, transform: `translate(${shake}px, ${fall * 900}px) rotate(${fall * (i % 2 ? 10 : -12)}deg)`, opacity: 1 - fall }}>
            <div style={{ position: 'absolute', left: 0, top: -3, width: 220, height: 220, transform: `scale(${pop}) rotate(${(1 - Math.min(1, pop)) * -24}deg)` }}>
              <MiniPalco size={220}>
                <circle r={106} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" strokeWidth={3} />
                <pb.Il />
              </MiniPalco>
            </div>
            <div style={{ position: 'absolute', left: 262, right: -20, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: K.white, opacity: txt, transform: `translateX(${(1 - txt) * 90}px)` }}>
              <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1.05 }}>{pb.title}</div>
              <div style={{ fontSize: 31, fontWeight: 700, color: alpha(K.white, 0.75), marginTop: 6 }}>{pb.sub}</div>
            </div>
            <div style={{ position: 'absolute', left: -20, top: 80, height: 16, width: (1080 - M * 2 + 40) * strike, borderRadius: 8, background: K.cyan, boxShadow: `0 0 30px ${alpha(K.cyan, 0.8)}` }} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: M, top: 740 }}>
        <Title text={'Isso acaba\n**aqui.**'} at={STRIKE + 32} size={176} lh={0.98} />
      </div>
      {PROBLEMS.map((_, i) => (
        <React.Fragment key={i}>
          <Sfx name="pop" at={8 + i * 15 + 4} volume={0.35} />
          <Sfx name="tick" at={STRIKE + i * 5} volume={0.5} />
        </React.Fragment>
      ))}
      <Sfx name="whoosh" at={STRIKE + 14} volume={0.3} />
    </Bg>
  );
};

/* ---------- Cena 3: a marca e o módulo ---------- */

const PASSOS = ['Cadastro', 'Lote', 'Validade'];
const PASSOS_X = [220, 540, 860];
const PASSOS_Y = 1540;
const PASSOS_AT = 118;

const IlCadastro: React.FC = () => (
  <g>
    <g transform="translate(-6 62)">
      <Caixa w={116} h={92} />
    </g>
    <g transform="translate(46 -48)">
      <circle r={24} fill={IL.ciano} filter="url(#il-drop-sm)" />
      <path d="M0 -11 V11 M-11 0 H11" stroke={IL.branco} strokeWidth={5.5} strokeLinecap="round" />
    </g>
  </g>
);

const IlLote: React.FC = () => (
  <g transform="rotate(-8)">
    <path d="M-62 -40 L46 -40 L74 0 L46 40 L-62 40 Q-70 40 -70 32 L-70 -32 Q-70 -40 -62 -40 Z" fill={IL.branco} filter="url(#il-drop-sm)" />
    <circle cx={50} cy={0} r={8} fill={IL.roxo} />
    <g transform="translate(-14 0)">
      <CodigoBarras w={84} h={46} />
    </g>
  </g>
);

const IlValidade: React.FC<{ draw: number }> = ({ draw }) => (
  <g>
    <g transform="rotate(-6)">
      <FolhaCalendario w={104} dia="18" mes="NOV" />
    </g>
    <g transform="translate(46 44) scale(0.42)">
      <Selo r={54} draw={draw} />
    </g>
  </g>
);

const Passos: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const viagem = tween(frame, at + 22, 30, EASE.inOut);
  const xPonto = PASSOS_X[0] + (PASSOS_X[2] - PASSOS_X[0]) * viagem;
  const chegadas = [at + 22, at + 37, at + 52];
  return (
    <Palco>
      {new Array(31).fill(0).map((_, k) => {
        const x = PASSOS_X[0] + (k * (PASSOS_X[2] - PASSOS_X[0])) / 30;
        if (PASSOS_X.some((px) => Math.abs(px - x) < 104)) return null;
        return <circle key={k} cx={x} cy={PASSOS_Y} r={5.5} fill={IL.branco} opacity={0.45 * tween(frame, at + 8 + k * 0.5, 6)} />;
      })}
      {viagem > 0 && viagem < 1 && (
        <g>
          <circle cx={xPonto} cy={PASSOS_Y} r={22} fill={IL.ciano} opacity={0.5} filter="url(#il-glow)" />
          <circle cx={xPonto} cy={PASSOS_Y} r={11} fill={IL.ciano} />
        </g>
      )}
      {PASSOS.map((nome, i) => {
        const onda = (frame - chegadas[i]) / 16;
        return (
          <g key={nome}>
            {onda > 0 && onda < 1 && <circle cx={PASSOS_X[i]} cy={PASSOS_Y} r={106 + onda * 40} fill="none" stroke={IL.ciano} strokeWidth={5} opacity={0.7 * (1 - onda)} />}
            <Pop at={at + i * 7} x={PASSOS_X[i]} y={PASSOS_Y} rot={i === 1 ? 0 : i === 0 ? -14 : 14}>
              <circle r={104} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" strokeWidth={3} />
              {i === 0 && <IlCadastro />}
              {i === 1 && <IlLote />}
              {i === 2 && <IlValidade draw={tween(frame, at + 24, 12)} />}
            </Pop>
            <g opacity={tween(frame, at + 6 + i * 7, 12)}>
              <Txt x={PASSOS_X[i]} y={PASSOS_Y + 156} s={36} anchor="middle">
                {nome}
              </Txt>
            </g>
          </g>
        );
      })}
    </Palco>
  );
};

export const CenaMarca: React.FC = () => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const lift = sp(58, SPRING.heavy);
  const ring = tween(frame, 20, 40, EASE.out);
  return (
    <Bg focus={[50, 40]}>
      {ring > 0 && ring < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 540 - 140 - ring * 600,
            top: 880 - 140 - ring * 600,
            width: 280 + ring * 1200,
            height: 280 + ring * 1200,
            borderRadius: '50%',
            border: `${(1 - ring) * 14 + 1}px solid ${alpha(K.cyan, 0.7 * (1 - ring))}`,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: interpolate(lift, [0, 1], [770, 330]),
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${interpolate(lift, [0, 1], [1, 0.62])})`,
        }}
      >
        <FrentyLogo height={220} brilho />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center' }}>
        <Kicker at={70} text="Novo módulo" />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 790 }}>
        <Title text={'Lote e\n**Validade**'} at={74} size={168} align="center" lh={0.96} />
      </div>
      <Fade at={100} style={{ position: 'absolute', left: M, right: M, top: 1130, textAlign: 'center', fontSize: 44, fontWeight: 800, lineHeight: 1.3, color: alpha(K.white, 0.9) }}>
        Controle total dos seus perecíveis,
        <br />
        sempre em conformidade.
      </Fade>
      <Fade at={110} style={{ position: 'absolute', left: 0, right: 0, top: 1270, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '20px 34px',
            borderRadius: 999,
            border: `3px solid ${K.cyan}`,
            background: alpha(K.cyan, 0.12),
            fontSize: 36,
            fontWeight: 900,
            boxShadow: `0 0 40px ${alpha(K.cyan, 0.35)}`,
          }}
        >
          <LineIcon name="layers" size={42} color={K.cyan} strokeWidth={2.4} />
          Integrado ao seu ERP
        </div>
      </Fade>
      <Passos at={PASSOS_AT} />
      <Sfx name="pop" at={8} volume={0.3} />
      <Sfx name="pop" at={12} volume={0.25} />
      <Sfx name="pop" at={16} volume={0.25} />
      <Sfx name="chime" at={24} volume={0.3} />
      <Sfx name="whoosh" at={60} volume={0.25} />
      <Sfx name="pop" at={112} volume={0.3} />
      {PASSOS.map((_, i) => (
        <Sfx key={i} name="pop" at={PASSOS_AT + 2 + i * 7} volume={0.2} />
      ))}
      <Sfx name="tick" at={PASSOS_AT + 37} volume={0.3} />
      <Sfx name="tick" at={PASSOS_AT + 52} volume={0.35} />
    </Bg>
  );
};

