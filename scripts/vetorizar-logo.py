# Vetoriza a logo oficial Frenty (PNG) e gera src/components/frenty-logo-data.ts e os SVGs em marcas/frenty-logo/.
# O símbolo vira geometria pura (disco + F de pontos, medidos no PNG); o logotipo "frenty" e a ponta ciana do "y"
# são traçados com potrace.
#
# Uso: python3 scripts/vetorizar-logo.py [marcas/frenty-logo/frenty-logo-oficial.png]
# Requer: python3 -m pip install potracer pillow numpy
import math
import os
import sys
from collections import Counter

import numpy as np
import potrace
from PIL import Image, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'marcas', 'frenty-logo', 'frenty-logo-oficial.png')
SAIDA_TS = os.path.join(RAIZ, 'src', 'components', 'frenty-logo-data.ts')
SAIDA_SVG = os.path.join(RAIZ, 'marcas', 'frenty-logo')
ROXO_ESCURO = '#2A1259'  # disco e letras da versão para fundo claro
S = 6  # supersampling para curvas suaves
CORTE_SIMBOLO = 270  # no PNG original, tudo à esquerda disto é o símbolo

im = Image.open(SRC).convert('RGBA')
W, H = im.size
orig = np.array(im)
opaco = orig[..., 3] > 127
eh_ciano = opaco & (orig[..., 0] < 122.5)


def cor_mais_comum(mask):
    r, g, b = Counter(map(tuple, orig[mask][:, :3])).most_common(1)[0][0]
    return '#%02X%02X%02X' % (r, g, b)


CIANO = cor_mais_comum(eh_ciano)
CLARO = cor_mais_comum(opaco & ~eh_ciano)

# Suaviza os degraus do PNG de baixa resolução antes de limiarizar (borda no meio do anti-serrilhado).
up = im.resize((W * S, H * S), Image.BICUBIC)
big = np.stack([np.array(c.filter(ImageFilter.GaussianBlur(S * 0.7))) for c in up.split()], -1).astype(float)
solido = big[..., 3] > 127
ciano = solido & (big[..., 0] < 122.5)
corte = CORTE_SIMBOLO * S


