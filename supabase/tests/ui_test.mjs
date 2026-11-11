// Prueba de punta a punta: abre index.html real (jsdom), ingresa con usuarios de prueba,
// usa los formularios de la app y verifica que todo llegue a la nube.
// La corre:  bash supabase/tests/nube_test.sh ui
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
const require = createRequire(import.meta.url);
const deps = process.env.TEST_DEPS;
const { JSDOM, ResourceLoader, VirtualConsole } = require(deps + '/node_modules/jsdom');
const { createClient } = require(process.env.SUPABASE_JS);
const N = require('../../nube.js');
const { SUPABASE_URL: URL_, SUPABASE_ANON_KEY: KEY, T_STAFF, T_CLI, T_TEC, T_PW } = process.env;
const root = path.resolve(new URL('../..', import.meta.url).pathname);
const html = fs.readFileSync(path.join(decodeURIComponent(root), 'index.html'), 'utf8');

let ok = 0; const fallos = [], errores = [];
const t = (c, m) => { if (c) ok++; else fallos.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function hasta(fn, ms = 20000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (fn()) return true; } catch (e) {} await sleep(150); } return false; }

class Loader extends ResourceLoader {
  fetch(url) {
    const u = new URL(url);
    if (u.hostname !== 'giulichiatti-star.github.io') return Promise.resolve(Buffer.from(''));
    const rel = decodeURIComponent(u.pathname.replace('/terrafleet-prueba/', ''));
    const f = path.join(decodeURIComponent(root), rel);
    return Promise.resolve(fs.existsSync(f) ? fs.readFileSync(f) : Buffer.from(''));
  }
}
function abrir(nombre, semilla, sinRed) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e && (e.detail && e.detail.message || e.message)); if (!/Not implemented|error de prueba ZZ/.test(m)) errores.push(nombre + ': ' + m); });
  vc.on('error', e => { if (!/Failed to fetch/.test(String(e))) errores.push(nombre + ': ' + e); }); // console.error; la librería avisa así cuando no hay red
  const dom = new JSDOM(html, { url: 'https://giulichiatti-star.github.io/terrafleet-prueba/', runScripts: 'dangerously', resources: new Loader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.__off = !!sinRed; if (semilla) Object.keys(semilla).forEach(k => w.localStorage.setItem(k, semilla[k]));
      w.fetch = (u, o) => w.__off ? Promise.reject(new TypeError('Failed to fetch')) : (String(u).startsWith('http') ? fetch(u, o) : Promise.resolve(new Response('', { status: 404 }))); w.Headers = Headers; w.Request = Request; w.Response = Response;
      w.AbortController = AbortController; w.confirm = () => true; w.scrollTo = () => {}; } });
  return dom.window;
}
const ev = (w, code) => w.eval(code);
async function ingresar(w, email) {
  await hasta(() => ev(w, "typeof NUBE!=='undefined'&&!!NUBE.sb"));
  w.document.getElementById('btnNube').click();
  t(!w.document.getElementById('nubeOverlay').classList.contains('off'), email + ': se abre el formulario de ingreso');
  w.document.getElementById('nbEmail').value = email; w.document.getElementById('nbPass').value = T_PW;
  w.document.getElementById('nbGo').click();
  const entro = await hasta(() => ev(w, 'NUBE.on'));
  t(entro, email + ': ingresa (' + w.document.getElementById('nbMsg').textContent + ')');
  await hasta(() => /todo guardado/.test(w.document.getElementById('footStatus').textContent));
}
const guardado = w => hasta(() => ev(w, '!NUBE.dirty&&!NUBE.busy') && /todo guardado/.test(w.document.getElementById('footStatus').textContent));

// ── Sin cuenta: sigue siendo la demo local ──
const D = abrir('demo');
await hasta(() => ev(D, "typeof NUBE!=='undefined'&&!!NUBE.sb"));
t(ev(D, '!NUBE.on') && !D.document.body.classList.contains('nube'), 'sin cuenta queda en modo demo local');
t(D.document.getElementById('btnNube').style.display === 'block', 'aparece el botón Ingresar');
D.document.getElementById('btnNube').click();
D.document.getElementById('nbEmail').value = T_STAFF; D.document.getElementById('nbPass').value = 'clave-equivocada';
D.document.getElementById('nbGo').click();
await hasta(() => /incorrectos/.test(D.document.getElementById('nbMsg').textContent));
t(/incorrectos/.test(D.document.getElementById('nbMsg').textContent) && ev(D, '!NUBE.on'), 'clave equivocada: no entra y avisa');
D.close();

