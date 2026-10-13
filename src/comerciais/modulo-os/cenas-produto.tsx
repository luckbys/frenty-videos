// Cenas 4 a 6: o sistema funcionando no celular (abrir a O.S., prazo e custo, histórico e equipe).
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { alpha } from '../../color';
import { LineIcon } from '../../components/Icons';
import { EASE, SPRING, Sfx, tween } from '../../motion/core';
import { countTo } from '../../ui/kit';
import { K, M } from './tokens';
import { AppHeader, Avatar, Bg, Burst, Card, CheckBadge, Fade, IconTile, Phone, Pill, Push, SCREEN_W, Tap, Title, Typed, typedEnd, useSpring } from './ui';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const OUTER_W = SCREEN_W + 30;

// Entrada 3D do celular (sobe inclinado e assenta) e flutuação leve.
const PhoneRig: React.FC<{ left: number; top: number; width: number; at?: number; tiltY?: number; children: React.ReactNode }> = ({ left, top, width, at = 0, tiltY = -8, children }) => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const p = sp(at, { damping: 20, stiffness: 80, mass: 1 });
  const bob = Math.sin(frame / 24) * 6;
  return (
    <div style={{ position: 'absolute', left, top, width, perspective: 2400 }}>
      <div
        style={{
          transform: `translateY(${(1 - p) * 700 + bob}px) rotateX(${(1 - p) * 30 + 3}deg) rotateY(${tiltY * p + (1 - p) * -20}deg) rotateZ(${(1 - p) * 6}deg)`,
          transformOrigin: '50% 100%',
          opacity: Math.min(1, p * 1.6),
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ---------- Cena 4: abrir a O.S. ---------- */

const FIELDS = [
  { label: 'Cliente', value: 'Oficina Ribeiro Ltda.', at: 30, lead: <Avatar initials="OR" size={28} bg={K.purple} /> },
  { label: 'Serviço', value: 'Manutenção preventiva', at: 56, lead: <LineIcon name="gear" size={20} color={K.inkSoft} /> },
  { label: 'Técnico', value: 'Carlos Mendes', at: 84, lead: <Avatar initials="CM" size={28} bg="#0E9CC0" /> },
  { label: 'Prazo', value: '18/10 · 17:00', at: 104, lead: <LineIcon name="calendar" size={20} color={K.inkSoft} /> },
];
const STEPS = ['Diagnóstico', 'Execução', 'Entrega'];
const TAP4 = 142;

const Field: React.FC<{ label: string; value: string; at: number; lead: React.ReactNode }> = ({ label, value, at, lead }) => {
  const frame = useCurrentFrame();
  const end = typedEnd(value, at);
  const focus = frame >= at - 4 && frame < end + 4;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: K.inkSoft, marginBottom: 6, letterSpacing: 0.3 }}>{label}</div>
      <div
        style={{
          height: 46,
          borderRadius: 13,
          background: K.field,
          border: `2px solid ${focus ? K.cyan : 'transparent'}`,
          boxShadow: focus ? `0 0 0 4px ${alpha(K.cyan, 0.18)}` : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 12px',
          fontSize: 16,
          fontWeight: 800,
          color: K.ink,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ opacity: frame >= at ? 1 : 0.35, display: 'flex' }}>{lead}</span>
        <Typed text={value} at={at} />
      </div>
    </div>
  );
};

const NewOsScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const sp = useSpring();
  const press = interpolate(frame, [TAP4 - 2, TAP4 + 2, TAP4 + 8], [1, 0.95, 1], clamp);
  const done = frame >= TAP4 + 4;
  return (
    <>
      <AppHeader title="Nova O.S." sub="Ordens de serviço" right={<LineIcon name="x" size={22} color="#fff" />} />
      <div style={{ position: 'absolute', left: 16, right: 16, top: 166, background: '#fff', borderRadius: 22, padding: 18, boxShadow: '0 8px 24px rgba(29,20,64,0.08)' }}>
        {FIELDS.map((f) => (
          <Field key={f.label} {...f} />
        ))}
        <div style={{ fontSize: 12.5, fontWeight: 800, color: K.inkSoft, marginBottom: 8 }}>Etapas</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {STEPS.map((s, i) => {
            const p = sp(118 + i * 5, SPRING.bouncy);
            return (
              <span key={s} style={{ transform: `scale(${p})`, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: K.navyTint, color: K.navy, fontWeight: 800, fontSize: 13.5 }}>
                <span style={{ width: 18, height: 18, borderRadius: 9, background: K.navy, color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                {s}
              </span>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: 700,
          height: 58,
          borderRadius: 18,
          background: done ? K.green : `linear-gradient(135deg, ${K.purple}, ${K.deep})`,
          color: '#fff',
          fontWeight: 900,
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transform: `scale(${press})`,
          boxShadow: `0 12px 26px ${alpha(done ? K.green : K.purple, 0.4)}`,
        }}
      >
        {done && <LineIcon name="check" size={22} color="#fff" strokeWidth={3} draw={tween(frame, TAP4 + 4, 10)} />}
        {done ? 'O.S. aberta!' : 'Abrir O.S.'}
      </div>
    </>
  );
};

// Câmera da cena 4: aproxima do formulário durante a digitação (seguindo os campos) e volta para o toque.
const useFormCamera = () => {
  const frame = useCurrentFrame();
  const z = tween(frame, 22, 22, EASE.inOut) - tween(frame, 124, 16, EASE.inOut);
  const s = 1 + 0.3 * z;
  const fx = 720;
  const fy = interpolate(frame, [30, 56, 84, 104, 120], [943, 1000, 1080, 1150, 1200], clamp);
  const tx = 560;
  const ty = 1100 + (fy - 943) * 0.6;
  const x = fx + (tx - fx) * z - fx * s;
  const y = fy + (ty - fy) * z - fy * s;
  return `translate(${x}px, ${y}px) scale(${s})`;
};

export const CenaCriar: React.FC = () => {
  const cam = useFormCamera();
  const PX = 440;
  const PY = 560;
  const PW = 560;
  const s = PW / OUTER_W;
  const tapX = PX + (15 + SCREEN_W / 2) * s;
  const tapY = PY + (15 + 729) * s;
  return (
    <Bg focus={[70, 55]}>
      <Push from={1} to={1.04} origin="60% 60%">
        <AbsoluteFill style={{ transform: cam, transformOrigin: '0 0' }}>
          <PhoneRig left={PX} top={PY} width={PW} at={4}>
            <Phone width={PW}>
              <NewOsScreen />
            </Phone>
          </PhoneRig>
          <Tap x={tapX} y={tapY} at={TAP4} />
        </AbsoluteFill>
        <Card at={TAP4 + 8} from="right" dist={260} rot={-8} float={6} style={{ left: 60, top: 1290, width: 440, display: 'flex', alignItems: 'center', gap: 22 }}>
          <IconTile icon="doc" size={96} />
          <div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -0.8 }}>O.S. #1248</div>
            <div style={{ fontSize: 25, fontWeight: 700, color: K.inkSoft }}>Aberta agora</div>
          </div>
        </Card>
        <div style={{ position: 'absolute', left: 461, top: 1392 }}>
          <CheckBadge at={TAP4 + 16} size={78} />
        </div>
        <Burst x={300} y={1360} at={TAP4 + 10} />
        <Card at={TAP4 + 30} from="left" dist={200} rot={6} float={5} seed={2} style={{ left: 60, top: 1478, width: 400, display: 'flex', alignItems: 'center', gap: 18, padding: 22 }}>
          <Avatar initials="CM" size={64} bg="#0E9CC0" />
          <div>
            <div style={{ fontSize: 27, fontWeight: 900 }}>Técnico avisado</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: K.inkSoft }}>Carlos Mendes · agora</div>
          </div>
        </Card>
      </Push>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Crie O.S. em\n**segundos**'} at={2} size={112} />
      </div>
      <Sfx name="whoosh" at={4} volume={0.3} />
      {FIELDS.map((f) =>
        new Array(Math.ceil(f.value.length / 3)).fill(0).map((_, k) => <Sfx key={f.label + k} name="type" at={f.at + k * 4} volume={0.14} />),
      )}
      {STEPS.map((_, i) => (
        <Sfx key={i} name="pop" at={118 + i * 5} volume={0.2} />
      ))}
      <Sfx name="click" at={TAP4 - 1} volume={0.55} />
      <Sfx name="chime" at={TAP4 + 6} volume={0.3} />
      <Sfx name="pop" at={TAP4 + 30} volume={0.25} />
    </Bg>
  );
};

