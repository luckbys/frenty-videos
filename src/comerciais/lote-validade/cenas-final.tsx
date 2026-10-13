// Cenas 7 a 10 do comercial de Lote e Validade: o módulo como parceiro (benefícios ilustrados),
// a integração com o ERP, a chamada para a demonstração e o encerramento (os dois últimos reaproveitam
// as cenas do comercial do Módulo de O.S. com os textos deste módulo).
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { alpha } from '../../color';
import { EASE, Sfx, tween } from '../../motion/core';
import { CenaChamada, CenaIntegracao } from '../modulo-os/cenas-final';
import { Etiqueta, IL, MiniPalco, Palco, Pop, useMola } from '../modulo-os/ilustracoes';
import { K, M } from '../modulo-os/tokens';
import { Bg, CheckBadge, Title } from '../modulo-os/ui';
import { Cofrinho, Confianca, Escudo } from './ilustracoes';

/* ---------- Cena 7: benefícios (mais que um software, um parceiro) ---------- */

const CofrinhoEnchendo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <g>
      <g transform="translate(-6 28)">
        <Cofrinho s={104} />
      </g>
      {[0, 1].map((k) => {
        const t = ((frame + k * 22) % 44) / 44;
        return (
          <g key={k} transform={`translate(${-8 + k * 10} ${-110 + t * 64})`} opacity={Math.min(1, t * 5, (1 - t) * 6)}>
            <ellipse rx={24} ry={24} fill="url(#il-ouro)" stroke={IL.ouroEscuro} strokeWidth={3} transform={`scale(${0.35 + 0.65 * Math.abs(Math.cos(t * 6))} 1)`} />
          </g>
        );
      })}
    </g>
  );
};

const EscudoConforme: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <g transform="translate(0 -6)">
      <Escudo r={78} draw={tween(frame, 66, 14)} />
    </g>
  );
};

const CoracaoConfianca: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.min(5, Math.max(0, Math.floor((frame - 86) / 4)));
  const bate = 1 + 0.05 * Math.max(0, Math.sin(frame / 5));
  return (
    <g transform={`translate(0 6) scale(${bate})`}>
      <Confianca r={62} estrelas={n} />
    </g>
  );
};

const BENEFICIOS = [
  { title: 'Menos desperdício', sub: 'Mais saúde financeira', Il: CofrinhoEnchendo },
  { title: 'Conformidade total', sub: 'Exigências legais e sanitárias', Il: EscudoConforme },
  { title: 'Mais confiança', sub: 'Reputação que fideliza clientes', Il: CoracaoConfianca },
];

export const CenaBeneficios: React.FC = () => {
  const frame = useCurrentFrame();
  const mola = useMola();
  return (
    <Bg focus={[45, 55]}>
      {BENEFICIOS.map((b, i) => {
        const at = 30 + i * 24;
        const pop = mola(at, { damping: 11, stiffness: 150, mass: 0.7 });
        const txt = tween(frame, at + 4, 16, EASE.out);
        return (
          <div key={b.title} style={{ position: 'absolute', left: M, right: M, top: 600 + i * 300, height: 240 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 240, height: 240, transform: `scale(${pop}) rotate(${(1 - Math.min(1, pop)) * -24}deg)` }}>
              <MiniPalco size={240}>
                <circle r={114} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" strokeWidth={3} />
                <b.Il />
              </MiniPalco>
            </div>
            <div style={{ position: 'absolute', left: 278, right: 90, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: txt, transform: `translateX(${(1 - txt) * 60}px)` }}>
              <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1.05 }}>{b.title}</div>
              <div style={{ fontSize: 31, fontWeight: 700, color: alpha(K.white, 0.75), marginTop: 6 }}>{b.sub}</div>
            </div>
            <div style={{ position: 'absolute', right: 0, top: 89 }}>
              <CheckBadge at={at + 14} size={62} style={{ border: `5px solid ${alpha(K.white, 0.9)}` }} />
            </div>
          </div>
        );
      })}
      <Palco>
        {frame >= 128 && (
          <Pop at={128} x={540} y={1620} rot={0} dy={30}>
            <Etiqueta texto="Reduza custos e evite multas" glifo="check" cor={IL.ciano} s={40} w={680} />
          </Pop>
        )}
      </Palco>
      <div style={{ position: 'absolute', left: M, top: 170 }}>
        <Title text={'Seu parceiro\n**estratégico**'} at={2} size={116} />
      </div>
      <Sfx name="whoosh" at={2} volume={0.25} />
      {BENEFICIOS.map((_, i) => (
        <React.Fragment key={i}>
          <Sfx name="pop" at={30 + i * 24 + 2} volume={0.28} />
          <Sfx name="tick" at={30 + i * 24 + 16} volume={0.3} />
        </React.Fragment>
      ))}
      <Sfx name="chime" at={130} volume={0.26} />
    </Bg>
  );
};

/* ---------- Cenas 8 a 10 ---------- */

export const CenaIntegracaoLote: React.FC = () => (
  <CenaIntegracao
    titulo={'Tudo conectado\nao seu **ERP**'}
    tamanhoTitulo={110}
    nos={[
      { icon: 'layers', t: 'ERP', a: -142 },
      { icon: 'cart', t: 'Compras', a: -38 },
      { icon: 'box', t: 'Estoque', a: 142 },
      { icon: 'tag', t: 'Vendas', a: 38 },
    ]}
    selos={['Informação completa', 'Gestão otimizada']}
  />
);

export const CenaChamadaLote: React.FC = () => (
  <CenaChamada
    faixas={[
      ['Menos desperdício', 'Conformidade', 'Rastreabilidade', 'Estoque em tempo real', 'Alertas automáticos'],
      ['Histórico para auditoria', 'Controle de lotes', 'Validade sob controle', 'Integração com ERP', 'Compras e vendas'],
    ]}
  />
);