// ── Datos de demo en el navegador + nube vacía: se ofrece subirlos sin bloquear ──
{
  const demo = { meta: { otSeq: 4100, satSeq: 80, invSeq: 0, seenWelcome: true, biz: { name: 'Demo', cif: '', phone: '', city: '' } }, session: { clientId: null },
    clients: [{ id: 'cDemo', name: 'Cliente de demo', contact: '', phone: '', email: '', cuit: '' }], machines: [], ots: [], notifs: [], parts: [] };
  const sbAdm = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  await sbAdm.auth.signInWithPassword({ email: T_STAFF, password: T_PW });
  const pr = await N.profile(sbAdm);
  // la agencia de prueba trae un cliente c1: con eso la nube NO está vacía y no debe ofrecer nada
  const W = abrir('demo-con-datos', { terrafleet_prueba_v1: JSON.stringify(demo) });
  let confirmo = false; W.confirm = () => { confirmo = true; return true; };
  await ingresar(W, T_STAFF);
  t(!confirmo, 'ingreso: nunca usa el cartel bloqueante del navegador');
  t(!W.document.getElementById('mSubida') && ev(W, "db.clients.length===1&&db.clients[0].id==='c1'"), 'ingreso: con la nube ya cargada no ofrece subir ni mezcla datos');
  t(/Cliente de demo/.test(W.localStorage.getItem('terrafleet_prueba_v1')), 'ingreso: los datos de demo siguen en el navegador');
  // simular nube vacía para probar el ofrecimiento y las dos respuestas
  ev(W, "NUBE.ofrecerSubida(" + JSON.stringify(demo) + ")");
  t(W.document.getElementById('mSubida').classList.contains('show'), 'ofrecimiento: aparece dentro de la app');
  ev(W, "NUBE.responderSubida(true)");
  t(ev(W, "db.clients.length===1&&db.clients[0].id==='c1'"), 'ofrecimiento: si la nube tiene datos, no sube aunque se acepte');
  ev(W, "NUBE.ofrecerSubida(" + JSON.stringify(demo) + ");NUBE.responderSubida(false)");
  t(W.localStorage.getItem('tf_subida_' + pr.agency_id) === 'no' && !W.document.getElementById('mSubida').classList.contains('show'), 'ofrecimiento: «Empezar vacío» se recuerda y no vuelve a preguntar');
  W.close();
}

// ── Taller ──
const S = abrir('taller');
await ingresar(S, T_STAFF);
t(S.document.body.classList.contains('nube') && ev(S, "currentRole==='admin'"), 'taller: modo nube y rol empresa');
t(S.document.querySelector('.brandname').textContent === 'ZZ PRUEBA NUBE', 'taller: muestra el nombre de la agencia');
t(S.localStorage.getItem('terrafleet_prueba_v1') !== null && !/Estancia/.test(S.localStorage.getItem('terrafleet_prueba_v1')), 'los datos locales de demo no se tocan');
// alta de máquina por el formulario real
ev(S, "APP.openMachineModal()");
S.document.getElementById('maClient').value = 'c1'; S.document.getElementById('maBrand').value = 'Lovol'; S.document.getElementById('maModel').value = 'TE254'; S.document.getElementById('maHours').value = '49';
ev(S, "APP.saveMachine()");
t(ev(S, 'db.machines.length') === 1, 'taller: máquina creada en pantalla');
const mid = ev(S, 'db.machines[0].id');
// alta de OT por el formulario real
ev(S, "APP.openOTModal('" + mid + "')");
S.document.getElementById('otIssue').value = 'Pierde aceite';
ev(S, "APP.saveOT()");
t(ev(S, "db.ots.length===1&&db.ots[0].id==='OT-4101'"), 'taller: OT-4101 creada en pantalla');
// edición de cliente por el formulario real
ev(S, "APP.openClientModal('c1')");
S.document.getElementById('cliName').value = 'Estancia La Paz'; S.document.getElementById('cliEmail').value = 'lapaz@x.invalid';
ev(S, "APP.saveClient()");
t(await guardado(S), 'taller: todo guardado en la nube (' + S.document.getElementById('footStatus').textContent + ')');

