# TerraFleet — Contexto completo del proyecto

Para quien continúe este proyecto (IA o persona): este documento + el código
del repo es todo lo que necesitás. Última actualización: 2026-11-10.

## Qué es

CRM + gestión de servicio técnico para una agencia de maquinaria agrícola
(tractores Lovol, cortacéspedes, radios cero). La vende una consultora como
producto a agencias. Dos roles: **Empresa** (la agencia) y **Cliente** (el
productor dueño de las máquinas, portal simplificado).

- **App publicada**: https://giulichiatti-star.github.io/terrafleet-prueba/
- **Guía ilustrada** (otro repo): https://giulichiatti-star.github.io/terrafleet-guia/
- Cuenta GitHub: `giulichiatti-star`

## Arquitectura (fase actual — local)

- **Un archivo HTML** (`index.html`) más `nube.js` (capa de nube) y
  `vendor/supabase-2.45.4.js` (librería, copiada al repo para no depender de un CDN). Sin build, sin
  dependencias, sin framework: HTML + CSS + JS vanilla. Esto es a propósito:
  máxima portabilidad.
- **Datos en `localStorage`** (clave `terrafleet_prueba_v1`), un JSON con:
  - `meta`: biz{name,cif,phone,city}, trialStart, otSeq, satSeq, invSeq, lastExport
  - `clients[]`: id, name, contact, phone, email, cuit
  - `machines[]`: id, clientId, brand, model, serial, iconKey, serviceGroup
    (`mini`|`lovol`|null), hours, lastServiceHours, lastServiceDate, intervalH,
    intervalM, warrantyEnd, salePrice, servicePrice, servicePriceTBD, modelImg,
    foto (base64), stage, history[] (nunca se pierde)
  - `ots[]`: id (OT-xxxx / SAT-xx), machineId, type, issue, status
    (`cita→recibida→diagnostico→presupuesto→bloqueada→taller→terminada`,
    más `anulada`), cita (solicitada/propuesta/confirmada/rechazada),
    proposedDate/Time, presupuesto{base,iva,total,approved,nota}, tasks[{t,done,why}],
    workDone, horasTrabajo, materiales, costoMateriales, ready, pickupDate/Time,
    signature (base64), invoice*, responsable, fechaPrevista, bloqueo, anuladaMotivo
  - `notifs[]` (máx 60), `parts[]`, `session`
- **Copias de seguridad**: copia diaria interna (`_bak`, jamás sobreescribe
  datos con base vacía), preservación de JSON corrupto (`_corrupt`),
  exportación JSON y enlace `#datos=` (validado).
- `SERVICE_GROUPS`: plantillas de mantenimiento — `mini` (7 servicios,
  cortacéspedes/radio cero) y `lovol` (6 services por horas: 50/250/500/750/1000/1500,
  + aceites). `LOVOL_MODELS`: 5 familias con imágenes reales base64.

## Circuitos de negocio clave

1. **OT de 7 estados** con responsable y fecha prevista; cierre guarda horas
   taller/materiales/costo; casilla "cuenta como service" reinicia el plan
   (una avería no lo reinicia).
2. **Turnos**: cliente pide → taller propone día/hora → cliente acepta/rechaza
   en la app → reproponer. El calendario del taller (Agenda) muestra SOLO
   confirmados; lo pendiente vive en "Turnos por confirmar" (cada OT vive en
   un solo lugar).
3. **Retiro y firma**: cierre → "Avisar retiro" con día y hora → seguimiento
   paso a paso en el portal → **firma del informe obligatoria antes de poder
   descargarlo**; botón "Firmar en mostrador" para el taller.
4. **Fallo repetido**: al cerrar, detecta incidencias similares (repeatFlag)
   y alerta en la ficha de la máquina.
5. **Portal cliente**: inicio ("¿Qué service le toca a cada equipo?"), plan
   completo de services por tipo de producto (timeline), equipos con fotos,
   documentos, soporte. Navegación unificada: Inicio/Mis equipos/Servicios/Documentos/Soporte.

## Convenciones

- Español rioplatense con voseo en toda la UI. Pesos es-AR (`$ 387.200`).
  Fechas dd/mm/aaaa (estándar del mercado argentino — NO cambiar a aaaa/mm/dd).
