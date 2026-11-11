// Prueba de la capa de nube (nube.js) contra la base real, con una agencia de prueba.
// La corre supabase/tests/nube_test.sh, que crea y borra la agencia y los usuarios.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createClient } = require(process.env.SUPABASE_JS || '@supabase/supabase-js');
const N = require('../../nube.js');

const { SUPABASE_URL: URL, SUPABASE_ANON_KEY: KEY, T_STAFF, T_CLI, T_PW } = process.env;
let ok = 0; const fallos = [];
const t = (cond, msg) => { if (cond) ok++; else fallos.push(msg); };
const mk = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function entrar(email) {
  const sb = mk();
  const { error } = await sb.auth.signInWithPassword({ email, password: T_PW });
  if (error) throw new Error('login ' + email + ': ' + error.message);
  const prof = await N.profile(sb);
  return { sb, prof };
}
const filas = (db, aid) => ['clients', 'machines', 'ots', 'parts', 'notifs']
  .map(k => db[k].map(o => N.canon(N.MAP[k].toRow(o, aid))).sort().join('\n')).join('\n##\n');

const now = Date.now();
const A = await entrar(T_STAFF);
t(A.prof && A.prof.role === 'admin', 'perfil admin');
let a = await N.load(A.sb, A.prof);
t(a.db.clients.length === 1 && a.db.machines.length === 0, 'agencia de prueba arranca con 1 cliente y sin máquinas');
t(a.db.meta.biz.name === 'ZZ PRUEBA NUBE', 'nombre de agencia en meta.biz');
t(!N.pending(a.db, a.state), 'recién cargado no hay pendientes');

// 1) Carga inicial: datos como los crea la app
const db = a.db;
Object.assign(db.clients[0], { name: 'Estancia La Paz', contact: 'Juan Pérez', phone: '3329 111', email: 'j@x.invalid', cuit: '20-1-1' });
db.clients.push({ id: 'c2', name: 'Otro Campo', contact: '', phone: '', email: '', cuit: '' });
db.machines.push(
  { id: 'm1', clientId: 'c1', brand: 'Lovol', model: 'TE254', serial: 'S1', iconKey: 'tractor', serviceGroup: 'lovol', hours: 49, lastServiceHours: 0,
    lastServiceDate: '2026-11-08', intervalH: 500, intervalM: 12, warrantyEnd: '', salePrice: 0, servicePrice: 0, stage: 'soon', lastHoursUpdate: now,
    history: [{ ts: now - 5000, title: 'Entrega de la máquina', detail: 'Venta inicial' }] },
  { id: 'm2', clientId: 'c2', brand: 'Lovol', model: 'TE366', serial: '', iconKey: 'tractor', hours: 0, stage: 'ok', history: [] });
db.ots.unshift(
  { id: 'OT-4101', machineId: 'm1', type: 'Cita preventiva', issue: 'Service 50 h', status: 'cita', cita: 'propuesta', proposedDate: '2026-11-20', proposedTime: '09:00', tech: '', origin: 'taller', createdAt: now - 4000 },
  { id: 'OT-4102', machineId: 'm1', type: 'Avería', issue: 'Pierde aceite', status: 'presupuesto', presupuesto: { base: 100000, iva: 21000, total: 121000, approved: null, nota: '' },
    tasks: [{ t: 'Revisar retén', done: false }], tech: '', origin: 'taller', createdAt: now - 3000 },
  { id: 'OT-4103', machineId: 'm2', type: 'Avería', issue: 'No arranca', status: 'taller', tech: '', origin: 'taller', createdAt: now - 2000 });
db.meta.otSeq = 4103;
db.parts.push({ id: 'p1', ref: 'F-1', name: 'Filtro de aceite', stock: 5, min: 2 });
db.notifs.unshift({ id: 'n1', audience: 'client', clientId: 'c1', icon: 'i-mail', title: 'Turno propuesto', detail: 'OT-4101', ts: now, read: false, kind: 'cita', otId: 'OT-4101' },
                  { id: 'n2', audience: 'admin', clientId: null, icon: 'i-users', title: 'Cliente registrado', detail: 'Estancia La Paz', ts: now, read: false });