/* ---------- Cena 5: prazo e custo em tempo real ---------- */

const COSTS = [
  { label: 'Peças', value: 'R$ 980', share: 0.533, color: K.navy },
  { label: 'Mão de obra', value: 'R$ 720', share: 0.391, color: K.cyan },
  { label: 'Deslocamento', value: 'R$ 140', share: 0.076, color: K.purple },
];

const DetailScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const prog = tween(frame, 40, 60, EASE.inOut) * 0.65;
  const pulse = 0.5 + 0.5 * Math.abs(Math.sin(frame / 8));
  return (
    <>
      <AppHeader
        title="O.S. #1248"
        sub="Oficina Ribeiro Ltda."
        right={<Pill text="Em execução" color="#fff" tint="rgba(255,255,255,0.18)" size={13} style={{ boxShadow: `inset 0 0 0 1.5px ${alpha(K.amber, 0.9)}` }} />}
      />
      <div style={{ position: 'absolute', left: 16, right: 16, top: 166, background: '#fff', borderRadius: 22, padding: 20, boxShadow: '0 8px 24px rgba(29,20,64,0.08)' }}>
        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 16 }}>Andamento</div>
        {[
          { t: 'Diagnóstico', s: 'Concluído · 14:20', state: 'ok' },
          { t: 'Execução', s: `${Math.round(prog * 100)}% concluído`, state: 'now' },
          { t: 'Teste e entrega', s: 'Previsto 18/10', state: 'next' },
        ].map((st, i) => (
          <div key={st.t} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: i < 2 ? 18 : 0 }}>
            {i < 2 && <div style={{ position: 'absolute', left: 13, top: 30, bottom: 2, width: 2, background: i === 0 ? K.green : K.line }} />}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                flexShrink: 0,
                background: st.state === 'ok' ? K.green : st.state === 'now' ? K.cyan : K.line,
                boxShadow: st.state === 'now' ? `0 0 0 ${4 + pulse * 5}px ${alpha(K.cyan, 0.25 * (1 - pulse * 0.5))}` : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {st.state === 'ok' && <LineIcon name="check" size={16} color="#fff" strokeWidth={3.2} />}
              {st.state === 'now' && <div style={{ width: 9, height: 9, borderRadius: 5, background: '#fff' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: st.state === 'next' ? K.inkSoft : K.ink }}>{st.t}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: K.inkSoft }}>{st.s}</div>
              {st.state === 'now' && (
                <div style={{ height: 8, borderRadius: 4, background: K.line, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${prog * 100}%`, borderRadius: 4, background: `linear-gradient(90deg, ${K.cyan}, ${K.cyanText})` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 452, background: '#fff', borderRadius: 22, padding: 20, boxShadow: '0 8px 24px rgba(29,20,64,0.08)' }}>
        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>Custos lançados</div>
        {COSTS.map((c, i) => {
          const p = tween(frame, 60 + i * 12, 14, EASE.out);
          return (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${K.line}`, opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: c.color }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{c.label}</span>
              <span style={{ fontSize: 15, fontWeight: 900 }}>{c.value}</span>
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 17, fontWeight: 900, opacity: tween(frame, 100, 14) }}>
          <span>Total</span>
          <span>R$ 1.840</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 20, top: 668, fontSize: 15, fontWeight: 900, opacity: tween(frame, 106, 12) }}>Fotos do serviço</div>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 698, display: 'flex', gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 96,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${alpha(K.purple, 0.55 + i * 0.1)}, ${alpha(K.cyan, 0.45 + i * 0.08)})`,
              opacity: tween(frame, 110 + i * 6, 12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LineIcon name="camera" size={30} color="rgba(255,255,255,0.9)" />
          </div>
        ))}
      </div>
    </>
  );
};

const Ring: React.FC<{ p: number; size: number }> = ({ p, size }) => {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={K.line} strokeWidth={16} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={K.cyan} strokeWidth={16} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
    </svg>
  );
};

export const CenaTempoReal: React.FC = () => {
  const frame = useCurrentFrame();
  const ring = tween(frame, 46, 50, EASE.inOut) * 0.68;
  const cost = tween(frame, 70, 50, EASE.out);
  const bars = tween(frame, 84, 40, EASE.inOut);
  const live = 0.4 + 0.6 * Math.abs(Math.sin(frame / 7));
  return (
    <Bg focus={[30, 55]}>
      <Push from={1} to={1.04} origin="40% 60%">
        <PhoneRig left={64} top={600} width={520} at={2} tiltY={8}>
          <Phone width={520}>
            <DetailScreen />
          </Phone>
        </PhoneRig>
        <Card at={36} from="right" dist={300} rot={6} float={6} style={{ left: 520, top: 650, width: 496, display: 'flex', alignItems: 'center', gap: 26, padding: 30 }}>
          <div style={{ position: 'relative', width: 170, height: 170, flexShrink: 0 }}>
            <Ring p={ring} size={170} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 50, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1 }}>{countTo('48h', tween(frame, 46, 40))}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: K.inkSoft }}>restantes</div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 19, fontWeight: 900, color: K.red, marginBottom: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 6, background: K.red, opacity: live }} />
              AO VIVO
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -0.8 }}>Prazo</div>
            <div style={{ marginTop: 10 }}>
              <Pill text="No prazo" color={K.green} tint={K.greenTint} size={22} />
            </div>
          </div>
        </Card>
        <Card at={60} from="right" dist={300} rot={-5} float={5} seed={1} style={{ left: 500, top: 980, width: 516, padding: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: K.inkSoft }}>Custo da O.S.</div>
          <div style={{ fontSize: 66, fontWeight: 900, letterSpacing: -2, margin: '2px 0 16px' }}>{countTo('R$ 1.840', cost)}</div>
          <div style={{ display: 'flex', height: 22, borderRadius: 11, overflow: 'hidden', background: K.line }}>
            {COSTS.map((c) => (
              <div key={c.label} style={{ width: `${c.share * 100 * bars}%`, background: c.color }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
            {COSTS.map((c) => (
              <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 19, fontWeight: 800, color: K.inkSoft }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <Pill text="Dentro do orçado" color={K.green} tint={K.greenTint} size={22} />
          </div>
        </Card>
        <Card at={140} from="bottom" dist={200} float={4} seed={3} style={{ left: 150, top: 1520, width: 780, display: 'flex', alignItems: 'center', gap: 20, padding: 24 }}>
          <IconTile icon="refresh" size={76} bg={alpha(K.cyan, 0.15)} color="#0A8FB3" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>Execução em 65%</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: K.inkSoft }}>Atualizado por Carlos · agora</div>
          </div>
        </Card>
      </Push>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Prazo e custo\nem **tempo real**'} at={2} size={108} />
      </div>
      <Sfx name="whoosh" at={2} volume={0.3} />
      <Sfx name="pop" at={40} volume={0.28} />
      <Sfx name="pop" at={64} volume={0.28} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Sfx key={i} name="tick" at={72 + i * 6} volume={0.18} />
      ))}
      <Sfx name="chime" at={146} volume={0.22} />
    </Bg>
  );
};

/* ---------- Cena 6: histórico do cliente e equipe conectada ---------- */

const HISTORY = [
  { n: '#1248', t: 'Manutenção preventiva', d: 'Hoje · Carlos Mendes', open: true },
  { n: '#1192', t: 'Troca de peças', d: '12/09 · Ana Lima', open: false },
  { n: '#1107', t: 'Instalação', d: '03/08 · Carlos Mendes', open: false },
  { n: '#1050', t: 'Revisão geral', d: '20/06 · João Pedro', open: false },
];
const BEAT = 106;

const TEAM = [
  { who: 'CM', bg: '#0E9CC0', t: 'Carlos atualizou a O.S. #1248', s: 'Execução em 65%' },
  { who: 'AL', bg: K.purple, t: 'Ana anexou 3 fotos', s: 'Diagnóstico concluído' },
  { who: 'ok', bg: K.green, t: 'Cliente avisado na hora', s: 'Mensagem automática enviada' },
];

export const CenaHistorico: React.FC = () => {
  const frame = useCurrentFrame();
  const dim = tween(frame, BEAT, 16, EASE.inOut);
  const line = tween(frame, 30, 50, EASE.inOut);
  return (
    <Bg focus={[40, 50]}>
      <AbsoluteFill style={{ opacity: 1 - dim * 0.82, filter: dim > 0.01 ? `blur(${dim * 5}px)` : undefined, transform: `scale(${1 - dim * 0.05})`, transformOrigin: '50% 60%' }}>
        <Card at={8} from="bottom" dist={200} style={{ left: M, right: M, top: 500, display: 'flex', alignItems: 'center', gap: 26, padding: 30 }}>
          <Avatar initials="OR" size={116} bg={K.purple} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -0.8 }}>Oficina Ribeiro Ltda.</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: K.inkSoft, marginTop: 4 }}>Cliente desde 2021 · 14 O.S.</div>
          </div>
        </Card>
        <div style={{ position: 'absolute', left: M + 38, top: 760, width: 6, height: 760 * line, borderRadius: 3, background: alpha(K.white, 0.35) }} />
        {HISTORY.map((h, i) => (
          <React.Fragment key={h.n}>
            <div
              style={{
                position: 'absolute',
                left: M + 26,
                top: 822 + i * 190,
                width: 30,
                height: 30,
                borderRadius: 15,
                background: h.open ? K.amber : K.green,
                border: `5px solid ${K.white}`,
                boxSizing: 'border-box',
                transform: `scale(${tween(frame, 34 + i * 12, 10)})`,
              }}
            />
            <Card at={30 + i * 12} from="right" dist={260} pad={0} style={{ left: M + 90, right: M, top: 770 + i * 190, height: 150, display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px' }}>
              <IconTile icon={h.open ? 'clock' : 'check'} size={78} bg={h.open ? K.amberTint : K.greenTint} color={h.open ? '#C98400' : K.green} stroke={2.6} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 31, fontWeight: 900, whiteSpace: 'nowrap', letterSpacing: -0.3 }}>{h.t}</div>
                <div style={{ fontSize: 23, fontWeight: 700, color: K.inkSoft, marginTop: 2, whiteSpace: 'nowrap' }}>
                  O.S. {h.n} · {h.d}
                </div>
              </div>
              <Pill text={h.open ? 'Em execução' : 'Fechada'} color={h.open ? '#B87700' : K.green} tint={h.open ? K.amberTint : K.greenTint} size={20} />
            </Card>
          </React.Fragment>
        ))}
      </AbsoluteFill>
      {TEAM.map((m, i) => (
        <Card key={m.t} at={BEAT + 14 + i * 16} from="right" dist={500} rot={4} float={5} seed={i} style={{ left: M, right: M, top: 640 + i * 200, display: 'flex', alignItems: 'center', gap: 24, padding: 28 }}>
          {m.who === 'ok' ? <CheckBadge at={BEAT + 22 + i * 16} size={84} style={{ border: 'none', boxShadow: 'none' }} /> : <Avatar initials={m.who} size={84} bg={m.bg} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 33, fontWeight: 900, letterSpacing: -0.4 }}>{m.t}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: K.inkSoft, marginTop: 2 }}>{m.s}</div>
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: K.inkSoft, alignSelf: 'flex-start', marginTop: 6 }}>agora</div>
        </Card>
      ))}
      <Fade at={BEAT + 66} style={{ position: 'absolute', left: M, right: M, top: 1290, display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ display: 'flex' }}>
          {[
            ['CM', '#0E9CC0'],
            ['AL', K.purple],
            ['JP', '#E2557A'],
            ['RS', '#3B6FD8'],
          ].map(([ini, bg], i) => (
            <div key={ini} style={{ marginLeft: i ? -22 : 0 }}>
              <Avatar initials={ini} size={86} bg={bg} ring={K.bg2} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2 }}>
          Toda a equipe vendo
          <br />a <span style={{ color: K.cyanText }}>mesma informação</span>
        </div>
      </Fade>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Histórico de\ncada **cliente**'} at={2} size={108} out={BEAT - 8} />
      </div>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Equipe toda\n**conectada**'} at={BEAT + 6} size={108} />
      </div>
      <Sfx name="whoosh" at={2} volume={0.25} />
      {HISTORY.map((_, i) => (
        <Sfx key={i} name="pop" at={34 + i * 12} volume={0.18} />
      ))}
      <Sfx name="whoosh" at={BEAT} volume={0.3} />
      {TEAM.map((_, i) => (
        <Sfx key={i} name="pop" at={BEAT + 18 + i * 16} volume={0.3} />
      ))}
    </Bg>
  );
};
