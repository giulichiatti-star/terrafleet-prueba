#!/bin/bash
# Publica TerraFleet a GitHub Pages desde ESTE repo (ya no depende de otra carpeta).
#   1. compuertas: sintaxis (nube.js, js/*.js) y pruebas contra la base (69 pruebas)
#   2. estampa la versión (meta app-version, ?v= de css/js, version.txt): alimenta el
#      aviso de "hay una versión nueva" en los navegadores de los usuarios
#   3. commitea y pushea
# Uso:  bash publicar.sh "mensaje del commit" ["texto extra opcional"]
set -euo pipefail
cd "$(dirname "$0")"
MSG="${1:-actualización}"

for f in nube.js js/*.js; do node --check "$f"; done

# compuerta de pruebas: si algo falla, no se publica (saltear solo con SIN_PRUEBAS=1)
if [ -z "${SIN_PRUEBAS:-}" ]; then
  bash supabase/tests/nube_test.sh    | tee /dev/stderr | grep -q "Fallos: ninguno"
  bash supabase/tests/nube_test.sh ui | tee /dev/stderr | grep -q "Fallos: ninguno"
fi

VER="$(date +%Y.%m.%d-%H%M)"
python3 - "$VER" << 'PYEOF'
import sys, io, re
ver = sys.argv[1]
s = io.open('index.html', encoding='utf-8').read()
s, n = re.subn(r'<meta name="app-version" content="[^"]*"\s*/>', '<meta name="app-version" content="%s" />' % ver, s, count=1)
assert n == 1, 'no encontré <meta name="app-version">'
s, n = re.subn(r'\?v=[^"]*"', '?v=%s"' % ver, s)
assert n >= 3, 'no encontré los ?v= de css/js'
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
