// Perfis de identidade visual: cada marca é um .json em <biblioteca>/Marcas. A Frenty sempre existe.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { FRENTY, normalizeBrand, type Brand } from '../src/brand';
import { readBrandFile } from '../src/brand-file';
import { slugify } from './slug';

const CONFIG = '_config.json';

export class BrandStore {
  readonly dir: string;

  constructor(libraryRoot: string) {
    this.dir = path.join(libraryRoot, 'Marcas');
    fs.mkdirSync(this.dir, { recursive: true });
    if (!fs.existsSync(this.file(FRENTY.id))) this.write(FRENTY);
    else this.upgradeFrenty();
  }

  // Perfil Frenty ainda com as cores e fontes antigas (do manual "aprox.") e nunca editado: passa para a identidade oficial.
  private upgradeFrenty() {
    try {
      const b = this.load(this.file(FRENTY.id));
      const c = b.cores;
      const antigo =
        [c.primaria, c.destaque, c.secundaria, c.fundo, c.texto].join().toUpperCase() === '#6C5CE7,#00D26A,#00A8FF,#F8F9FA,#2D3436' &&
        b.fontes.titulos === 'Plus Jakarta Sans' &&
        b.fontes.texto === 'Plus Jakarta Sans';
      if (antigo) this.write({ ...b, cores: { ...FRENTY.cores }, fontes: { ...FRENTY.fontes } });
    } catch {
      // perfil ilegível: fica como está (a lista já ignora arquivos com erro)
    }
  }

  private file(id: string) {
    const f = path.join(this.dir, `${id}.json`);
    if (!f.startsWith(this.dir + path.sep)) throw new Error('Marca inválida.');
    return f;
  }

  private write(b: Brand) {
    fs.writeFileSync(this.file(b.id), JSON.stringify(b, null, 2));
  }

  // O id vem sempre do nome do arquivo, mesmo que o .json tenha sido renomeado à mão.
  private load(file: string): Brand {
    return { ...readBrandFile(file), id: path.basename(file, '.json') };
  }

  list(): Brand[] {
    return fs
      .readdirSync(this.dir)
      .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
      .map((f) => {
        try {
          return this.load(path.join(this.dir, f));
        } catch {
          return null;
        }
      })
      .filter((b): b is Brand => b !== null)
      .sort((a, b) => (a.id === FRENTY.id ? -1 : b.id === FRENTY.id ? 1 : a.nome.localeCompare(b.nome, 'pt-BR')));
  }

  get(id: string): Brand | null {
    return fs.existsSync(this.file(id)) ? this.load(this.file(id)) : null;
  }

  get defaultId(): string {
    try {
      const id = JSON.parse(fs.readFileSync(path.join(this.dir, CONFIG), 'utf8')).padrao;
      return typeof id === 'string' && fs.existsSync(this.file(id)) ? id : FRENTY.id;
    } catch {
      return FRENTY.id;
    }
  }

  setDefault(id: string) {
    if (!this.get(id)) throw new Error('Marca não encontrada.');
    fs.writeFileSync(path.join(this.dir, CONFIG), JSON.stringify({ padrao: id }, null, 2));
  }

  // Marca usada por um roteiro: a do "marca:" no topo do .md, ou a padrão.
  resolve(ref?: string): Brand {
    const id = ref ? slugify(ref) : undefined;
    return (id && this.get(id)) || this.get(this.defaultId) || FRENTY;
  }

  save(input: Brand): Brand {
    const b = normalizeBrand(input);
    if (!this.get(b.id)) throw new Error('Marca não encontrada.');
    this.write(b);
    return b;
  }

  private newId(name: string) {
    let id = slugify(name);
    while (fs.existsSync(this.file(id))) id = `${slugify(name)}-${crypto.randomBytes(2).toString('hex')}`;
    return id;
  }

  create(fromId?: string): Brand {
    const base = fromId ? this.get(fromId) : null;
    const nome = base ? `${base.nome} (cópia)` : 'Nova marca';
    const b = normalizeBrand(
      base
        ? { ...base, id: this.newId(nome), nome }
        : {
            ...FRENTY,
            id: this.newId(nome),
            nome,
            slogan: '',
            site: '',
            logo: { texto: 'sua marca', simbolo: false },
            cores: { ...FRENTY.cores, fundoEscuro: undefined }, // escuro automático, acompanha a primária
          },
    );
    this.write(b);
    return b;
  }

  // Traz um perfil exportado de outro computador. Mantém o id se estiver livre.
  importFile(file: string): Brand {
    const b = readBrandFile(file);
    const id = b.id && b.id !== FRENTY.id && !this.get(slugify(b.id)) ? slugify(b.id) : this.newId(b.nome || 'marca');
    const out = normalizeBrand({ ...b, id });
    this.write(out);
    return out;
  }

  remove(id: string) {
    if (id === FRENTY.id) throw new Error('A marca Frenty não pode ser excluída. Você pode restaurar o padrão dela.');
    if (this.defaultId === id) this.setDefault(FRENTY.id);
    fs.rmSync(this.file(id), { force: true });
  }

  resetFrenty(): Brand {
    this.write(FRENTY);
    return FRENTY;
  }
}