- Paleta verde: `--green:#14402c, --green2:#2f7a52, --lime:#c9f464` + ámbar/rojo/azul.
  Iconos SVG inline (sprite `#i-*`), nada de emojis.
- `esc()` SIEMPRE al interpoler texto de usuario. `otAbierta(o)` para filtrar
  OTs activas (excluye terminada y anulada). Fechas locales con `isoOf()`,
  nunca `toISOString()` directo.
- Responsive obligatorio: probar 360/390/768/1024/1280 sin scroll horizontal.

## Cómo se trabaja (ver PROTOCOLO-TERRAFLEET.md)

1. Editar el archivo fuente con parches (python) verificando anchors únicos.
2. `node --check` sobre el JS extraído (compuerta de sintaxis).
3. Probar en navegador real (browser-use): flujos completos, no solo capturas;
   números contra valores esperados.
4. Publicar con `bash publicar.sh "mensaje"` — estampa versión (meta
   `app-version` + `version.txt`), commitea y pushea. El aviso de "versión
   nueva" les llega solo a los usuarios (banner no descartable, sin recarga
   automática, no toca localStorage).

## Estado de la fase nube (2026-11-10)

- **Repo fijo**: esta carpeta es un clon de `terrafleet-prueba`. `index.html` del
  repo es la fuente; ya no existe el archivo suelto ni la carpeta `/tmp`.
- **Supabase producción**: proyecto `MAQ-TRA BARADERO` (ref `gytxfmjqfmcbetwxchlh`,
  región `sa-east-1`). Credenciales en `.env` local (ignorado por git). La clave
  pública (anon) está en `index.html` a propósito: la seguridad la impone RLS.
- **Un solo link, dos modos**: sin cuenta la app es la demo local de siempre
  (localStorage). Con cuenta ("Ingresar con mi cuenta") baja los datos de la agencia
  y cada `saveDb()` sube solo las diferencias.
- **Cómo sincroniza** (`nube.js`, sin DOM, probado con Node): al entrar guarda una
  foto de cada fila; al guardar compara y sube altas/cambios. Cada cambio verifica
  `updated_at`: si otra persona tocó la fila, hay "conflicto", se recarga y se avisa
  (nunca se pisa en silencio). Refresca solo cada 45 s y al volver a la pestaña.
  Números de OT repetidos se renumeran pidiéndole el siguiente a la base.
- **Esquema** (`supabase/migrations/`): agencies, profiles, platform_admins,
  invitations, clients, machines, machine_history (solo alta), work_orders, parts,
  work_order_parts (descuenta stock), catalog_models, notifications, audit_log,
  alert_outbox. Roles `admin`, `tecnico`, `cliente`. Lo que el cliente puede cambiar
  lo limitan triggers (`private.guard_*`). Los campos de la app que no relacionan
  nada viven en la columna `data` (jsonb) de cada tabla.
- **Alta de usuarios**: el admin carga una fila en `invitations` (email, rol y, si es
  cliente, su `client_id`). La persona crea su cuenta en la app con ese email,
  confirma por correo y queda vinculada sola (trigger `accept_invitation`). Una
  cuenta sin invitación no ve nada. Todavía NO hay pantalla para invitar: se hace
  por SQL. El correo de confirmación sale por el servicio de Supabase, que sin SMTP
  propio solo envía a miembros de la organización y pocos por hora.
- **Alertas por email**: planteadas y NO activas. `private.daily_alerts()` encola en
  `alert_outbox`; nadie la programa ni envía. Las alertas dentro de la app siguen
  como siempre.
- **Pruebas** (todas se deshacen solas; usan una agencia "ZZ PRUEBA NUBE"):
  - `supabase db query --linked -f supabase/tests/rls_test.sql` → 38 OK
  - `bash supabase/tests/nube_test.sh` → 36 OK (capa de datos)
  - `bash supabase/tests/nube_test.sh ui` → 33 OK (app real en jsdom)
- **Aplicar migraciones**: `supabase db push --linked` (no requiere Docker).
- **Pendiente**: pantalla para invitar usuarios, catálogo en la app (la tabla ya
  existe), repuestos ligados a OTs en la app, respaldo diario, quitar fotos
  embebidas, idioma/estética, activar alertas por email.
- Sin Docker en la Mac no hay base local: se prueba contra producción con datos de
  mentira que se borran.

## Estructura del código y funciones nuevas (2026-11-11)