db.meta.biz.phone = '3329 000';
t(N.pending(db, a.state), 'detecta pendientes antes de subir');
let r = await N.push(A.sb, db, a.state);
t(r.ok && r.sent === 12, 'subida inicial ok (enviadas ' + r.sent + ', esperaba 12) ' + JSON.stringify(r.rejected) + (r.error ? r.error.message : ''));
t(!N.pending(db, a.state), 'sin pendientes después de subir');

// 2) Ida y vuelta: lo que baja es idéntico a lo que subió
let a2 = await N.load(A.sb, A.prof);
t(filas(a2.db, A.prof.agency_id) === filas(db, A.prof.agency_id), 'ida y vuelta idéntica');
t(a2.db.machines.find(m => m.id === 'm1').history.length === 1, 'historial vuelve');
t(a2.db.meta.biz.phone === '3329 000' && a2.db.meta.otSeq === 4103, 'meta vuelve (tel y otSeq ' + a2.db.meta.otSeq + ')');
t(!N.pending(a2.db, a2.state), 'recarga no inventa cambios');
r = await N.push(A.sb, a2.db, a2.state);
t(r.ok && r.sent === 0, 'subir sin cambios no envía nada (' + r.sent + ')');

// 3) Cambios puntuales
const o3 = a2.db.ots.find(o => o.id === 'OT-4103'); o3.status = 'terminada'; o3.closedAt = Date.now(); o3.workDone = 'Batería nueva';
const m2 = a2.db.machines.find(m => m.id === 'm2'); m2.hours = 12; m2.history.unshift({ ts: Date.now(), title: 'OT cerrada · OT-4103', detail: 'Batería nueva' });
r = await N.push(A.sb, a2.db, a2.state);
t(r.ok && r.sent === 3, 'cambios puntuales: 3 envíos (' + r.sent + ')');

// 4) Conflicto: dos sesiones tocan la misma orden
const B = await entrar(T_STAFF);
const b = await N.load(B.sb, B.prof);
t(b.db.ots.find(o => o.id === 'OT-4103').status === 'terminada' && b.db.machines.find(m => m.id === 'm2').hours === 12, 'otra sesión ve los cambios');
a2.db.ots.find(o => o.id === 'OT-4102').issue = 'Pierde aceite (retén)';
r = await N.push(A.sb, a2.db, a2.state); t(r.ok, 'A guarda primero');
b.db.ots.find(o => o.id === 'OT-4102').issue = 'Otra cosa';
r = await N.push(B.sb, b.db, b.state);
t(!r.ok && r.conflict, 'B recibe conflicto en vez de pisar el cambio de A');

// 5) Dos personas crean la misma numeración a la vez
const b2 = await N.load(B.sb, B.prof);
const nuevaOT = (d, txt) => { d.meta.otSeq = (d.meta.otSeq || 4100) + 1; const ot = { id: 'OT-' + d.meta.otSeq, machineId: 'm2', type: 'Avería', issue: txt, status: 'recibida', tech: '', origin: 'taller', createdAt: Date.now() };
  d.ots.unshift(ot); d.notifs.unshift({ id: 'nx' + txt, audience: 'admin', clientId: null, icon: 'i-wrench', title: 'OT creada', detail: ot.id + ' · ' + txt, ts: Date.now(), read: false, otId: ot.id }); return ot; };
const a3 = await N.load(A.sb, A.prof);
const otA = nuevaOT(a3.db, 'A'), otB = nuevaOT(b2.db, 'B');
t(otA.id === 'OT-4104' && otB.id === 'OT-4104', 'ambas nacen OT-4104');
r = await N.push(A.sb, a3.db, a3.state); t(r.ok, 'A sube OT-4104');
r = await N.push(B.sb, b2.db, b2.state);
t(r.ok && otB.id === 'OT-4105', 'B se renumera sola a OT-4105 (quedó ' + otB.id + ') ' + JSON.stringify(r.rejected));
t(b2.db.notifs.find(n => n.id === 'nxB').detail.indexOf('OT-4105') === 0, 'el aviso de B menciona el número nuevo');