// verificación independiente contra la base
const sb = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
await sb.auth.signInWithPassword({ email: T_STAFF, password: T_PW });
const prof = await N.profile(sb);
let x = await N.load(sb, prof);
t(x.db.clients[0].name === 'Estancia La Paz' && x.db.clients[0].email === 'lapaz@x.invalid', 'base: cliente actualizado');
t(x.db.machines.length === 1 && x.db.machines[0].hours === 49 && x.db.machines[0].clientId === 'c1', 'base: máquina con 49 h del cliente c1');
t(x.db.machines[0].history.length >= 1, 'base: historial de la máquina (' + x.db.machines[0].history.length + ')');
t(x.db.ots.length === 1 && x.db.ots[0].issue === 'Pierde aceite' && x.db.ots[0].machineId === mid, 'base: OT guardada y ligada a la máquina');
t(x.db.notifs.length >= 1, 'base: avisos guardados (' + x.db.notifs.length + ')');
t(x.db.meta.otSeq === 4101, 'base: contador de OT en 4101');

// la app no deja pedir turno si la máquina ya tiene una orden abierta: el taller anula la suya
ev(S, "db.ots[0].status='anulada';saveDb()");
t(await guardado(S), 'taller: anulación guardada');

// ── Cliente ──
const C = abrir('cliente');
await ingresar(C, T_CLI);
t(ev(C, "currentRole==='client'") && ev(C, "db.session.clientId==='c1'"), 'cliente: entra directo a su portal');
t(ev(C, 'db.machines.length===1&&db.clients.length===1&&db.parts.length===0'), 'cliente: ve solo su máquina');
ev(C, "APP.switchRole('admin')");
t(ev(C, "currentRole==='client'"), 'cliente: no puede pasarse a la vista de empresa');
t(/Estancia|TE254/.test(C.document.querySelector('.page.active').textContent), 'cliente: el portal muestra su equipo');
ev(C, "APP.requestCita('" + mid + "')");
t(ev(C, "db.ots.some(o=>o.origin==='cliente'&&o.id==='OT-4102')"), 'cliente: pide turno (OT-4102)');
t(await guardado(C), 'cliente: pedido guardado en la nube (' + C.document.getElementById('footStatus').textContent + ')');

// ── El taller lo ve sin recargar la página ──
await ev(S, 'NUBE.reload(false)');
t(ev(S, "db.ots.some(o=>o.id==='OT-4102'&&o.cita==='solicitada')"), 'taller: ve el turno pedido por el cliente');
t(ev(S, "db.notifs.some(n=>n.audience==='admin'&&/OT-4102|turno|cita/i.test(n.title+n.detail))"), 'taller: recibe el aviso del pedido');
// cambio simultáneo: el cliente actualiza horas mientras el taller edita otra cosa
ev(C, "APP.openHours('" + mid + "')");
const hid = [...C.document.querySelectorAll('.modal-backdrop.show input[type=number]')][0];
if (hid) { hid.value = '75'; ev(C, 'APP.saveHours()'); }
t(ev(C, 'db.machines[0].hours') === 75, 'cliente: actualiza horómetro a 75');
t(await guardado(C), 'cliente: horómetro guardado');
ev(S, "db.machines[0].serial='SERIE-TALLER';saveDb()");
await hasta(() => ev(S, '!NUBE.dirty&&!NUBE.busy'));
await sleep(1500);
x = await N.load(sb, prof);
t(x.db.machines[0].hours === 75 && x.db.machines[0].serial !== 'SERIE-TALLER', 'conflicto: el taller no pisa las horas del cliente con datos viejos');
t(ev(S, 'db.machines[0].hours') === 75, 'conflicto: la pantalla del taller se actualizó sola a 75 h');