- `index.html` ya no contiene código: solo el HTML. Estilos en `css/app.css` y
  `css/pro.css`; código en `js/01-base.js` … `js/08-pro.js` (scripts clásicos que
  comparten variables globales, cargados en orden con `defer`), más `nube.js`.
- `js/08-pro.js`: buscador global (Ctrl/⌘+K o `/`), tablero kanban del taller,
  QR por máquina (`#m=<id>` abre la ficha), rentabilidad por orden, pronóstico de
  services a 90 días, marca por agencia (logo y color en `meta.brand`), costo de la
  hora (`meta.costoHora`) y modo oscuro (por equipo, `localStorage tf_tema`).
- **Sin señal**: `sw.js` guarda la app para abrirla offline; `js/06-nube-ui.js`
  guarda una copia de los datos en `localStorage` (`terrafleet_nube_copia`) y sube
  los cambios al volver la conexión. App instalable (`manifest.webmanifest`, `icons/`).
- **Errores**: todo error de JavaScript se manda a la tabla `client_errors`
  (función `log_error`, máximo 5 por visita y 300 por hora). Consultar con
  `select * from client_errors order by at desc`.
- **Publicar**: `bash publicar.sh "mensaje"` corre sintaxis + pruebas y recién
  entonces sube. `.github/workflows/pruebas.yml` repite las pruebas en GitHub.
- **Respaldo diario**: preparado en `infra/`. Falta correr UNA vez
  `bash infra/instalar-respaldo.sh` (crea el repo privado `terrafleet-respaldos`,
  guarda los secretos y lanza el primer respaldo).
- `js/09-gestion.js`: usuarios (el admin crea la cuenta con contraseña provisoria vía
  `admin_create_user`; no se envían correos), catálogo de modelos (`db.catalog` ⇄
  `catalog_models`), repuestos usados por orden (`ot.partsUsed`, descuenta
  `parts.stock` y suma al costo de la orden), fotos antes/después (`ot.fotos`,
  archivos en el bucket privado `ot-fotos`, carpeta `<agencia>/<orden>/`) e informe
  de servicio rediseñado (`buildReportHTML`, sin costos internos).
- El respaldo diario ya está instalado y corrió (repo privado `terrafleet-respaldos`).
- Las tablas `invitations` y `work_order_parts` existen pero la app no las usa hoy.

## Roadmap (lo que falta, en prioridad)

1. **FASE NUBE — Supabase (confirmada, pendiente del token de la dueña)**:
   - 2 proyectos: `pruebas` y `producción` (plan free). Nada se ensaya en producción.
   - Multi-tenant: la consultora = super admin; cada agencia = tenant; clientes
     finales de cada agencia ven SOLO lo suyo (row-level security, no solo UI).
   - Login: agencias con email+clave (Supabase Auth); clientes finales con link
     personal (token) o CUIT+PIN. Un solo link: sin cuenta = demo local,
     con cuenta = datos en la nube.
   - El mismo modelo de datos de arriba pasa a Postgres; migración de los datos
     locales existentes (export JSON → import). Alertas por email (WhatsApp
     automático = API paga, fase 2).
   - **Dejar todas las migraciones SQL y la doc en este repo** para quien continúe.
2. **Catálogo de productos de la agencia**: cargar una vez marcas/modelos con
   foto, plantilla y precios; en el alta de máquina, selector en vez de tipear.
   Precargar los 5 Lovol (ya tienen imágenes).
3. Auto-diagnóstico por WhatsApp del cliente, lookup CUIT AFIP (no hay API
   gratis CORS), dominio propio, manual PDF.

## Seguridad y datos

- La información de los usuarios vive en SU navegador hasta la fase nube.
- El token de Supabase lo tiene la dueña (dueña del negocio); revocable desde
  el panel. Nunca commitear claves/tokens a este repo.
- Cambios de estructura de datos: SOLO aditivos + `migrate()` compatible con
  versiones viejas (probar cargando un JSON exportado de la versión anterior).

## Archivos de este repo

- `index.html` — la app completa (lo que se publica)
- `version.txt` — versión publicada (alimenta el aviso de actualización)
- `PROTOCOLO-TERRAFLEET.md` — reglas de publicación, pruebas y cambios
- `publicar.sh` — publicación verificada (compuerta de sintaxis + versión)
- `CONTEXTO.md` — este documento