// 6) Cliente: ve solo lo suyo y solo puede lo permitido
const C = await entrar(T_CLI);
t(C.prof && C.prof.role === 'cliente' && C.prof.client_id === 'c1', 'perfil cliente');
let c = await N.load(C.sb, C.prof);
t(c.db.clients.length === 1 && c.db.machines.length === 1 && c.db.parts.length === 0, 'cliente ve 1 cliente, 1 máquina, 0 repuestos');
t(c.db.ots.length === 2 && c.db.ots.every(o => o.machineId === 'm1'), 'cliente ve solo sus 2 órdenes (' + c.db.ots.length + ')');
t(c.db.notifs.length === 1 && c.db.session.clientId === 'c1', 'cliente ve solo su aviso');
t(!N.pending(c.db, c.state), 'cliente recién cargado sin pendientes');
// acepta el turno (como citaAccept)
const oc = c.db.ots.find(o => o.id === 'OT-4101'); oc.cita = 'confirmada';
c.db.machines[0].history.unshift({ ts: Date.now(), title: 'Turno confirmado · OT-4101', detail: 'El cliente aceptó' });
c.db.notifs.unshift({ id: 'nc1', audience: 'admin', clientId: null, icon: 'i-checkc', title: 'Turno confirmado ✓', detail: 'aceptó', ts: Date.now(), read: false });
r = await N.push(C.sb, c.db, c.state);
t(r.ok && r.sent === 3, 'cliente acepta turno (' + r.sent + ') ' + JSON.stringify(r.rejected));
// aprueba el presupuesto (como budgetApprove)
const op = c.db.ots.find(o => o.id === 'OT-4102'); op.presupuesto.approved = true; op.status = 'taller';
r = await N.push(C.sb, c.db, c.state); t(r.ok, 'cliente aprueba presupuesto ' + JSON.stringify(r.rejected));
// pide turno (como requestCita) y actualiza horómetro
c = await N.load(C.sb, C.prof);
c.db.meta.otSeq += 1; c.db.ots.unshift({ id: 'OT-' + c.db.meta.otSeq, machineId: 'm1', type: 'Cita preventiva', issue: 'Solicitada desde el portal', status: 'cita', cita: 'solicitada', tech: '', origin: 'cliente', createdAt: Date.now() });
c.db.machines[0].hours = 60; c.db.machines[0].lastHoursUpdate = Date.now();
r = await N.push(C.sb, c.db, c.state); t(r.ok, 'cliente pide turno y actualiza horas ' + JSON.stringify(r.rejected));
// intenta algo prohibido
c.db.ots.find(o => o.id === 'OT-4102').status = 'terminada';
r = await N.push(C.sb, c.db, c.state);
t(!r.ok && r.rejected.length === 1, 'la base rechaza que el cliente cierre una orden');

// 7) El taller ve lo que hizo el cliente
const a4 = await N.load(A.sb, A.prof);
t(a4.db.ots.find(o => o.id === 'OT-4101').cita === 'confirmada', 'taller ve turno confirmado');
t(a4.db.ots.find(o => o.id === 'OT-4102').status === 'taller' && a4.db.ots.find(o => o.id === 'OT-4102').presupuesto.approved === true, 'taller ve presupuesto aprobado');
t(a4.db.ots.some(o => o.origin === 'cliente' && o.id === 'OT-4106'), 'taller ve el turno pedido como OT-4106');
t(a4.db.machines.find(m => m.id === 'm1').hours === 60, 'taller ve el horómetro nuevo');
t(a4.db.notifs.some(n => n.id === 'nc1'), 'taller recibe el aviso del cliente');
t(a4.db.meta.otSeq === 4106, 'contador de órdenes al día (' + a4.db.meta.otSeq + ')');
t(a4.db.ots.find(o => o.id === 'OT-4102').status !== 'terminada', 'el cierre prohibido no entró');

