#!/usr/bin/env bash
# Gera o instalador do Windows (FrentyVideos-Setup-<versão>.exe) a partir do Linux.
# Precisa de: node/npm, curl, unzip, makensis (pacote nsis) e, no Linux, wine64 (só para gravar ícone e versão no .exe).
# Também roda no Windows (Git Bash), que é como o GitHub Actions gera as versões publicadas.
# Uso: bash scripts/empacotar-windows.sh   → saída em ../winbuild/dist/
set -euo pipefail
# pwd -W: no Git Bash do Windows, caminho no formato D:/... que o node também entende.
ROOT="$(cd "$(dirname "$0")/.." && (pwd -W 2>/dev/null || pwd))"
W="${WINBUILD:-$ROOT/../winbuild}"
ELECTRON=$(node -p "require('$ROOT/node_modules/electron/package.json').version")
CHROME=$(node -p "require('$ROOT/node_modules/@remotion/renderer/dist/browser/get-chrome-download-url.js').TESTED_VERSION")
mkdir -p "$W" && cd "$W"

# Electron e o Chrome que o Remotion usa, versões Windows (baixados uma vez).
[ -f electron-win.zip ] || curl -sSL -o electron-win.zip "https://github.com/electron/electron/releases/download/v$ELECTRON/electron-v$ELECTRON-win32-x64.zip"
[ -f chs-win.zip ] || curl -sSL -o chs-win.zip "https://storage.googleapis.com/chrome-for-testing-public/$CHROME/win64/chrome-headless-shell-win64.zip"
rm -rf electron-dist chrome && mkdir electron-dist && unzip -q electron-win.zip -d electron-dist && unzip -q chs-win.zip -d chrome

# App com dependências de produção do Windows (ffmpeg/compositor e esbuild para win32).
(cd "$ROOT" && node scripts/build-desktop.mjs)
rm -rf app && mkdir app
cp -r "$ROOT"/{dist-desktop,src,public,exemplos,marcas,build} app/
node -e "
const p=require('$ROOT/package.json');
require('fs').writeFileSync('app/package.json', JSON.stringify({name:'frenty-videos',productName:'Frenty Videos',version:p.version,description:'Frenty Vídeos',author:'Frenty',main:'dist-desktop/main.js',atualizacoes:p.atualizacoes,dependencies:p.dependencies},null,2));"
cp "$ROOT/package-lock.json" app/
(cd app && npm install --omit=dev --os=win32 --cpu=x64 --no-audit --no-fund)

# Pasta do programa (ícone e versão gravados no .exe) e instalador.
[ -d tools/node_modules/electron-builder ] || (mkdir -p tools && cd tools && npm init -y >/dev/null && npm install electron-builder@26 --no-audit --no-fund)
cp "$ROOT/build/electron-builder.json" builder.json
sed -i "s/\"electronVersion\": \"[^\"]*\"/\"electronVersion\": \"$ELECTRON\"/" builder.json
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) ;;
  *) command -v wine >/dev/null || ln -sf /usr/lib/wine/wine64 /usr/local/bin/wine ;;
esac
rm -rf dist && (cd tools && WINEDEBUG=-all npx electron-builder --win dir --x64 --projectDir "$W" --config "$W/builder.json")
rm -f dist/win-unpacked/resources/default_app.asar dist/win-unpacked/resources/app-update.yml
VERSION=$(node -p "require('$ROOT/package.json').version")
sed "s/!define VERSION \"[^\"]*\"/!define VERSION \"$VERSION\"/" "$ROOT/build/installer.nsi" > installer.nsi
makensis -V2 installer.nsi
ls -la dist/*.exe
