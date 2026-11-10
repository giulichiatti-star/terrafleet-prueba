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
const { SUPABASE_URL: URL_, SUPABASE_ANON_KEY: KEY, T_STAFF, T_CLI, T_PW } = process.env;
const root = path.resolve(new URL('../..', import.meta.url).pathname);
const html = fs.readFileSync(path.join(decodeURIComponent(root), 'index.html'), 'utf8');

let ok = 0; const fallos = [], errores = [];
const t = (c, m) => { if (c) ok++; else fallos.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function hasta(fn, ms = 20000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (fn()) return true; } catch (e) {} await sleep(150); } return false; }

class Loader extends ResourceLoader {
  fetch(url) {
    if (url.includes('vendor/supabase')) return Promise.resolve(fs.readFileSync(process.env.SUPABASE_JS + '/dist/umd/supabase.js'));
    if (url.includes('nube.js')) return Promise.resolve(fs.readFileSync(path.join(decodeURIComponent(root), 'nube.js')));
    return Promise.resolve(Buffer.from(''));
  }
}
function abrir(nombre) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { const m = String(e && (e.detail && e.detail.message || e.message)); if (!/Not implemented/.test(m)) errores.push(nombre + ': ' + m); });
  vc.on('error', e => errores.push(nombre + ': ' + e));
  const dom = new JSDOM(html, { url: 'https://giulichiatti-star.github.io/terrafleet-prueba/', runScripts: 'dangerously', resources: new Loader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.fetch = (u, o) => String(u).startsWith('http') ? fetch(u, o) : Promise.resolve(new Response('', { status: 404 })); w.Headers = Headers; w.Request = Request; w.Response = Response;
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

// ── Taller ──
const S = abrir('taller');
await ingresar(S, T_STAFF);
t(S.document.body.classList.contains('nube') && ev(S, "currentRole==='admin'"), 'taller: modo nube y rol empresa');
t(S.document.querySelector('.brandsub').textContent === 'ZZ PRUEBA NUBE', 'taller: muestra el nombre de la agencia');
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

S.close(); C.close();
t(errores.length === 0, 'errores de JavaScript en la página: ' + errores.join(' | '));
console.log('RESULTADO UI: ' + ok + ' pruebas OK. Fallos: ' + (fallos.length ? '\n - ' + fallos.join('\n - ') : 'ninguno'));
process.exit(fallos.length ? 1 : 0);