// ── Funciones pro ──
t(ev(S, "TFPro._search('te254').some(r=>r.k==='m')") && ev(S, "TFPro._search('OT-4102').some(r=>r.k==='o')") && ev(S, "TFPro._search('estancia').some(r=>r.k==='c')"), 'buscador: encuentra equipo, orden y cliente');
t(ev(C, "TFPro._search('estancia').every(r=>r.k!=='c')") && ev(C, "TFPro._search('te254').length>=1"), 'buscador: el cliente no ve clientes, sí su equipo');
ev(S, "TFPro.openSearch()"); S.document.getElementById('tfSearchIn').value = 'lovol'; S.document.getElementById('tfSearchIn').dispatchEvent(new S.Event('input'));
t(S.document.querySelectorAll('#tfSearchRes .tfs-item').length >= 1, 'buscador: muestra resultados en pantalla');
ev(S, "TFPro.closeSearch()");
ev(S, "gotoPage('workshop')");
t(S.document.querySelectorAll('#tfKanban .kb-card').length === ev(S, "db.ots.filter(o=>TFPro._colOf(o)).length") && S.document.querySelectorAll('#tfKanban .kb-card').length >= 1, 'tablero: una tarjeta por orden en curso');
ev(S, "TFPro.move('OT-4102','diagnostico')");
t(ev(S, "db.ots.find(o=>o.id==='OT-4102').status==='diagnostico'") && !!S.document.querySelector('.kb-col[data-col="diagnostico"] .kb-card[data-id="OT-4102"]'), 'tablero: mover una tarjeta cambia el estado');
ev(S, "TFPro.openQR('" + mid + "')");
t(!!S.document.querySelector('#tfQRBody svg') && S.document.getElementById('tfQR').classList.contains('show'), 'QR: se genera el código del equipo');
ev(S, "APP.closeModal('tfQR')");
ev(S, "db.meta.costoHora=10000");
t(ev(S, "TFPro._otMoney({invoiced:true,invoiceBase:100000,horasTrabajo:2,costoMateriales:30000}).margen") === 50000, 'rentabilidad: 100.000 − (2 h × 10.000 + 30.000) = 50.000');
t(ev(S, "TFPro._otMoney({horasTrabajo:1}).margen") === null, 'rentabilidad: sin ingreso cargado no inventa margen');
t(ev(S, "Array.isArray(TFPro._forecast())"), 'pronóstico: se calcula');
ev(S, "gotoPage('reports')");
t(!!S.document.getElementById('tfRent').innerHTML && !!S.document.getElementById('tfFore').innerHTML, 'informes: muestra rentabilidad y pronóstico');
ev(S, "gotoPage('settings')");
t(!!S.document.getElementById('tfCostoHora'), 'ajustes: aparece marca, costos y apariencia');
const css = v => S.document.documentElement.style.getPropertyValue(v);
ev(S, "TFPro.setColor('#ffd166')");
t(css('--lime') === '#ffd166' && ev(S, "db.meta.brand.accent") === '#ffd166', 'marca: aplica el color de resalte');
ev(S, "TFPro.setColors('#12407a','#ffffff')");
t(css('--green') === '#12407a' && css('--lime') === '#ffffff' && !!css('--side1') && !!css('--bg') && !!css('--ink'), 'marca: azul y blanco cambia principal, resalte, barra lateral, fondo y texto');
t(ev(S, "TFPro._contraste(TF_PAL.onLime,TF_PAL.lime)") >= 4.5 && ev(S, "TFPro._contraste('#ffffff',TF_PAL.green)") >= 4.5 && ev(S, "TFPro._contraste(TF_PAL.green2,'#ffffff')") >= 4, 'marca: los textos sobre los colores elegidos se leen');
ev(S, "TFPro.setColors('#ffe066','#101010')");
t(ev(S, "TF_PAL.ajustado") === true && ev(S, "TFPro._contraste('#ffffff',TF_PAL.green)") >= 4.5 && ev(S, "TF_PAL.onLime") === '#ffffff', 'marca: un principal claro se oscurece solo y un resalte oscuro lleva texto blanco');
t(ev(S, "['#ff0000','#00ff00','#808080','#000000','#ffffff','#7cc4ff'].every(c=>{const p=TFPro._paleta({primary:c,accent:c});return TFPro._contraste('#ffffff',p.green)>=4.5&&TFPro._contraste(p.onLime,p.lime)>=4.5&&TFPro._contraste(p.ink,p.bg)>=7})"), 'marca: cualquier color elegido mantiene el contraste');
ev(S, "TFPro.resetColor()");
t(css('--green') === '' && css('--lime') === '' && css('--bg') === '' && ev(S, "TF_PAL") === null, 'marca: «Verde original» deja todo como antes');
ev(S, "TFPro.setColors('#12407a','#ffd166')");
ev(S, "TFPro.setTheme('oscuro')"); const osc = S.document.documentElement.getAttribute('data-theme') === 'dark' && css('--bg') === '' && css('--green') === '#12407a'; ev(S, "TFPro.setTheme('claro')");
t(osc && S.document.documentElement.getAttribute('data-theme') === 'light' && css('--bg') !== '', 'modo oscuro: se activa (la marca no pisa el fondo oscuro) y se desactiva');
ev(S, "saveDb()");
t(await guardado(S), 'pro: cambios guardados');
x = await N.load(sb, prof);
t(x.db.meta.costoHora === 10000 && x.db.meta.brand && x.db.meta.brand.accent === '#ffd166' && x.db.meta.brand.primary === '#12407a', 'marca y costo por hora quedan en la nube');
await ev(C, 'NUBE.reload(true)');
t(ev(C, "db.meta.brand&&db.meta.brand.primary") === '#12407a' && C.document.documentElement.style.getPropertyValue('--green') === '#12407a', 'el cliente recibe la marca de la agencia y su portal cambia de color');
C.location.hash = '#m=' + mid; ev(C, "TFPro.deepLink()");
t(C.document.getElementById('mMachineInfo').classList.contains('show'), 'QR: el enlace abre la ficha del equipo al cliente');
ev(C, "APP.closeModal('mMachineInfo')");

