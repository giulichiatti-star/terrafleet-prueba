#!/bin/bash
# Publica TerraFleet a GitHub Pages — pasaje verificado (adaptado del kit de deploy):
#   1. compuerta de sintaxis (node --check sobre el JS del archivo)
#   2. estampa la versión (meta app-version + version.txt) — alimenta el aviso
#      de "hay una versión nueva" en los navegadores de los usuarios
#   3. commitea y pushea SOLO lo que pasó la compuerta
# Uso:  bash publicar.sh "mensaje del commit"
set -euo pipefail

SRC="/Users/giuliannachiatti/Documents/Zcode negocios/terrafleet-prueba-real.html"
PUB=/tmp/terrafleet-pub
MSG="${1:-actualización}"

# 1) compuerta de sintaxis: si falla, no se publica nada
node --check <(sed -n '/<script>/,/<\/script>/p' "$SRC" | sed '1d;$d')

# 2) estampar versión (timestamp) en la copia que se publica
VER="$(date +%Y.%m.%d-%H%M)"
python3 - "$SRC" "$PUB/index.html" "$PUB/version.txt" "$VER" << 'EOF'
import sys, io, re
src, dst, vtxt, ver = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
s = io.open(src, encoding='utf-8').read()
s2, n = re.subn(r'<meta name="app-version" content="[^"]*"\s*/>',
                '<meta name="app-version" content="%s" />' % ver, s, count=1)
assert n == 1, 'no encontré <meta name="app-version"> en el archivo fuente'
io.open(dst, 'w', encoding='utf-8').write(s2)
io.open(vtxt, 'w', encoding='utf-8').write(ver)
print('versión publicada:', ver)
EOF

# 3) commit + push (lo que se probó es lo que queda publicado)
cd "$PUB"
git add index.html version.txt
git commit -m "$MSG (v$VER)"
git push origin main
echo ""
echo "Publicado v$VER — el build de Pages tarda ~1-7 min."
echo "Verificar: curl -s https://giulichiatti-star.github.io/terrafleet-prueba/version.txt"
