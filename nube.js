/* TerraFleet — capa de nube (Supabase).
   Traduce el objeto `db` de la app (el mismo que antes vivía en localStorage)
   a filas de Postgres y viceversa. No toca el DOM: se prueba con Node
   (ver supabase/tests/nube_test.mjs).

   Idea: al entrar se baja todo y se guarda una "foto" (snapshot) de cada fila.
   Al guardar se compara el `db` actual contra la foto y solo se suben las
   diferencias. Cada actualización verifica que nadie más haya tocado la fila
   (updated_at); si alguien la tocó, se avisa "conflicto" y la app recarga. */
(function (root) {
  'use strict';

  const PAGE = 1000;

  // JSON con claves ordenadas: Postgres (jsonb) reordena claves, así se compara sin falsos cambios.
  function canon(v) {
    if (v === undefined) return 'null';
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort()
      .map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  }
  const iso = ms => (ms == null || ms === '' || isNaN(Number(ms))) ? null : new Date(Number(ms)).toISOString();
  const ms = s => s ? Date.parse(s) : null;
  function rest(obj, skip) {
    const o = {};
    Object.keys(obj).forEach(k => { if (skip.indexOf(k) < 0 && obj[k] !== undefined) o[k] = obj[k]; });
    return o;
  }
  function clean(row) { Object.keys(row).forEach(k => { if (row[k] === undefined || (row[k] === null && (k === 'created_at' || k === 'ts'))) delete row[k]; }); return row; }

  /* ───────── Traducción app ⇄ filas ───────── */
  const MAP = {
    clients: {
      table: 'clients', stamped: true,
      toRow: (c, aid) => ({ agency_id: aid, id: c.id, name: c.name || '(sin nombre)', contact: c.contact || null, phone: c.phone || null,
        email: c.email || null, cuit: c.cuit || null, data: rest(c, ['id', 'name', 'contact', 'phone', 'email', 'cuit']) }),
      fromRow: r => Object.assign({}, r.data || {}, { id: r.id, name: r.name, contact: r.contact || '', phone: r.phone || '', email: r.email || '', cuit: r.cuit || '' })
    },
    machines: {
      table: 'machines', stamped: true,
      toRow: (m, aid) => ({ agency_id: aid, id: m.id, client_id: m.clientId, brand: m.brand || null, model: m.model || null, serial: m.serial || null,
        hours: Number(m.hours) || 0, data: rest(m, ['id', 'clientId', 'brand', 'model', 'serial', 'hours', 'history']) }),
      fromRow: r => Object.assign({}, r.data || {}, { id: r.id, clientId: r.client_id, brand: r.brand || '', model: r.model || '', serial: r.serial || '', hours: Number(r.hours) || 0, history: [] })
    },
    ots: {
      table: 'work_orders', stamped: true,
      toRow: (o, aid) => clean({ agency_id: aid, id: o.id, machine_id: o.machineId, type: o.type || null, status: o.status || 'recibida',
        created_at: iso(o.createdAt), closed_at: iso(o.closedAt), data: rest(o, ['id', 'machineId', 'type', 'status', 'createdAt', 'closedAt']) }),
      fromRow: r => { const o = Object.assign({}, r.data || {}, { id: r.id, machineId: r.machine_id, type: r.type || '', status: r.status, createdAt: ms(r.created_at) }); if (r.closed_at) o.closedAt = ms(r.closed_at); return o; }
    },
    parts: {
      table: 'parts', stamped: true,
      toRow: (p, aid) => ({ agency_id: aid, id: p.id, ref: p.ref || null, name: p.name || '(sin nombre)', stock: Number(p.stock) || 0, min_stock: Number(p.min) || 0,
        data: rest(p, ['id', 'ref', 'name', 'stock', 'min']) }),
      fromRow: r => Object.assign({}, r.data || {}, { id: r.id, ref: r.ref || '', name: r.name, stock: Number(r.stock) || 0, min: Number(r.min_stock) || 0 })
    },
    notifs: {
      table: 'notifications', stamped: false,
      toRow: (n, aid) => clean({ agency_id: aid, id: n.id, audience: n.audience === 'client' ? 'client' : 'admin', client_id: n.clientId || null, icon: n.icon || null,
        title: n.title || '', detail: n.detail || null, ts: iso(n.ts), read: !!n.read, data: rest(n, ['id', 'audience', 'clientId', 'icon', 'title', 'detail', 'ts', 'read']) }),
      fromRow: r => Object.assign({}, r.data || {}, { id: r.id, audience: r.audience, clientId: r.client_id || null, icon: r.icon || '', title: r.title, detail: r.detail || '', ts: ms(r.ts), read: !!r.read })
    }
  };
  // Orden de subida: respeta las relaciones (cliente → máquina → orden).
  const ORDER = ['clients', 'machines', 'ots', 'parts', 'notifs'];

  const histKey = (mid, h) => mid + '|' + iso(h.ts) + '|' + (h.title || '');
  const histRow = (aid, mid, h) => ({ agency_id: aid, machine_id: mid, ts: iso(h.ts), title: h.title || '', detail: h.detail || null, data: rest(h, ['ts', 'title', 'detail']) });

  function metaRow(db) {
    const m = db.meta || {}, b = m.biz || {};
    return { name: b.name || 'Mi empresa', cuit: b.cif || null, phone: b.phone || null, city: b.city || null, inv_seq: Number(m.invSeq) || 0,
      settings: rest(m, ['biz', 'otSeq', 'satSeq', 'invSeq']) };
  }

  async function fetchAll(sb, table, aid, order, asc, max) {
    let out = [], from = 0;
    for (;;) {
      const to = Math.min(from + PAGE, max || Infinity) - 1;
      const q = sb.from(table).select('*').eq('agency_id', aid).order(order, { ascending: !!asc }).range(from, to);
      const { data, error } = await q;
      if (error) throw error;
      out = out.concat(data);
      if (data.length < PAGE || (max && out.length >= max)) return out;
      from += PAGE;
    }
  }

  /* ───────── Perfil del usuario con sesión ───────── */
  async function profile(sb) {
    const { data: u, error: e1 } = await sb.auth.getUser();
    // sin red no es lo mismo que sin cuenta: se avisa con un error para que la app use su copia local
    if (e1 && (e1.name === 'AuthRetryableFetchError' || !e1.status)) throw e1;
    if (e1 || !u || !u.user) return null;
    const { data, error } = await sb.from('profiles').select('user_id,agency_id,role,client_id,full_name,active').eq('user_id', u.user.id).maybeSingle();
    if (error) throw error;
    if (!data || !data.active) return null;
    data.email = u.user.email;
    return data;
  }

  /* ───────── Bajar todo ───────── */
  async function load(sb, prof) {
    const aid = prof.agency_id;
    const [ag, cl, ma, hi, ot, pa, no] = await Promise.all([
      sb.from('agencies').select('*').eq('id', aid).single().then(r => { if (r.error) throw r.error; return r.data; }),
      fetchAll(sb, 'clients', aid, 'created_at', true),
      fetchAll(sb, 'machines', aid, 'created_at', true),
      fetchAll(sb, 'machine_history', aid, 'ts', false),
      fetchAll(sb, 'work_orders', aid, 'created_at', false),
      fetchAll(sb, 'parts', aid, 'created_at', true),
      fetchAll(sb, 'notifications', aid, 'ts', false, 200)
    ]);
    const snap = { clients: new Map(), machines: new Map(), ots: new Map(), parts: new Map(), notifs: new Map(), hist: new Set(), meta: '' };
    const db = { meta: null, session: { clientId: prof.role === 'cliente' ? prof.client_id : null }, clients: [], machines: [], ots: [], notifs: [], parts: [] };
    const src = { clients: cl, machines: ma, ots: ot, parts: pa, notifs: no };
    ORDER.forEach(k => {
      src[k].forEach(r => {
        const o = MAP[k].fromRow(r);
        db[k].push(o);
        snap[k].set(o.id, { c: canon(MAP[k].toRow(o, aid)), u: r.updated_at || null });
      });
    });
    const byId = new Map(db.machines.map(m => [m.id, m]));
    hi.forEach(r => {
      const m = byId.get(r.machine_id); if (!m) return;
      const h = Object.assign({}, r.data || {}, { ts: ms(r.ts), title: r.title, detail: r.detail || '' });
      m.history.push(h);
      snap.hist.add(histKey(m.id, h));
    });
    db.meta = Object.assign({ trialStart: ms(ag.created_at), seenWelcome: true }, ag.settings || {}, {
      otSeq: ag.ot_seq, satSeq: ag.sat_seq, invSeq: ag.inv_seq,
      biz: { name: ag.name, cif: ag.cuit || '', phone: ag.phone || '', city: ag.city || '' }
    });
    snap.meta = canon(metaRow(db));
    const state = { aid: aid, role: prof.role, staff: prof.role !== 'cliente', snap: snap };
    return { db: db, state: state, sig: signature(snap) };
  }

  function signature(snap) {
    let s = snap.meta;
    ORDER.forEach(k => { snap[k].forEach((v, id) => { s += '\n' + id + v.c; }); });
    return s + '\n#h' + snap.hist.size;
  }

  // ¿Hay algo en `db` que todavía no esté en la nube?
  function pending(db, state) {
    const aid = state.aid, snap = state.snap;
    for (const k of ORDER) for (const o of db[k]) { const s = snap[k].get(o.id); if (!s || s.c !== canon(MAP[k].toRow(o, aid))) return true; }
    for (const m of db.machines) for (const h of (m.history || [])) if (!snap.hist.has(histKey(m.id, h))) return true;
    return state.staff && canon(metaRow(db)) !== snap.meta;
  }

  const HARD = { '42501': 1, 'P0001': 1, '23503': 1, '23514': 1, '23502': 1, '22P02': 1 };

  /* ───────── Subir diferencias ─────────
     Devuelve { ok, conflict, rejected[], error } :
       conflict  → otra persona cambió algo que acá también cambió: hay que recargar.
       rejected  → la base rechazó el cambio (permisos/reglas): hay que recargar.
       error     → falla de red u otra transitoria: se reintenta. */
  async function push(sb, db, state) {
    const aid = state.aid, snap = state.snap;
    const res = { ok: true, conflict: false, rejected: [], error: null, sent: 0 };
    const fail = (e, what) => {
      res.ok = false;
      if (e && HARD[e.code]) res.rejected.push(what + ': ' + (e.message || e.code)); else res.error = e || new Error('error');
    };

    for (const k of ORDER) {
      const M = MAP[k], S = snap[k], news = [], upds = [];
      db[k].forEach(o => {
        const row = M.toRow(o, aid), c = canon(row), s = S.get(o.id);
        if (!s) news.push({ o: o, row: row, c: c }); else if (s.c !== c) upds.push({ o: o, row: row, c: c, s: s });
      });

      // Altas: de a tandas; si la tanda falla, de a una para aislar la que molesta.
      for (let i = 0; i < news.length; i += 200) {
        const lote = news.slice(i, i + 200);
        // Sin "select" en avisos: el cliente puede crear un aviso para el taller pero no leerlo.
        const ins = rows => M.stamped ? sb.from(M.table).insert(rows).select('id,updated_at') : sb.from(M.table).insert(rows);
        let r = await ins(lote.map(x => x.row));
        if (!r.error) {
          const u = new Map((r.data || []).map(d => [d.id, d.updated_at || null]));
          lote.forEach(x => { S.set(x.o.id, { c: x.c, u: u.get(x.o.id) || null }); res.sent++; });
          continue;
        }
        for (const x of lote) {
          r = await ins([x.row]);
          if (r.error && r.error.code === '23505' && k === 'ots' && /^(OT|SAT)-\d+$/.test(x.o.id)) {
            // Número de orden repetido (dos personas a la vez): pedir uno nuevo a la base.
            const viejo = x.o.id, kind = viejo.indexOf('SAT-') === 0 ? 'SAT' : 'OT';
            const nx = await sb.rpc('next_code', { kind: kind });
            if (nx.error) { fail(nx.error, viejo); continue; }
            renumber(db, state, viejo, nx.data);
            x.row = M.toRow(x.o, aid); x.c = canon(x.row);
            r = await sb.from(M.table).insert(x.row).select('id,updated_at');
          }
          if (r.error && r.error.code === '23505' && k === 'notifs') { S.set(x.o.id, { c: x.c, u: null }); continue; }
          if (r.error) { fail(r.error, M.table + ' ' + x.o.id); continue; }
          S.set(x.o.id, { c: x.c, u: (r.data && r.data[0] && r.data[0].updated_at) || null }); res.sent++;
        }
      }

      // Cambios: solo si la fila sigue como la vimos (updated_at).
      for (const x of upds) {
        const row = Object.assign({}, x.row); delete row.agency_id; delete row.id;
        let q = sb.from(M.table).update(row).eq('agency_id', aid).eq('id', x.o.id);
        if (M.stamped && x.s.u) q = q.eq('updated_at', x.s.u);
        const r = await q.select(M.stamped ? 'id,updated_at' : 'id');
        if (r.error) { fail(r.error, M.table + ' ' + x.o.id); continue; }
        if (!r.data.length) { if (k === 'notifs') { S.set(x.o.id, { c: x.c, u: null }); continue; } res.ok = false; res.conflict = true; continue; }
        S.set(x.o.id, { c: x.c, u: r.data[0].updated_at || null }); res.sent++;
      }

      // Historial: después de las máquinas y de las órdenes (por si se renumeró alguna).
      if (k === 'ots') {
        const nuevos = [];
        db.machines.forEach(m => (m.history || []).forEach(h => {
          if (h.ts == null) h.ts = Date.now();
          const key = histKey(m.id, h);
          if (!snap.hist.has(key) && snap.machines.has(m.id)) nuevos.push({ key: key, row: histRow(aid, m.id, h) });
        }));
        for (let i = 0; i < nuevos.length; i += 200) {
          const lote = nuevos.slice(i, i + 200);
          const r = await sb.from('machine_history').upsert(lote.map(x => x.row), { onConflict: 'agency_id,machine_id,ts,title', ignoreDuplicates: true });
          if (r.error) { fail(r.error, 'historial'); continue; }
          lote.forEach(x => { snap.hist.add(x.key); res.sent++; });
        }
      }
    }

    // Datos de la agencia: solo el personal.
    if (state.staff) {
      const row = metaRow(db), c = canon(row);
      if (c !== snap.meta) {
        const r = await sb.from('agencies').update(row).eq('id', aid).select('id');
        if (r.error) fail(r.error, 'agencia');
        else if (r.data.length) { snap.meta = c; res.sent++; }
        else snap.meta = c; // técnico: no puede editar la agencia; no insistir
      }
    }
    return res;
  }

  // Cambia el número de una orden todavía no subida, y sus menciones aún no subidas.
  function renumber(db, state, viejo, nuevo) {
    const snap = state.snap, re = new RegExp(viejo.replace(/[-]/g, '\\-') + '(?!\\d)', 'g');
    const fix = t => typeof t === 'string' ? t.replace(re, nuevo) : t;
    db.ots.forEach(o => { if (o.id === viejo && !snap.ots.has(viejo)) o.id = nuevo; });
    db.notifs.forEach(n => { if (!snap.notifs.has(n.id)) { if (n.otId === viejo) n.otId = nuevo; n.title = fix(n.title); n.detail = fix(n.detail); } });
    db.machines.forEach(m => (m.history || []).forEach(h => { if (!snap.hist.has(histKey(m.id, h))) { h.title = fix(h.title); h.detail = fix(h.detail); } }));
    const n = parseInt(String(nuevo).replace(/\D/g, ''), 10);
    if (db.meta) { if (nuevo.indexOf('SAT-') === 0) db.meta.satSeq = Math.max(db.meta.satSeq || 0, n); else db.meta.otSeq = Math.max(db.meta.otSeq || 0, n); }
  }

  // Estado vacío: para subir por primera vez los datos que estaban en el navegador.
  function emptyState(prof) {
    return { aid: prof.agency_id, role: prof.role, staff: prof.role !== 'cliente',
      snap: { clients: new Map(), machines: new Map(), ots: new Map(), parts: new Map(), notifs: new Map(), hist: new Set(), meta: '' } };
  }

  // Copia local (modo sin señal): el estado se guarda como texto y se rearma al abrir.
  function pack(state) {
    const s = state.snap;
    return { aid: state.aid, role: state.role, staff: state.staff, snap: { meta: s.meta, hist: Array.from(s.hist),
      clients: Array.from(s.clients), machines: Array.from(s.machines), ots: Array.from(s.ots), parts: Array.from(s.parts), notifs: Array.from(s.notifs) } };
  }
  function unpack(o) {
    const s = o.snap;
    return { aid: o.aid, role: o.role, staff: o.staff, snap: { meta: s.meta, hist: new Set(s.hist),
      clients: new Map(s.clients), machines: new Map(s.machines), ots: new Map(s.ots), parts: new Map(s.parts), notifs: new Map(s.notifs) } };
  }

  const api = { pack: pack, unpack: unpack, canon: canon, profile: profile, load: load, push: push, pending: pending, signature: signature, emptyState: emptyState, MAP: MAP, metaRow: metaRow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TFNube = api;
})(typeof window !== 'undefined' ? window : globalThis);
