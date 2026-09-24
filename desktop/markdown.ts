// Utilitários de texto do roteiro usados pela interface e pelo processo principal.

// Define (ou remove, com value vazio) uma chave do cabeçalho --- do roteiro.
export function setFrontmatter(markdown: string, key: string, value: string | undefined) {
  const line = new RegExp(`^${key}\\s*:.*$`, 'm');
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return value ? `---\n${key}: ${value}\n---\n\n${markdown}` : markdown;
  let body = fm[1];
  if (!value) body = body.replace(new RegExp(`^${key}\\s*:.*(\\r?\\n|$)`, 'm'), '').replace(/\s+$/, '');
  else body = line.test(body) ? body.replace(line, `${key}: ${value}`) : `${body}\n${key}: ${value}`;
  if (!body.trim()) return markdown.replace(fm[0], '').replace(/^\s+/, '');
  return markdown.replace(fm[0], `---\n${body}\n---`);
}

export const setFormat = (markdown: string, format: string) => setFrontmatter(markdown, 'formato', format);

// Quantos títulos "## " existem até a posição do cursor (0 = ainda na abertura).
export function sectionAt(markdown: string, cursor: number) {
  return (markdown.slice(0, cursor).match(/^##\s/gm) ?? []).length;
}