def componentes(mask):
    # Rotulagem 4-conexa (busca em profundidade) para separar os pontos do F.
    h, w = mask.shape
    lab = np.zeros((h, w), int)
    comps = []
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not lab[y, x]:
                lab[y, x] = len(comps) + 1
                pilha, pts = [(y, x)], []
                while pilha:
                    cy, cx = pilha.pop()
                    pts.append((cy, cx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = len(comps) + 1
                            pilha.append((ny, nx))
                comps.append(np.array(pts))
    return comps


# ---- Símbolo: disco pela área (círculo equivalente) e centro de massa ----
ys, xs = np.nonzero(solido[:, :corte])
disco = {'cx': round(float(xs.mean() + 0.5) / S, 2), 'cy': round(float(ys.mean() + 0.5) / S, 2), 'r': round(math.sqrt(len(xs) / S / S / math.pi), 2)}

# Pontos e barra do F: caixas achadas na resolução original e medidas na ampliada.
partes = []
for comp in componentes(eh_ciano[:, :CORTE_SIMBOLO]):
    (y0, x0), (y1, x1) = comp.min(0), comp.max(0)
    sub = ciano[y0 * S - S:(y1 + 2) * S, x0 * S - S:(x1 + 2) * S]
    yy, xx = np.nonzero(sub)
    yy, xx = yy + y0 * S - S, xx + x0 * S - S
    w, h = (xx.max() - xx.min() + 1) / S, (yy.max() - yy.min() + 1) / S
    partes.append({'cx': (xx.mean() + 0.5) / S, 'cy': (yy.mean() + 0.5) / S, 'w': w, 'h': h, 'r': math.sqrt(len(yy) / S / S / math.pi), 'barra': w / h >= 1.4})
barras = [p for p in partes if p['barra']]
pontos = [p for p in partes if not p['barra']]
assert len(barras) == 1 and len(pontos) == 4, 'esperava 4 pontos e 1 barra no símbolo'
barra = barras[0]
x_haste = min(p['cx'] for p in pontos)
haste = sorted((p for p in pontos if abs(p['cx'] - x_haste) < 5), key=lambda p: p['cy'])
meio = next(p for p in pontos if abs(p['cx'] - x_haste) >= 5)
raio_ponto = round((sum(p['r'] for p in pontos) + barra['h'] / 2) / 5, 2)


# ---- Logotipo: potrace na máscara sólida (cinza + ciano) e no ciano à parte ----
def tracar(mask, x_off):
    bm = potrace.Bitmap(~mask)  # potracer trata True como fundo
    curvas = []
    for curva in bm.trace(turdsize=20 * S, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.15, opticurve=True, opttolerance=0.8):
        f = lambda p: ((p.x + x_off) / S, p.y / S)
        ini = f(curva.start_point)
        d, pts = 'M%.2f %.2f' % ini, [ini]
        for seg in curva.segments:
            if seg.is_corner:
                c, e = f(seg.c), f(seg.end_point)
                d += 'L%.2f %.2fL%.2f %.2f' % (c + e)
                pts += [c, e]
            else:
                c1, c2, e = f(seg.c1), f(seg.c2), f(seg.end_point)
                d += 'C%.2f %.2f %.2f %.2f %.2f %.2f' % (c1 + c2 + e)
                pts += [c1, c2, e]
        curvas.append({'d': d + 'Z', 'x0': min(p[0] for p in pts), 'x1': max(p[0] for p in pts), 'y0': min(p[1] for p in pts), 'y1': max(p[1] for p in pts)})
    return curvas


# Agrupa contornos por letra: um contorno dentro da caixa de outro é furo (ex.: o "e").
letras = []
for c in sorted(tracar(solido[:, corte:], corte), key=lambda c: (c['x1'] - c['x0']) * (c['y1'] - c['y0']), reverse=True):
    dono = next((L for L in letras if c['x0'] >= L['x0'] - 0.5 and c['x1'] <= L['x1'] + 0.5 and c['y0'] >= L['y0'] - 0.5 and c['y1'] <= L['y1'] + 0.5), None)
    if dono:
        dono['d'] += c['d']
    else:
        letras.append(dict(c))
letras.sort(key=lambda L: L['x0'])
assert len(letras) == 6, 'esperava as 6 letras de "frenty", achei %d' % len(letras)
ponta = ''.join(c['d'] for c in tracar(ciano[:, corte:], corte))

vb = {
    'x': math.floor((disco['cx'] - disco['r']) * 10) / 10,
    'y': math.floor((disco['cy'] - disco['r']) * 10) / 10,
}
vb['w'] = round(math.ceil(max(L['x1'] for L in letras)) - vb['x'], 1)
vb['h'] = round(math.ceil(max(disco['cy'] + disco['r'], max(L['y1'] for L in letras))) - vb['y'], 1)

num = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
pt = lambda p: '{ cx: %s, cy: %s }' % (num(p['cx']), num(p['cy']))
ts = [
    '// Logo oficial Frenty vetorizada a partir do PNG enviado pelo Lucas (13/10/2026).',
    '// Coordenadas no espaço do arquivo original (%d×%d). O símbolo é geometria pura (disco + F de pontos);' % (W, H),
    '// o logotipo "frenty" e a ponta ciana do "y" foram traçados com potrace.',
    '// Gerado por scripts/vetorizar-logo.py; não edite à mão.',
    '',
    'export const LOGO_VIEWBOX = { x: %s, y: %s, w: %s, h: %s };' % (num(vb['x']), num(vb['y']), num(vb['w']), num(vb['h'])),
    "export const LOGO_CIANO = '%s';" % CIANO,
    "export const LOGO_CLARO = '%s';" % CLARO,
    '',
    'export const DISCO = { cx: %s, cy: %s, r: %s };' % (num(disco['cx']), num(disco['cy']), num(disco['r'])),
    'export const PONTO_R = %s;' % num(raio_ponto),
    '// Haste do F (de cima para baixo), ponto do meio e barra de cima.',
    'export const HASTE = [%s];' % ', '.join(pt(p) for p in haste),
    'export const PONTO_MEIO = %s;' % pt(meio),
    'export const BARRA = { x: %s, y: %s, w: %s, h: %s };' % (num(barra['cx'] - barra['w'] / 2), num(barra['cy'] - barra['h'] / 2), num(barra['w']), num(barra['h'])),
    '',
    'export const LETRAS: { letra: string; x0: number; x1: number; y0: number; y1: number; d: string }[] = [',
    *["  { letra: '%s', x0: %s, x1: %s, y0: %s, y1: %s, d: '%s' }," % (ch, num(L['x0']), num(L['x1']), num(L['y0']), num(L['y1']), L['d']) for ch, L in zip('frenty', letras)],
    '];',
    "export const PONTA_Y = '%s';" % ponta,
    '',
]
open(SAIDA_TS, 'w').write('\n'.join(ts))


def svg(cor, simbolo=True, logotipo=True, escala=2):
    x0, y0 = vb['x'], vb['y']
    x1, y1 = x0 + vb['w'], y0 + vb['h']
    if not logotipo:
        x1 = disco['cx'] + disco['r'] + 0.5
    s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s %s %s %s" width="%d" height="%d">' % (num(x0), num(y0), num(x1 - x0), num(y1 - y0), round((x1 - x0) * escala), round((y1 - y0) * escala))]
    if simbolo:
        s.append('<circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (num(disco['cx']), num(disco['cy']), num(disco['r']), cor))
        for p in haste + [meio]:
            s.append('<circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (num(p['cx']), num(p['cy']), num(raio_ponto), CIANO))
        s.append('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s"/>' % (num(barra['cx'] - barra['w'] / 2), num(barra['cy'] - barra['h'] / 2), num(barra['w']), num(barra['h']), num(barra['h'] / 2), CIANO))
    if logotipo:
        s.append('<path fill="%s" fill-rule="evenodd" d="%s"/>' % (cor, ''.join(L['d'] for L in letras)))
        s.append('<path fill="%s" d="%s"/>' % (CIANO, ponta))
    s.append('</svg>\n')
    return ''.join(s)


os.makedirs(SAIDA_SVG, exist_ok=True)
for nome, conteudo in {
    'frenty-logo-fundo-escuro.svg': svg(CLARO),
    'frenty-logo-fundo-claro.svg': svg(ROXO_ESCURO),
    'frenty-simbolo-fundo-escuro.svg': svg(CLARO, logotipo=False),
    'frenty-simbolo-fundo-claro.svg': svg(ROXO_ESCURO, logotipo=False),
}.items():
    open(os.path.join(SAIDA_SVG, nome), 'w').write(conteudo)
print('ok:', os.path.relpath(SAIDA_TS, RAIZ), '+ 4 SVGs em', os.path.relpath(SAIDA_SVG, RAIZ), '| ciano', CIANO, '| disco', disco)