// ── Gestión: catálogo, repuestos, usuarios, fotos e informe ──
ev(S, "TFGest.precargarLovol()");
t(ev(S, "db.catalog.length") >= 10 && ev(S, "db.catalog.every(c=>c.brand==='Lovol'&&c.serviceGroup==='lovol')"), 'catálogo: precarga los modelos Lovol');
ev(S, "TFGest.precargarLovol()");
t(ev(S, "new Set(db.catalog.map(c=>c.model)).size===db.catalog.length"), 'catálogo: precargar dos veces no duplica');
ev(S, "TFGest.editarModelo()"); S.document.getElementById('catBrand').value = 'Roland'; S.document.getElementById('catModel').value = 'H001'; S.document.getElementById('catGroup').value = 'mini';
S.document.getElementById('catIntH').value = '100'; S.document.getElementById('catServ').value = '85000'; ev(S, "TFGest.guardarModelo()");
ev(S, "gotoPage('templates')");
t(/Roland H001/.test(S.document.getElementById('tfCat').textContent), 'catálogo: el modelo cargado a mano aparece en pantalla');
ev(S, "APP.openMachineModal()");
t(S.document.getElementById('maCatBox').style.display === 'block' && S.document.getElementById('maCat').options.length === ev(S, "db.catalog.length") + 1, 'alta de máquina: ofrece elegir del catálogo');
ev(S, "TFGest.usarModelo(db.catalog.find(c=>c.model==='H001').id)");
t(S.document.getElementById('maBrand').value === 'Roland' && S.document.getElementById('maModel').value === 'H001' && S.document.getElementById('maGroup').value === 'mini' && S.document.getElementById('maIntH').value === '100' && S.document.getElementById('maServicePrice').value === '85000', 'alta de máquina: el catálogo completa marca, modelo, plantilla, intervalo y precio');
ev(S, "APP.closeModal('mMachine')");
ev(S, "gotoPage('parts');TFGest.editarRepuesto()");
S.document.getElementById('ptRef').value = 'OF-2210'; S.document.getElementById('ptName').value = 'Filtro de aceite'; S.document.getElementById('ptStock').value = '5'; S.document.getElementById('ptMin').value = '2'; S.document.getElementById('ptCost').value = '4000';
ev(S, "TFGest.guardarRepuesto()");
t(ev(S, "db.parts.length===1&&db.parts[0].cost===4000") && /Filtro de aceite/.test(S.document.getElementById('partsTable').textContent), 'repuestos: alta con costo');
const pid = ev(S, "db.parts[0].id");
t(ev(S, "TFGest.usarRepuesto('OT-4102','" + pid + "',10)") === false && ev(S, "db.parts[0].stock") === 5, 'repuestos: no deja usar más de lo que hay');
t(ev(S, "TFGest.usarRepuesto('OT-4102','" + pid + "',2)") === true && ev(S, "db.parts[0].stock") === 3, 'repuestos: usar 2 en la orden descuenta el stock a 3');
t(ev(S, "TFGest.costoRepuestos(db.ots.find(o=>o.id==='OT-4102'))") === 8000 && ev(S, "TFPro._otMoney(db.ots.find(o=>o.id==='OT-4102')).mat") === 8000, 'repuestos: el costo entra en la rentabilidad de la orden');
ev(S, "APP.openOtInfo('OT-4102')");
t(/Filtro de aceite/.test(S.document.getElementById('oiExtras').textContent) && !!S.document.getElementById('exPart'), 'orden: muestra los repuestos usados y permite agregar');
ev(S, "TFGest.devolverRepuesto('OT-4102',0)");
t(ev(S, "db.parts[0].stock") === 5 && ev(S, "db.ots.find(o=>o.id==='OT-4102').partsUsed.length") === 0, 'repuestos: quitar de la orden devuelve al stock');
ev(S, "TFGest.usarRepuesto('OT-4102','" + pid + "',1)");
t(await guardado(S), 'gestión: catálogo y repuestos guardados');
// fotos
S.__foto = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1]).buffer;
const subio = await ev(S, "TFGest._subirFoto('OT-4102','antes',window.__foto)");
t(subio === true && ev(S, "db.ots.find(o=>o.id==='OT-4102').fotos.length") === 1, 'fotos: se sube una foto «antes» a la orden');
t(await guardado(S), 'fotos: la orden queda guardada con su foto');
const html9 = ev(S, "buildReportHTML(db.ots.find(o=>o.id==='OT-4102'))");
t(/Repuestos utilizados/.test(html9) && /Filtro de aceite/.test(html9) && /<h3>Antes<\/h3>/.test(html9) && /<img src="https:\/\//.test(html9), 'informe: incluye repuestos usados y la foto');
t(!/Costo materiales|4\.000|\$ /.test(html9), 'informe: no muestra costos internos al cliente');
t(/#12407a/.test(html9) && /#ffd166/.test(html9) && !/#14402c/.test(html9), 'informe: usa los colores de la agencia');
x = await N.load(sb, prof);
t(x.db.catalog.length === ev(S, "db.catalog.length") && x.db.parts[0].cost === 4000 && x.db.parts[0].stock === 4 && x.db.ots.find(o => o.id === 'OT-4102').partsUsed[0].qty === 1, 'base: catálogo, costo, stock y repuestos de la orden');
await ev(C, 'NUBE.reload(true)');
t(ev(C, "db.catalog.length") === x.db.catalog.length && ev(C, "db.parts.length") === 0, 'cliente: recibe el catálogo pero no ve repuestos');
const rutaFoto = ev(S, "db.ots.find(o=>o.id==='OT-4102').fotos[0].p");
await ev(S, "TFGest.borrarFoto('OT-4102','" + rutaFoto + "')");
t(ev(S, "db.ots.find(o=>o.id==='OT-4102').fotos.length") === 0, 'fotos: se puede borrar');
// usuarios
ev(S, "gotoPage('settings')");
t(await hasta(() => /zz-staff/.test(S.document.getElementById('tfUsers').textContent)), 'usuarios: lista a los usuarios de la agencia');
const mailU = 'zz-ui-' + Date.now() + '@test.invalid';
ev(S, "TFGest.nuevoUsuario()"); S.document.getElementById('uNombre').value = 'Tec UI'; S.document.getElementById('uEmail').value = mailU; S.document.getElementById('uRol').value = 'tecnico';
ev(S, "TFGest.crearUsuario()");
t(await hasta(() => !!S.document.getElementById('uClaveOut')), 'usuarios: crea la cuenta y muestra la contraseña provisoria');
const claveU = S.document.getElementById('uClaveOut').textContent;
const sbU = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const rU = await sbU.auth.signInWithPassword({ email: mailU, password: claveU });
const pU = rU.error ? null : await N.profile(sbU);
t(!rU.error && pU && pU.role === 'tecnico', 'usuarios: la persona entra con esos datos como técnico');
ev(S, "TFGest.cerrar('mUser')");
await guardado(S);

// ── Sin señal ──
S.__off = true;
ev(S, "APP.openClientModal('c1')");
S.document.getElementById('cliPhone').value = '3329 555 000';
ev(S, "APP.saveClient()");
t(await hasta(() => /Sin conexión/.test(S.document.getElementById('footStatus').textContent)), 'sin señal: avisa que está sin conexión');
t(/3329 555 000/.test(S.localStorage.getItem('terrafleet_nube_copia') || ''), 'sin señal: el cambio queda en la copia local');
// se cierra la pestaña y se vuelve a abrir, todavía sin señal
const semilla = {}; for (let i = 0; i < S.localStorage.length; i++) { const k = S.localStorage.key(i); semilla[k] = S.localStorage.getItem(k); }
S.close();
const S2 = abrir('taller-sin-red', semilla, true);
t(await hasta(() => ev(S2, "typeof NUBE!=='undefined'&&NUBE.on")), 'sin señal: la app abre igual con la copia local');
t(ev(S2, "db.clients[0].phone==='3329 555 000'&&db.machines.length===1"), 'sin señal: muestra los datos, incluido el cambio sin subir');
t(await hasta(() => /Sin conexión/.test(S2.document.getElementById('footStatus').textContent)), 'sin señal: lo indica en pantalla');
x = await N.load(sb, prof);
t(x.db.clients[0].phone !== '3329 555 000', 'sin señal: la nube todavía no tiene el cambio');
// vuelve la señal
S2.__off = false;
ev(S2, "window.dispatchEvent(new Event('online'))");
t(await guardado(S2), 'vuelve la señal: sube solo (' + S2.document.getElementById('footStatus').textContent + ')');
x = await N.load(sb, prof);
t(x.db.clients[0].phone === '3329 555 000', 'vuelve la señal: el cambio llegó a la nube');

// ── Registro de errores ──
ev(S2, "setTimeout(()=>{throw new Error('error de prueba ZZ')},0)");
await sleep(2500);
const er = await sb.rpc('log_error', { p: { message: 'ping' } });
t(!er.error, 'registro de errores: la función responde');

// ── Técnico: solo ve y hace trabajo de taller ──
{
  const aid = prof.agency_id;
  await sb.from('machines').insert({ agency_id: aid, id: 'mt1', client_id: 'c1', brand: 'Lovol', model: 'TE254', serial: 'T1', hours: 10, data: {} });
  await sb.from('work_orders').insert([
    { agency_id: aid, id: 'OT-T1', machine_id: 'mt1', type: 'Cita preventiva', status: 'cita', data: { cita: 'solicitada', origin: 'cliente', issue: 'Revisión de las 50 horas' } },
    { agency_id: aid, id: 'OT-T2', machine_id: 'mt1', type: 'Avería', status: 'taller', data: { issue: 'No arranca', tech: '' } }]);
  const TW = abrir('tecnico');
  await ingresar(TW, T_TEC);
  t(ev(TW, 'esTecnico()') && TW.document.body.classList.contains('rol-tec'), 'técnico: la app lo reconoce');
  t(await hasta(() => /Pedido de turno/.test((TW.document.getElementById('tec') || {}).textContent || '')), 'técnico: ve el pedido de turno en "Mi trabajo"');
  const tx = TW.document.getElementById('tec').textContent;
  t(/Proponer día/.test(tx) && /No arranca/.test(tx) && !/\$/.test(tx), 'técnico: ve pedido y trabajo en curso, sin dinero');
  const visibles = Array.from(TW.document.querySelectorAll('.admin-nav button')).filter(b => b.style.display !== 'none').length;
  t(visibles === 1, 'técnico: el menú tiene un solo botón (' + visibles + ')');
  ev(TW, "gotoPage('settings')");
  t(TW.document.getElementById('tec').classList.contains('active') && !TW.document.getElementById('settings').classList.contains('active'), 'técnico: no puede entrar a Ajustes');
  ev(TW, "gotoPage('reports')");
  t(!TW.document.getElementById('reports').classList.contains('active'), 'técnico: no puede entrar a Informes');
  // detalle: acciones del pedido y de la reparación
  ev(TW, "TFTec.abrir('OT-T2')");
  const md = TW.document.getElementById('mTec');
  t(md.classList.contains('show') && /Terminar y cerrar/.test(md.textContent) && !/Presupuesto|Factura|Anular/.test(md.textContent), 'técnico: el detalle muestra terminar y no muestra presupuesto, factura ni anular');
  TW.document.getElementById('tecNote').value = 'Cambié el filtro de combustible';
  ev(TW, "TFTec.nota('OT-T2')");
  t(await guardado(TW), 'técnico: guarda una nota');
  let r = await sb.from('work_orders').select('data').eq('agency_id', aid).eq('id', 'OT-T2').single();
  t(r.data && r.data.data.techNotes && r.data.data.techNotes.length === 1 && r.data.data.tech, 'técnico: la nota y su nombre llegaron a la nube');
  // pide día para el turno (acepta el pedido)
  ev(TW, "TFTec.proponer('OT-T1')");
  TW.document.getElementById('turnoDate').value = '2026-12-01'; TW.document.getElementById('turnoTime').value = '09:00';
  ev(TW, 'APP.saveTurno()');
  t(await guardado(TW), 'técnico: propone día');
  r = await sb.from('work_orders').select('data').eq('agency_id', aid).eq('id', 'OT-T1').single();
  t(r.data && r.data.data.cita === 'propuesta' && r.data.data.proposedDate === '2026-12-01', 'técnico: la propuesta de turno llegó a la nube');
  // cierra la orden sin tocar costos
  ev(TW, "TFTec.cerrar('OT-T2')");
  t(TW.document.getElementById('doneCosto').parentNode.style.display === 'none', 'técnico: el cierre no muestra costos');
  TW.document.getElementById('doneWork').value = 'Filtro y purga';
  TW.document.getElementById('doneHoras').value = '2';
  ev(TW, 'APP.completeOT()');
  t(await guardado(TW), 'técnico: cierra la orden (' + TW.document.getElementById('footStatus').textContent + ')');
  r = await sb.from('work_orders').select('status,data').eq('agency_id', aid).eq('id', 'OT-T2').single();
  t(r.data && r.data.status === 'terminada' && r.data.data.horasTrabajo === 2 && r.data.data.costoMateriales === undefined, 'técnico: la orden quedó terminada en la nube');
  // avisa al cliente que está lista
  ev(TW, "TFTec.avisarLista('OT-T2')");
  TW.document.getElementById('readyDate').value = '2026-12-02';
  ev(TW, 'APP.sendReady()');
  t(await guardado(TW), 'técnico: avisa que está lista');
  r = await sb.from('work_orders').select('data').eq('agency_id', aid).eq('id', 'OT-T2').single();
  t(r.data && r.data.data.ready === true, 'técnico: el aviso de retiro llegó a la nube');
  const nn = await sb.from('notifications').select('id').eq('agency_id', aid).eq('audience', 'client').ilike('title', '%lista para retirar%');
  t(nn.data && nn.data.length >= 1, 'técnico: el cliente recibió la alerta de equipo listo');
  TW.close();
}

S2.close(); C.close();
t(errores.length === 0, 'errores de JavaScript en la página: ' + errores.join(' | '));
console.log('RESULTADO UI: ' + ok + ' pruebas OK. Fallos: ' + (fallos.length ? '\n - ' + fallos.join('\n - ') : 'ninguno'));
process.exit(fallos.length ? 1 : 0);
