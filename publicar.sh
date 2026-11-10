#!/bin/bash
# Publica TerraFleet a GitHub Pages desde ESTE repo (ya no depende de otra carpeta).
#   1. compuerta de sintaxis: el JavaScript de index.html y nube.js
#   2. estampa la versión (meta app-version, nube.js?v=, version.txt): alimenta el
#      aviso de "hay una versión nueva" en los navegadores de los usuarios
#   3. commitea y pushea
# Antes de publicar cambios que toquen datos, correr las pruebas:
#   bash supabase/tests/nube_test.sh   y   bash supabase/tests/nube_test.sh ui
# Uso:  bash publicar.sh "mensaje del commit" ["texto extra opcional"]
set -euo pipefail
cd "$(dirname "$0")"
MSG="${1:-actualización}"

node --check <(sed -n '/^<script>$/,/^<\/script>/p' index.html | sed '1d;$d')
node --check nube.js

VER="$(date +%Y.%m.%d-%H%M)"
python3 - "$VER" << 'PYEOF'
import sys, io, re
ver = sys.argv[1]
s = io.open('index.html', encoding='utf-8').read()
s, n = re.subn(r'<meta name="app-version" content="[^"]*"\s*/>', '<meta name="app-version" content="%s" />' % ver, s, count=1)
assert n == 1, 'no encontré <meta name="app-version">'
s, n = re.subn(r'nube\.js\?v=[^"]*"', 'nube.js?v=%s"' % ver, s, count=1)
assert n == 1, 'no encontré nube.js?v='
io.open('index.html', 'w', encoding='utf-8').write(s)
io.open('version.txt', 'w', encoding='utf-8').write(ver)
print('versión:', ver)
PYEOF

git add -A
git commit -m "$MSG (v$VER)" ${2:+-m "$2"}
git push origin main
echo ""
echo "Publicado v$VER — el build de Pages tarda ~1-7 min."
echo "Verificar: curl -s https://giulichiatti-star.github.io/terrafleet-prueba/version.txt"
