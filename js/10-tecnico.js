/* TerraFleet — vista del técnico: "Mi trabajo".
   El técnico ve solo lo del taller: pedidos nuevos, agenda, trabajos en curso y equipos
   terminados. Sin dinero, sin clientes ni catálogo, sin ajustes. Los permisos de verdad
   están en la base (migración 20261111000006_rol_tecnico.sql); esto es la cara simple. */
const TFTec=(function(){
  'use strict';
  const T={};
  const yo=()=>{const p=(NUBE&&NUBE.prof)||{};return p.full_name||String(p.email||'').replace(/@.*/,'')||'Técnico'};
  const get=id=>db.ots.find(o=>o.id===id);
  const byDate=(a,b)=>((a.proposedDate||'')+(a.proposedTime||'')).localeCompare((b.proposedDate||'')+(b.proposedTime||''));
  const hoy=()=>todayISO();
  const tomar=o=>{if(!o.tech)o.tech=yo();if(!o.responsable)o.responsable=yo()};
  const cerrarModal=()=>{const m=document.getElementById('mTec');if(m)m.classList.remove('show')};

  /* ───── grupos de la pantalla ───── */
  function grupos(){
    const abiertas=db.ots.filter(otAbierta);
    const nuevos=abiertas.filter(o=>(o.status==='cita'&&(o.cita==='solicitada'||o.cita==='rechazada'||!o.cita))||(o.status==='recibida'&&o.origin==='cliente'&&!o.tech&&!o.proposedDate));
    const en=new Set(nuevos.map(o=>o.id));
    const agenda=abiertas.filter(o=>!en.has(o.id)&&o.cita==='confirmada'&&(o.status==='cita'||o.status==='recibida')).sort(byDate);
    agenda.forEach(o=>en.add(o.id));
    const espera=abiertas.filter(o=>!en.has(o.id)&&o.status==='cita'&&o.cita==='propuesta').sort(byDate);
    espera.forEach(o=>en.add(o.id));
    const taller=abiertas.filter(o=>!en.has(o.id)).sort((a,b)=>String(b.id).localeCompare(String(a.id)));
    const listas=db.ots.filter(o=>o.status==='terminada'&&!o.signature).sort((a,b)=>(b.closedAt||0)-(a.closedAt||0)).slice(0,8);
    return {nuevos,agenda,espera,taller,listas};
  }

  function tarjeta(o,tone,label,btn){
    const m=machineOf(o.machineId),c=m?clientOf(m.clientId):null;
    const f=o.proposedDate?((o.proposedDate===hoy()?'Hoy':fmtDate(o.proposedDate))+(o.proposedTime?' · '+o.proposedTime:'')):'';
    const txt=o.status==='bloqueada'?(o.bloqueoNota||''):(o.issue||'');
    return '<div class="tec-card" onclick="TFTec.abrir(\''+esc(o.id)+'\')" role="button" tabindex="0">'+
      '<div class="tc-top"><b>'+esc(m?mLabel(m):'Equipo')+'</b>'+(f?'<span class="tc-date">'+esc(f)+'</span>':'')+'</div>'+
      '<div class="tc-sub">'+esc(c?c.name:'—')+' · '+esc(o.type||'')+' · '+esc(o.id)+'</div>'+
      (txt?'<div class="tc-issue">'+esc(trunc(txt,110))+'</div>':'')+
      '<div class="tc-foot"><span class="badge '+tone+'">'+esc(label)+'</span>'+(btn||'')+'</div></div>';
  }
  const btnCard=(txt,js)=>'<button class="solid-btn" onclick="event.stopPropagation();'+js+'">'+txt+'</button>';

  function seccion(titulo,sub,items,vacio){
    if(!items.length&&!vacio)return '';
    return '<div class="tec-sec"><div class="tec-sec-h"><b>'+titulo+'</b><span>'+(items.length||'')+'</span></div>'+
      (sub?'<div class="small" style="margin:-4px 0 10px">'+sub+'</div>':'')+
      (items.length?items.join(''):'<div class="tec-vacio">'+vacio+'</div>')+'</div>';
  }

  function render(){
    const host=document.getElementById('tec');if(!host)return;
    const g=grupos(),h=hoy();
    const hoyN=g.agenda.filter(o=>o.proposedDate===h).length;
    let html='<div class="tec-hello"><div><div class="tec-hi">Hola, '+esc(yo())+'</div><div class="small">Esto es lo que tenés para hacer en el taller.</div></div></div>'+
      '<div class="tec-stats"><div><b>'+g.nuevos.length+'</b><span>Pedidos nuevos</span></div><div><b>'+hoyN+'</b><span>Para hoy</span></div><div><b>'+g.taller.length+'</b><span>En el taller</span></div></div>';
    html+=seccion('Pedidos nuevos','Proponé un día y el cliente lo confirma desde su portal.',
      g.nuevos.map(o=>tarjeta(o,o.cita==='rechazada'?'bad':'info',o.cita==='rechazada'?'Rechazó el día — proponer otro':(o.status==='cita'?'Pedido de turno':'Pedido de asistencia'),
        o.status==='cita'?btnCard('Proponer día','TFTec.proponer(\''+esc(o.id)+'\')'):'')));
    html+=seccion('Agenda','Turnos confirmados, del más próximo al más lejano.',
      g.agenda.map(o=>tarjeta(o,o.proposedDate&&o.proposedDate<h?'bad':(o.proposedDate===h?'warn':'ok'),o.proposedDate&&o.proposedDate<h?'Atrasado':(o.proposedDate===h?'Es hoy':'Confirmado'))),
      'No hay turnos confirmados.');
    html+=seccion('En el taller','',g.taller.map(o=>tarjeta(o,
      o.status==='bloqueada'?'bad':(o.status==='presupuesto'?'warn':'info'),
      o.status==='bloqueada'?(o.bloqueo==='pieza'?'Falta repuesto':'Detenida'):(OT_ESTADOS[o.status]||o.status))),'No hay equipos en el taller.');
    html+=seccion('Esperando al cliente','Ya propusiste un día; falta que el cliente conteste.',g.espera.map(o=>tarjeta(o,'warn','Propuesto '+fmtDate(o.proposedDate))));
    html+=seccion('Terminadas','',g.listas.map(o=>o.ready
      ?tarjeta(o,'ok','Retiro avisado '+fmtDate(o.pickupDate))
      :tarjeta(o,'warn','Falta avisar al cliente',btnCard('Avisar que está lista','TFTec.avisarLista(\''+esc(o.id)+'\')'))));
    host.innerHTML=html;
  }
  T.render=render;

  /* ───── detalle de la orden ───── */
  function modal(inner){
    let m=document.getElementById('mTec');
    if(!m){m=document.createElement('div');m.className='modal-backdrop';m.id='mTec';m.innerHTML='<div class="modal"></div>';document.body.appendChild(m);
      m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')})}
    const box=m.firstChild,sc=box.scrollTop;box.innerHTML=inner;m.classList.add('show');box.scrollTop=sc;return m;
  }
  const B=(txt,js,cls)=>'<button class="'+(cls||'solid-btn')+' tec-big" onclick="'+js+'">'+txt+'</button>';

  function acciones(o){
    const id=esc(o.id),preventiva=/preventiv/i.test(o.type||'');
    const a=[];
    if(o.status==='anulada')return '<span class="badge bad">Anulada</span>';
    if(o.status==='terminada'){
      if(!o.ready)a.push(B('Avisar al cliente que está lista','TFTec.avisarLista(\''+id+'\')'));
      else a.push('<span class="badge ok">Retiro avisado para el '+esc(fmtDate(o.pickupDate))+(o.pickupTime?' · '+esc(o.pickupTime):'')+'</span>');
      if(o.signature)a.push('<span class="badge ok">Firmado por el cliente ✓</span>');
      a.push(B('Ver informe','TFTec.informe(\''+id+'\',false)','outline-btn'));
      a.push(B(o.signature?'Informe firmado':'Informe y firma en mostrador','TFTec.informe(\''+id+'\',true)','outline-btn'));
      return a.join('');
    }
    if(o.status==='cita'){
      if(o.cita==='confirmada')a.push(B('Empezar el trabajo','TFTec.paso(\''+id+'\',\'taller\')'));
      if(o.cita==='propuesta')a.push('<span class="badge warn">Propuesto el '+esc(fmtDate(o.proposedDate))+' — espera al cliente</span>');
      a.push(B(o.proposedDate&&o.cita!=='rechazada'?'Cambiar el día':'Proponer día','TFTec.proponer(\''+id+'\')',o.cita==='confirmada'?'outline-btn':'solid-btn'));
      return a.join('');
    }
    if(o.status==='recibida'){
      a.push(B(preventiva?'Empezar el trabajo':'Empezar diagnóstico','TFTec.paso(\''+id+'\',\''+(preventiva?'taller':'diagnostico')+'\')'));
      if(!o.proposedDate)a.push(B('Proponer día','TFTec.proponer(\''+id+'\')','outline-btn'));
    }else if(o.status==='diagnostico'){
      a.push(B('Pasar a reparación','TFTec.paso(\''+id+'\',\'taller\')'));
    }else if(o.status==='taller'){
      a.push(B('Terminar y cerrar la orden','TFTec.cerrar(\''+id+'\')'));
    }else if(o.status==='presupuesto'){
      a.push('<span class="badge warn">Presupuesto con el cliente — lo maneja administración</span>');
    }else if(o.status==='bloqueada'){
      a.push('<span class="badge bad">'+(o.bloqueo==='pieza'?'Detenida: falta un repuesto':(o.bloqueo==='autorizacion'?'Detenida: falta autorización del cliente':'Detenida'))+(o.bloqueoNota?' — '+esc(o.bloqueoNota):'')+'</span>');
      if(o.bloqueo!=='autorizacion')a.push(B('Ya está, retomar el trabajo','TFTec.paso(\''+id+'\',\'taller\')'));
    }
    if(['recibida','diagnostico','taller'].indexOf(o.status)>=0)a.push(B('Falta un repuesto','TFTec.faltaRepuesto(\''+id+'\')','outline-btn'));
    return a.join('');
  }

  T.abrir=function(id){
    const o=get(id);if(!o)return;
    const m=machineOf(o.machineId),c=m?clientOf(m.clientId):null;
    const f=o.proposedDate?(fmtDate(o.proposedDate)+(o.proposedTime?' · '+o.proposedTime:'')):'sin día';
    const estado=o.status==='cita'?({solicitada:'Pedido de turno',propuesta:'Esperando al cliente',rechazada:'El cliente rechazó',confirmada:'Turno confirmado'}[o.cita]||'Turno'):(OT_ESTADOS[o.status]||o.status);
    const notas=(o.techNotes||[]).map(n=>'<div class="tec-nota"><div><b>'+esc(n.by||'—')+'</b> · '+esc(fmtTs(n.ts))+'</div>'+esc(n.t)+'</div>').join('');
    modal('<h3>'+esc(o.id)+' · '+esc(o.type||'Orden')+'</h3><p>'+esc(m?mLabel(m):'')+(m&&m.serial?' · SN '+esc(m.serial):'')+'</p>'+
      '<div class="machine-meta" style="grid-template-columns:1fr 1fr;margin-top:4px">'+
        '<div class="meta">Cliente<span>'+esc(c?c.name:'—')+'</span></div>'+
        '<div class="meta">Teléfono<span>'+(c&&c.phone?'<a href="tel:'+esc(c.phone.replace(/[^\d+]/g,''))+'">'+esc(c.phone)+'</a>':'—')+'</span></div>'+
        '<div class="meta">Día<span>'+esc(f)+'</span></div>'+
        '<div class="meta">Estado<span>'+esc(estado)+'</span></div>'+
        (m?'<div class="meta">Horas de la máquina<span>'+esc(nf(m.hours))+' h</span></div>':'')+
        '<div class="meta">Técnico<span>'+esc(o.tech||'—')+'</span></div></div>'+
      (o.issue?'<div class="tec-pedido"><b>Pedido / problema</b><br>'+esc(o.issue)+'</div>':'')+
      '<div class="tec-acts">'+acciones(o)+'</div>'+
      '<div class="tec-blk"><label>Notas del trabajo</label>'+
        '<textarea class="field" id="tecNote" style="height:72px;resize:vertical" placeholder="Qué encontraste, qué hiciste, qué falta…"></textarea>'+
        '<div class="action-row" style="margin-top:8px"><button class="outline-btn" onclick="TFTec.nota(\''+esc(o.id)+'\')">Guardar nota</button>'+
        '<button class="outline-btn" onclick="TFTec.avisarAdmin(\''+esc(o.id)+'\')">Avisar a administración</button></div>'+
        (notas?'<div style="margin-top:10px">'+notas+'</div>':'')+'</div>'+
      (o.status!=='anulada'?'<div class="action-row" style="margin-top:12px"><button class="outline-btn" onclick="TFTec.checklist(\''+esc(o.id)+'\')">Lista de tareas'+(o.tasks&&o.tasks.length?' ('+o.tasks.filter(t=>t.done).length+'/'+o.tasks.length+')':'')+'</button></div>':'')+
      '<div id="tecExtras"></div>'+
      '<div class="modal-actions"><button class="outline-btn" onclick="TFTec.cerrarDetalle()">Cerrar</button></div>');
    if(typeof TFGest!=='undefined'){TFGest._extrasEn('#tecExtras');TFGest._renderOtExtras(id)}
  };
  T.cerrarDetalle=cerrarModal;

  /* ───── acciones ───── */
  T.proponer=function(id){const o=get(id);if(!o)return;cerrarModal();tomar(o);APP.openTurno(id)};
  T.paso=function(id,st){const o=get(id);if(!o)return;tomar(o);APP.setOTStatus(id,st);T.abrir(id)};
  T.cerrar=function(id){const o=get(id);if(!o)return;cerrarModal();tomar(o);APP.openDone(id)};
  T.checklist=function(id){cerrarModal();APP.openTasks(id)};
  T.avisarLista=function(id){const o=get(id);if(!o)return;cerrarModal();APP.markReady(id)};
  T.informe=function(id,firma){cerrarModal();firma?APP.openReport(id):APP.viewReport(id)};
  T.nota=function(id){
    const o=get(id),t=(document.getElementById('tecNote')||{}).value;
    if(!o||!t||!t.trim()){toast('Escribí la nota primero');return}
    tomar(o);(o.techNotes=o.techNotes||[]).unshift({ts:Date.now(),by:yo(),t:t.trim().slice(0,800)});
    saveDb();toast('Nota guardada');T.abrir(id);
  };
  T.avisarAdmin=function(id){
    const o=get(id),t=((document.getElementById('tecNote')||{}).value||'').trim();
    if(!o)return;if(!t){toast('Escribí qué querés avisar');return}
    const m=machineOf(o.machineId);tomar(o);
    (o.techNotes=o.techNotes||[]).unshift({ts:Date.now(),by:yo(),t:'→ Administración: '+t.slice(0,780)});
    pushNotif('admin','i-alert','Aviso del taller · '+o.id,yo()+' · '+(m?mLabel(m)+': ':'')+trunc(t,160),null,{otId:o.id});
    saveDb();toast('Aviso enviado a administración');T.abrir(id);
  };
  T.faltaRepuesto=function(id){
    const o=get(id);if(!o)return;
    const t=((document.getElementById('tecNote')||{}).value||'').trim()||'Falta un repuesto';
    const m=machineOf(o.machineId);tomar(o);
    o.status='bloqueada';o.bloqueo='pieza';o.bloqueoNota=t.slice(0,200);
    if(m)m.history.unshift({ts:Date.now(),title:'Detenida por repuesto · '+o.id,detail:t.slice(0,200)});
    (o.techNotes=o.techNotes||[]).unshift({ts:Date.now(),by:yo(),t:'Falta repuesto: '+t.slice(0,780)});
    pushNotif('admin','i-alert','Falta repuesto · '+o.id,yo()+' · '+(m?mLabel(m)+': ':'')+trunc(t,160),null,{otId:o.id});
    saveDb();toast('Orden detenida — administración fue avisada');renderAll();T.abrir(id);
  };

  /* ───── armado de la pantalla para el técnico ───── */
  T.apply=function(){
    if(!esTecnico())return;
    document.body.classList.add('rol-tec');
    const nav=document.querySelector('.admin-nav');
    if(nav&&!nav.querySelector('[data-page="tec"]')){
      nav.querySelectorAll('button').forEach(b=>{b.style.display='none'});
      nav.insertAdjacentHTML('afterbegin','<button class="active" data-page="tec"><span class="ico"><svg class="ic"><use href="#i-wrench"/></svg></span><span>Mi trabajo</span></button>');
      nav.querySelector('[data-page="tec"]').addEventListener('click',()=>gotoPage('tec'));
    }
    const mm=document.getElementById('mmAdmin');
    if(mm&&!mm.querySelector('[data-tec]')){
      mm.querySelectorAll('button').forEach(b=>{b.style.display='none'});
      mm.insertAdjacentHTML('afterbegin','<button data-tec="1" onclick="APP.mmGo(\'tec\')"><svg class="ic"><use href="#i-wrench"/></svg>Mi trabajo</button>');
    }
    if(!document.getElementById('tec')){
      const ref=document.getElementById('dashboard');
      if(ref)ref.insertAdjacentHTML('beforebegin','<section class="page" id="tec"></section>');
    }
    gotoPage('tec');
  };

  /* ───── enganches (solo actúan si quien entró es técnico) ───── */
  if(typeof titles!=='undefined')titles.tec=['Mi trabajo','Taller · lo que hay para hacer'];
  const _go=gotoPage;
  gotoPage=function(id){if(esTecnico()&&id!=='tec')id='tec';return _go.call(this,id)};
  const _rp=renderPage;
  renderPage=function(id){if(id==='tec'){render();return}return _rp.apply(this,arguments)};
  const _oi=APP.openOtInfo;
  APP.openOtInfo=function(id){
    if(esTecnico()){T.abrir(id);return}
    if(typeof TFGest!=='undefined')TFGest._extrasEn('#oiExtras');
    _oi.apply(this,arguments);
    /* el administrador ve las notas del técnico dentro de la orden */
    let box=document.getElementById('oiNotas');
    if(!box){const ref=document.getElementById('oiTasks');if(ref){ref.insertAdjacentHTML('afterend','<div id="oiNotas"></div>');box=document.getElementById('oiNotas')}}
    const o=get(id);
    if(box)box.innerHTML=(o&&o.techNotes&&o.techNotes.length)?'<div class="tec-blk" style="margin-top:14px"><label>Notas del técnico</label>'+o.techNotes.map(n=>'<div class="tec-nota"><div><b>'+esc(n.by||'—')+'</b> · '+esc(fmtTs(n.ts))+'</div>'+esc(n.t)+'</div>').join('')+'</div>':'';
  };
  const _od=APP.openDone;
  APP.openDone=function(id){
    _od.apply(this,arguments);
    const row=document.getElementById('doneCosto');const cell=row&&row.parentNode;
    if(cell)cell.style.display=esTecnico()?'none':'';
    if(esTecnico()){const t=document.getElementById('doneTech');if(t&&!t.value)t.value=yo()}
  };
  return T;
})();
