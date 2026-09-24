#!/bin/bash
cd "$(dirname "$0")"
[ -d node_modules ] || npm install || exit 1
npm run app