// 8) Alta de usuarios por el administrador
const nuevo = 'zz-nuevo-' + Date.now() + '@test.invalid';
r = await C.sb.rpc('admin_create_user', { p_email: nuevo, p_password: 'clave-provisoria-1', p_role: 'tecnico' });
t(!!r.error, 'un cliente no puede crear usuarios');
r = await A.sb.rpc('admin_create_user', { p_email: nuevo, p_password: 'corta', p_role: 'tecnico' });
t(!!r.error, 'rechaza contraseña corta');
r = await A.sb.rpc('admin_create_user', { p_email: nuevo, p_password: 'clave-provisoria-1', p_role: 'cliente' });
t(!!r.error, 'rechaza cliente sin cliente asociado');
r = await A.sb.rpc('admin_create_user', { p_email: nuevo, p_password: 'clave-provisoria-1', p_role: 'tecnico', p_full_name: 'Técnico Nuevo' });
t(!r.error && !!r.data, 'el admin crea un técnico ' + (r.error ? r.error.message : ''));
const uidNuevo = r.data;
r = await A.sb.rpc('admin_create_user', { p_email: nuevo, p_password: 'clave-provisoria-1', p_role: 'tecnico' });
t(!!r.error, 'no duplica un email existente');
const sbN = mk();
r = await sbN.auth.signInWithPassword({ email: nuevo, password: 'clave-provisoria-1' });
t(!r.error, 'el técnico nuevo ingresa con la contraseña provisoria ' + (r.error ? r.error.message : ''));
let pn = await N.profile(sbN);
t(pn && pn.role === 'tecnico' && pn.agency_id === A.prof.agency_id, 'queda vinculado a la agencia como técnico');
r = await sbN.auth.updateUser({ password: 'mi-clave-propia-22' });
t(!r.error, 'el técnico cambia su contraseña');
r = await sbN.rpc('admin_reset_password', { p_user: A.prof.user_id, p_password: 'hackeada-12345' });
t(!!r.error, 'un técnico no puede cambiarle la contraseña a otro');
r = await A.sb.rpc('admin_reset_password', { p_user: uidNuevo, p_password: 'reseteada-12345' });
const sbN2 = mk(); const r2 = await sbN2.auth.signInWithPassword({ email: nuevo, password: 'reseteada-12345' });
t(!r.error && !r2.error, 'el admin le pone una contraseña nueva y funciona');
r = await A.sb.from('profiles').select('email,role,active').eq('agency_id', A.prof.agency_id);
t(!r.error && r.data.length === 4 && r.data.some(p => p.email === nuevo), 'el admin lista los 4 usuarios de la agencia con su email');
r = await A.sb.from('profiles').update({ active: false }).eq('user_id', A.prof.user_id).select('user_id');
t(!!r.error, 'el admin no puede desactivarse a sí mismo');
r = await A.sb.from('profiles').update({ active: false }).eq('user_id', uidNuevo).select('user_id');
t(!r.error && r.data.length === 1, 'el admin desactiva al técnico');
pn = await N.profile(sbN2);
t(pn === null, 'el usuario desactivado ya no entra a la agencia');
r = await sbN2.from('clients').select('id');
t(!r.error && r.data.length === 0, 'el usuario desactivado no ve datos');

// 9) Fotos de órdenes
const aid = A.prof.agency_id, foto = new Blob([new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1])], { type: 'image/jpeg' });
const ruta = aid + '/OT-4101/antes-1.jpg';
r = await A.sb.storage.from('ot-fotos').upload(ruta, foto, { contentType: 'image/jpeg' });
t(!r.error, 'el taller sube una foto a la orden ' + (r.error ? r.error.message : ''));
r = await C.sb.storage.from('ot-fotos').createSignedUrl(ruta, 60);
t(!r.error && !!r.data.signedUrl, 'el cliente dueño de la máquina puede ver la foto');
r = await C.sb.storage.from('ot-fotos').upload(aid + '/OT-4101/intruso.jpg', foto, { contentType: 'image/jpeg' });
t(!!r.error, 'el cliente no puede subir fotos');
r = await C.sb.storage.from('ot-fotos').createSignedUrl(aid + '/OT-4103/x.jpg', 60);
const rutaAjena = aid + '/OT-4103/antes-1.jpg';
await A.sb.storage.from('ot-fotos').upload(rutaAjena, foto, { contentType: 'image/jpeg' });
r = await C.sb.storage.from('ot-fotos').createSignedUrl(rutaAjena, 60);
t(!!r.error, 'el cliente no ve fotos de órdenes de otro cliente');
r = await A.sb.storage.from('ot-fotos').upload('00000000-0000-4000-8000-000000000000/OT-1/x.jpg', foto, { contentType: 'image/jpeg' });
t(!!r.error, 'el taller no puede subir a la carpeta de otra agencia');
r = await mk().storage.from('ot-fotos').createSignedUrl(ruta, 60);
t(!!r.error, 'sin sesión no se accede a las fotos');
r = await A.sb.storage.from('ot-fotos').remove([ruta, rutaAjena]);
t(!r.error && r.data.length === 2, 'el taller borra fotos');

console.log('RESULTADO: ' + ok + ' pruebas OK. Fallos: ' + (fallos.length ? '\n - ' + fallos.join('\n - ') : 'ninguno'));
process.exit(fallos.length ? 1 : 0);
