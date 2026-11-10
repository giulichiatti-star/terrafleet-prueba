# Protocolo de trabajo TerraFleet

Adaptado del kit de skills de Walter (2026/10/14) a la realidad de TerraFleet:
app de un solo archivo HTML, publicada estática en GitHub Pages, datos en
localStorage (fase nube con Supabase en camino). Solo lo que sirve acá.

## 1. Publicar (pasaje verificado)

```
bash publicar.sh "mensaje del cambio"
```

El script: (1) valida sintaxis JS y si falla **no publica**; (2) estampa la
versión en `<meta name="app-version">` y en `version.txt` — que alimenta el
aviso automático de "hay una versión nueva" en los navegadores de los usuarios
(sin recarga sola, sin perder datos a medio cargar, no descartable); (3) commitea
y pushea. Verificar el build con `curl .../version.txt` (~1-7 min).

Nunca publicar a mano con cp + git: se pierde la compuerta y el estampado de versión.

## 2. Estándar de pruebas (antes de dar algo por probado)

- **Números contra valores esperados calculados a mano** (`resultado === esperado`),
  nunca "a ojo" por captura.
- **Lógica que reacciona al teclado** (firmas, importes): simular tecleo real
  carácter por carácter, no fijar el valor final de una vez.
- **Casos límite a propósito**: cantidades que cruzan el separador de miles,
  horas 0 / vacías / undefined, máquinas sin plantilla, OT anulada.
- Una prueba superficial que no encuentra el bug es peor que no probar.

## 3. Pantallas que cuadran (antes de publicar cualquier pantalla)

- Barrido de anchos: **360, 390, 768, 1024, 1280** — sin scroll horizontal
  (`document.documentElement.scrollWidth <= window.innerWidth + 2`).
- Mirar una captura con datos reales en escritorio **y** en móvil, de verdad.
- Ningún campo traba si el usuario puede necesitarlo después; siempre hay salida.
- En móvil: tarjetas, no filas de muchas columnas.
- Si se **rehace una pantalla existente**: armar antes la lista de todo lo que
  ofrecía la versión anterior (cada campo, botón, caso de negocio) y probar
  ítem por ítem — las pruebas solo cuidan lo que alguien les enseñó a cuidar.

## 4. Protocolo de cambios sin perder datos del usuario

- La estructura de datos solo **agrega** campos; nunca renombra ni borra sin
  migración (ver `migrate()`).
- Toda actualización debe correr sobre datos existentes sin romper nada:
  probar cargando un JSON exportado de la versión anterior antes de publicar.
- Los datos viven en `localStorage` (clave `terrafleet_prueba_v1`), con copia
  diaria interna (`_bak`) que **jamás** se sobreescribe con una base vacía.
- Commits chicos, un tema por publicación.

## 5. Lo que NO se adoptó del kit (y por qué)

- **deploy.sh completo / entornos / suite paralela / modo mantenimiento**:
  no hay servidor propio — GitHub Pages publica atómico desde git. La compuerta
  de sintaxis + pruebas en navegador + publicar.sh cubren el equivalente.
  Cuando exista backend (Supabase) se revisa de nuevo.
- **flask-login-seguro**: no hay Flask; el login vendrá con Supabase Auth.
- **Formato de fecha aaaa/mm/dd**: TerraFleet usa dd/mm/aaaa, estándar es-AR
  de su mercado.
- **Manual PDF con reportlab**: la guía ilustrada web cumple ese rol por ahora;
  se puede generar un PDF más adelante si la agencia lo pide.
