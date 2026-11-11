/* ================= RENDER ================= */
let currentRole='admin';
let machFilter='all';
const titles={
  dashboard:['Panel','Panel interno / Resumen'],
  clients:['Clientes','Panel interno / CRM'],
  machines:['Maquinaria','Panel interno / Activos'],
  templates:['Plantillas de service','Panel interno / Biblioteca'],
  workshop:['Taller / OTs','Panel interno / Servicio técnico'],
  parts:['Repuestos','Panel interno / Inventario'],
  reports:['Informes','Panel interno / Estadísticas'],
  settings:['Ajustes y datos','Panel interno / Configuración'],
  clienthome:['Inicio','Área cliente / Inicio'],
  clientmachines:['Mis equipos','Área cliente / Mis equipos'],
  clientservices:['Servicios','Área cliente / Servicios'],
  clientdocs:['Documentos','Área cliente / Documentos'],
  clientsupport:['Soporte','Área cliente / Soporte']
};
function gotoPage(id){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  const p=document.getElementById(id);if(p)p.classList.add('active');
  document.querySelectorAll('.nav button[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
  if(titles[id]){document.getElementById('pagetitle').textContent=titles[id][0];document.getElementById('crumb').textContent=titles[id][1]}
  renderPage(id);
  window.scrollTo({top:0,behavior:'smooth'});
}
  function renderPage(id){
    ({
      dashboard:renderDashboard,clients:renderClients,machines:renderMachines,workshop:renderWorkshop,
      templates:renderTemplates,
      parts:renderParts,reports:renderReports,settings:renderSettings,
      clienthome:renderClientHome,clientmachines:renderClientMachines,clientservices:renderClientServices,
      clientdocs:renderClientDocs,clientsupport:renderClientSupport
    }[id]||(()=>{}))();
  }
function renderAll(){
  updateTrialUI();renderBell();
  const active=document.querySelector('.page.active');
  if(active)renderPage(active.id);
}
function updateTrialUI(){
  if(NUBE.on)return;
  if(!storageOk){
    $('#footDot').classList.add('red');
    $('#footStatus').textContent='Advertencia: este navegador bloquea el guardado';
  }
}
function machineRowHTML(m){
  const c=clientOf(m.clientId),info=dueInfo(m);
  return '<tr class="rowlink" onclick="APP.openHistory(\''+m.id+'\')" title="Ver historial de la máquina">'+
    '<td><div class="machine"><div class="machine-icon"><svg class="ic"><use href="'+iconOf(m)+'"/></svg></div><div><b>'+esc(mLabel(m))+'</b><div class="small">SN '+esc(m.serial||'—')+'</div></div></div></td>'+
    '<td>'+esc(c?c.name:'—')+'</td><td>'+esc(info.label)+'<div class="small">'+esc(info.reason)+'</div></td><td>'+STATE_BADGE[info.state]+'</td>'+
    '<td><button class="mini-btn wa" title="Avisar por WhatsApp" onclick="event.stopPropagation();APP.notifyWA(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-send"/></svg></button> '+
    '<button class="mini-btn" title="Avisar por email" onclick="event.stopPropagation();APP.notifyMail(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-mail"/></svg></button></td></tr>';
}
function machineCardHTML(m,clientView){
  const c=clientOf(m.clientId),info=dueInfo(m);
  const badge=STATE_BADGE[info.state];
  let actions='';
  if(clientView){
    actions='<button class="solid-btn" onclick="APP.openHours(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-gauge"/></svg>Actualizar horas</button>'+
            '<button class="outline-btn" onclick="APP.openHistory(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-clock"/></svg>Historial</button>';
  }else{
    actions='<button class="outline-btn" onclick="APP.openMachineModal(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-cog"/></svg>Editar</button>'+
            '<button class="outline-btn" onclick="APP.openOTModal(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-clip"/></svg>Nueva OT</button>'+
            '<button class="outline-btn" onclick="APP.openHistory(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-clock"/></svg>Historial</button>';
  }
  const pix=machinePix(m);
  const fotoHTML=pix?'<img src="'+pix+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block"/>':'';
  return '<div class="card machine-card hov" style="cursor:pointer" onclick="APP.openMachineInfo(\''+m.id+'\')">'+
    (clientView&&pix?'<div style="height:150px;border-radius:14px;overflow:hidden;background:var(--tint)">'+fotoHTML+'</div>':'')+
    '<div class="machine-card-top" onclick="event.stopPropagation()"><div class="machine-hero-icon" style="overflow:hidden">'+(pix?fotoHTML:'<svg class="ic ic-lg"><use href="'+iconOf(m)+'"/></svg>')+'</div>'+badge+'</div>'+
    '<h3>'+esc(mLabel(m))+'</h3><div class="serial">SN '+esc(m.serial||'—')+(clientView?'':' · '+esc(c?c.name:'—'))+'</div>'+
    '<div class="meter"><div><div class="small">Horómetro</div><div class="big">'+nf(m.hours)+' h</div></div><button class="outline-btn" onclick="APP.openHours(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-gauge"/></svg>Actualizar</button></div>'+
    '<div class="progress"><div style="width:'+info.pct+'%'+(info.state==='overdue'?';background:var(--red)':'')+'"></div></div>'+
    '<div class="small">Revisión cada '+nf(m.intervalH)+' h / '+m.intervalM+' meses · '+esc(info.label)+(m.serviceGroup&&SERVICE_GROUPS[m.serviceGroup]?' · '+esc(SERVICE_GROUPS[m.serviceGroup].name):'')+'</div>'+
    '<div class="machine-meta"><div class="meta">Garantía<span>'+(info.warrantyLeft==null?'—':(info.warrantyLeft>0?fmtDate(m.warrantyEnd):'Finalizada'))+'</span></div><div class="meta">Entrega<span>'+fmtDate(m.lastServiceDate)+'</span></div>'+
    '<div class="meta">Precio venta<span>'+(m.salePrice?money(m.salePrice):'—')+'</span></div><div class="meta">Precio revisión<span>'+(m.servicePriceTBD?'A confirmar':(m.servicePrice?money(m.servicePrice):'—'))+'</span></div></div>'+
    '<div class="action-row">'+actions+'</div></div>';
}
function emptyHTML(icon,text){return '<div class="empty"><svg class="ic"><use href="'+icon+'"/></svg><div>'+text+'</div></div>'}

function renderDashboard(){
  const open=db.ots.filter(o=>otAbierta(o));
  const overdue=db.machines.filter(m=>dueInfo(m).state==='overdue');
  const soon=db.machines.filter(m=>dueInfo(m).state==='soon');
  $('#dashKpis').innerHTML=
    kpi('t-lime','i-tractor',nf(db.machines.length),'Máquinas gestionadas',db.machines.length+' en '+db.clients.length+' clientes',null,'machines')+
    kpi('t-blue','i-clock',nf(soon.length),'Servicios próximos','próximas 50 h / 30 días',null,'workshop')+
    kpi('t-amber','i-wrench',nf(open.length),'Órdenes abiertas',open.filter(o=>o.status==='taller').length+' en taller',null,'workshop')+
    kpi('t-red','i-alert',nf(overdue.length),'Mantenimientos vencidos',overdue.length?'requieren acción':'todo al día',!!overdue.length,'machines-alert');
  const prior=urgencySort(db.machines).filter(m=>dueInfo(m).state!=='ok');
  $('#dashTable').innerHTML=prior.length
    ?'<table><thead><tr><th>Equipo</th><th>Cliente</th><th>Próximo servicio</th><th>Estado</th><th>Avisar</th></tr></thead><tbody>'+prior.map(machineRowHTML).join('')+'</tbody></table>'
    :emptyHTML('#i-checkc','Ninguna máquina en alerta. Actualizá horas o registrá máquinas para ver los avisos.');
  const feed=db.notifs.filter(n=>n.audience==='admin').slice(0,6);
  $('#dashFeed').innerHTML=feed.length?feed.map(n=>
    '<div class="timeline-item"><div class="ticon"><svg class="ic ic-sm"><use href="#'+n.icon+'"/></svg></div><div><div class="tname">'+esc(n.title)+'</div><div class="tdetail">'+esc(n.detail)+'</div></div><div class="date">'+fmtTs(n.ts)+'</div></div>'
  ).join(''):emptyHTML('#i-bell','Sin actividad todavía.');
  const now=new Date(),y=now.getFullYear(),mo=now.getMonth();
  let hechos=0,cobrados=0,porCobrar=0,fact=0,acept=0,espera=0,rech=0,bloq=0,bloqPiezas=0,bloqAut=0,bloqTec=0;
  db.ots.forEach(o=>{
    if(o.status==='terminada'){
      const c=new Date(o.closedAt||0);
      if(c.getFullYear()===y&&c.getMonth()===mo){
        hechos++;
        if(o.invoiced){cobrados++;fact+=Number(o.invoiceBase||0)*(1+Number(o.invoiceIva||0)/100)}
        else porCobrar++;
      }
    }else{
      if(o.cita==='confirmada')acept++;
      else if(o.cita==='propuesta')espera++;
      else if(o.cita==='rechazada')rech++;
      if(o.status==='bloqueada'){bloq++;if(o.bloqueo==='pieza')bloqPiezas++;else if(o.bloqueo==='autorizacion')bloqAut++;else bloqTec++}
    }
  });
  $('#dashServ').innerHTML=
    '<div class="mini-row"><span>Servicios completados</span><b>'+hechos+'</b></div>'+
    '<div class="mini-row"><span>Cobrados</span><b style="color:#2b724b">'+cobrados+' · '+money(fact)+'</b></div>'+
    '<div class="mini-row"><span>Por cobrar</span><b style="color:'+(porCobrar?'#946713':'var(--muted)')+'">'+porCobrar+'</b></div>'+
    '<div class="mini-row"><span>Turnos aceptados</span><b>'+acept+'</b></div>'+
    '<div class="mini-row"><span>Esperando respuesta del cliente</span><b>'+espera+'</b></div>'+
    '<div class="mini-row"><span>Rechazados (reprogramar)</span><b style="color:'+(rech?'#ac4136':'var(--muted)')+'">'+rech+'</b></div>'+
    '<div class="mini-row"><span>Bloqueadas ahora</span><b style="color:'+(bloq?'#ac4136':'var(--muted)')+'">'+(bloq?bloq+' ('+bloqPiezas+' pieza · '+bloqAut+' autorización · '+bloqTec+' técnico)':'0')+'</b></div>';
  const recientes=db.ots.filter(o=>o.status==='terminada').sort((a,b)=>(b.closedAt||0)-(a.closedAt||0)).slice(0,6);
  $('#dashRecent').innerHTML=recientes.length?'<table><tbody>'+recientes.map(o=>{
    const m=machineOf(o.machineId),c=m?clientOf(m.clientId):null;
    const d=new Date(o.closedAt||0);
    return '<tr class="rowlink" onclick="APP.viewReport(\''+o.id+'\')"><td><b>'+String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'</b></td>'+
      '<td>'+esc(m?mLabel(m):'—')+'<div class="small">'+esc(c?c.name:'')+'</div></td>'+
      '<td>'+esc(trunc(o.workDone||o.issue||o.type,34))+'</td>'+
      '<td>'+(o.invoiced?'<span class="badge ok">Cobrado</span>':'<span class="badge warn">Por cobrar</span>')+'</td></tr>';
  }).join('')+'</tbody></table>':emptyHTML('#i-checkc','Todavía no hay servicios completados.');
}
function kpi(tile,icon,value,label,trend,red,go){
  const onclick=go?(' onclick="'+(go==='machines-alert'?'APP.goAlert()':"APP.gotoPage('"+go+"')")+'" style="cursor:pointer"'):'';
  return '<div class="card kpi hov"'+onclick+'><div class="kpi-top"><div class="tile '+tile+'"><svg class="ic"><use href="#'+icon+'"/></svg></div>'+(trend?'<span class="trend"'+(red?' style="background:var(--red-soft);color:#a33"':'')+'>'+esc(trend)+'</span>':'')+'</div><div class="value">'+value+'</div><div class="label">'+esc(label)+'</div></div>';
}

function renderClients(){
  const t=$('#cliTable');
  if(!db.clients.length){t.innerHTML=emptyHTML('#i-users','Todavía no hay clientes. Creá el primero con «Nuevo cliente».');return}
  t.innerHTML='<table><thead><tr><th>Cliente</th><th>Contacto</th><th>CUIT</th><th>Equipos</th><th>Venta equipos</th><th>Próx. servicio</th><th></th></tr></thead><tbody>'+
    db.clients.map(c=>{
      const ms=machinesOf(c.id);
      const worst=ms.length?urgencySort(ms)[0]:null;
      const wi=worst?dueInfo(worst):null;
      const ventas=ms.reduce((s,m)=>s+Number(m.salePrice||0),0);
      return '<tr><td><b>'+esc(c.name)+'</b><div class="small">'+esc(c.phone||'')+'</div></td>'+
        '<td>'+esc(c.contact||'—')+'<div class="small">'+esc(c.email||'')+'</div></td>'+
        '<td>'+esc(c.cuit||'—')+'</td>'+
        '<td>'+ms.length+'</td>'+
        '<td>'+(ventas?money(ventas):'—')+'</td>'+
        '<td>'+(wi?esc(wi.label):'—')+'</td>'+
        '<td><button class="outline-btn" onclick="APP.openClientModal(\''+c.id+'\')"><svg class="ic ic-xs"><use href="#i-cog"/></svg>Editar</button></td></tr>';
    }).join('')+'</tbody></table>';
}

function renderMachines(){
  const clients=db.clients.map(c=>'<button class="filter'+(machFilter===c.id?' active':'')+'" onclick="APP.setMachFilter(\''+c.id+'\')">'+esc(c.name)+' '+machinesOf(c.id).length+'</button>').join('');
  $('#machFilters').innerHTML='<button class="filter'+(machFilter==='all'?' active':'')+'" onclick="APP.setMachFilter(\'all\')">Todos '+db.machines.length+'</button>'+clients+
    '<button class="filter'+(machFilter==='alert'?' active':'')+'" onclick="APP.setMachFilter(\'alert\')">Con alerta '+db.machines.filter(m=>dueInfo(m).state!=='ok').length+'</button>';
  let list=db.machines.slice();
  if(machFilter==='alert')list=list.filter(m=>dueInfo(m).state!=='ok');
  else if(machFilter!=='all')list=list.filter(m=>m.clientId===machFilter);
  $('#machGrid').innerHTML=list.length?list.map(m=>machineCardHTML(m,false)).join(''):emptyHTML('#i-tractor','No hay máquinas con este filtro.');
}
const MES_CORTO=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIA_SEM=['dom','lun','mar','mié','jue','vie','sáb'];
const DIA_SEM_L=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
function dayLabel(iso){
  const t=new Date();t.setHours(0,0,0,0);
  const d=new Date(iso+'T00:00:00');
  const diff=Math.round((d-t)/86400000);
  if(diff===0)return 'Hoy';
  if(diff===1)return 'Mañana';
  return DIA_SEM_L[d.getDay()]+' '+Number(iso.slice(8,10))+'/'+Number(iso.slice(5,7));
}
let wsDaySel=null,wsWeekOff=0,wsFilter=null,wsMode='agenda',wsView='semana',wsMonthOff=0;
function wsOpenCitas(){return db.ots.filter(o=>otAbierta(o)&&o.proposedDate&&o.cita==='confirmada')}
function wsCounts(){
  const today=todayISO();const open=db.ots.filter(o=>otAbierta(o));
  const curso=open.filter(o=>['recibida','diagnostico','presupuesto','taller'].includes(o.status));
  return{
    confirmar:open.filter(o=>['solicitada','propuesta','rechazada'].includes(o.cita)).length,
    hoy:open.filter(o=>o.proposedDate===today&&o.cita==='confirmada').length,
    curso:curso.length,
    sinfecha:curso.filter(o=>!o.proposedDate).length,
    bloqueada:open.filter(o=>o.status==='bloqueada').length,
    entrega:db.ots.filter(o=>o.status==='terminada'&&!o.signature).length
  };
}
const WS_FILTERS=[
  {k:'confirmar',icon:'i-clock',col:'var(--amber)',l:'Por confirmar',d:'turnos sin resolver'},
  {k:'hoy',icon:'i-checkc',col:'var(--green2)',l:'Confirmados hoy',d:'agenda del día'},
  {k:'curso',icon:'i-wrench',col:'var(--blue)',l:'En taller',d:'órdenes en curso'},
  {k:'bloqueada',icon:'i-alert',col:'var(--red)',l:'Bloqueadas',d:'atascos del taller'},
  {k:'entrega',icon:'i-send',col:'var(--green)',l:'Para entregar',d:'retiro y firma'}
];
function renderWsStatus(){
  const c=wsCounts();
  document.getElementById('wsStatus').innerHTML=WS_FILTERS.map(f=>{
    const sub=f.k==='curso'&&c.sinfecha?c.sinfecha+' sin fecha asignada':f.d;
    return '<div class="schip'+(wsFilter===f.k?' sel':'')+'" onclick="APP.setWsFilter(\''+f.k+'\')" title="Ver esta lista">'+
    '<svg class="ic ic-sm" style="position:absolute;top:10px;right:10px;opacity:.55;color:'+f.col+'"><use href="#'+f.icon+'"/></svg>'+
    '<div class="v"'+(wsFilter===f.k?'':' style="color:'+f.col+'"')+'>'+c[f.k]+'</div><div class="l">'+f.l+'</div><div class="sd">'+sub+'</div></div>';
  }).join('');
}
function isoOf(ts){const d=new Date(ts);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function wsDoneOf(iso){return db.ots.filter(o=>o.status==='terminada'&&isoOf(o.closedAt||o.createdAt)===iso)}
function renderWsStatsLine(){
  const el=document.getElementById('wsStats');
  const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+wsMonthOff);
  const y=base.getFullYear(),mo=base.getMonth();
  let turnos=0,conf=0,hechos=0,fact=0,demoraSum=0,demoraN=0;
  db.ots.forEach(o=>{
    if(o.proposedDate&&((o.cita==='confirmada')||o.status==='terminada')){const d=new Date(o.proposedDate+'T00:00:00');if(d.getFullYear()===y&&d.getMonth()===mo){turnos++;conf++}}
    if(o.status==='terminada'){
      const c=new Date(o.closedAt||0);
      if(c.getFullYear()===y&&c.getMonth()===mo){
        hechos++;fact+=(o.invoiced?(Number(o.invoiceBase||0)*(1+Number(o.invoiceIva||0)/100)):0);
        const dd=(o.closedAt-o.createdAt)/86400000;if(dd>=0){demoraSum+=dd;demoraN++}
      }
    }
  });
  if(wsMode==='agenda'){
    el.innerHTML='<b style="color:var(--ink)">'+base.toLocaleDateString('es-AR',{month:'long'})+':</b> '+conf+' turnos confirmados · '+hechos+' completados';
  }else{
    const dm=demoraN?(demoraSum/demoraN).toFixed(1):'0';
    el.innerHTML='<b style="color:var(--ink)">'+base.toLocaleDateString('es-AR',{month:'long',year:'numeric'})+':</b> '+hechos+' trabajos completados · facturado '+money(fact)+' · demora media '+dm+' días';
  }
}
function weekStrip(){
  const base=new Date();base.setHours(0,0,0,0);
  const dow=(base.getDay()+6)%7;
  const monday=new Date(base);monday.setDate(monday.getDate()-dow+wsWeekOff*7);
  const counts={};
  wsOpenCitas().forEach(o=>{counts[o.proposedDate]=(counts[o.proposedDate]||0)+1});
  let html='';
  for(let i=0;i<7;i++){
    const d=new Date(monday);d.setDate(d.getDate()+i);
    const iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    html+='<div class="wscal-d'+(iso===todayISO()?' today':'')+(iso===wsDaySel?' sel':'')+'" onclick="APP.setWsDay(\''+iso+'\')">'+
      '<div class="dw">'+DIA_SEM[d.getDay()]+'</div><div class="dn">'+d.getDate()+'</div>'+
      (counts[iso]?'<div class="cnt">'+counts[iso]+'</div>':'')+'</div>';
  }
  return '<div class="wscal">'+html+'</div>';
}
function monthGrid(hist){
  const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+wsMonthOff);
  const y=base.getFullYear(),mo=base.getMonth();
  const first=new Date(y,mo,1);
  const startDow=(first.getDay()+6)%7;
  const dim=new Date(y,mo+1,0).getDate();
  const today=todayISO();
  const counts={};
  if(hist){db.ots.forEach(o=>{if(o.status==='terminada'){const iso=isoOf(o.closedAt||o.createdAt);counts[iso]=(counts[iso]||0)+1}})}
  else{wsOpenCitas().forEach(o=>{if(o.proposedDate>=today)counts[o.proposedDate]=(counts[o.proposedDate]||0)+1})}
  let cells='';
  ['lun','mar','mié','jue','vie','sáb','dom'].forEach(d=>cells+='<div class="mcal-h">'+d+'</div>');
  for(let b=0;b<startDow;b++)cells+='<div class="mcal-d off"></div>';
  for(let d=1;d<=dim;d++){
    const iso=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const dis=hist&&iso>today;
    cells+='<div class="mcal-d'+(iso===today?' today':'')+(iso===wsDaySel?' sel':'')+(dis?' off':'')+'"'+(dis?'':' onclick="APP.setWsDay(\''+iso+'\')"')+'><div class="dn">'+d+'</div>'+(counts[iso]?'<div class="cnt">'+counts[iso]+'</div>':'')+'</div>';
  }
  return '<div class="mcal">'+cells+'</div>';
}
function renderCalendar(){
  const wrap=document.getElementById('wsCalWrap');
  let html='<div class="filters" style="margin:0 0 12px">';
  html+='<button class="filter'+(wsMode==='agenda'?' active':'')+'" onclick="APP.setCalMode(\'agenda\')">Agenda</button>';
  html+='<button class="filter'+(wsMode==='historico'?' active':'')+'" onclick="APP.setCalMode(\'historico\')">Histórico</button>';
  if(wsMode==='agenda'){
    html+='<button class="filter'+(wsView==='semana'?' active':'')+'" onclick="APP.setCalView(\'semana\')" style="margin-left:10px">Semana</button>';
    html+='<button class="filter'+(wsView==='mes'?' active':'')+'" onclick="APP.setCalView(\'mes\')">Mes</button>';
  }else{
    const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+wsMonthOff);
    html+='<span class="filter" style="background:transparent;color:var(--muted);cursor:default">'+base.toLocaleDateString('es-AR',{month:'long',year:'numeric'})+'</span>';
  }
  html+='</div>';
  html+=wsMode==='agenda'?(wsView==='semana'?weekStrip():monthGrid(false)):monthGrid(true);
  wrap.innerHTML=html;
  renderWsDay();renderWsStatsLine();
}
function aptCardHTML(o,withActions){
  const m=machineOf(o.machineId),c=m?clientOf(m.clientId):null;
  const conf=o.cita==='confirmada';
  let actions='';
  if(withActions){
    actions='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px" onclick="event.stopPropagation()">'+
      '<button class="outline-btn" onclick="APP.openOtInfo(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-bulb"/></svg>Nota</button>'+
      '<button class="outline-btn" onclick="APP.openTasks(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-clip"/></svg>Tareas'+(o.tasks&&o.tasks.length?' '+o.tasks.filter(t=>t.done).length+'/'+o.tasks.length:'')+'</button>'+
      '<button class="outline-btn" onclick="APP.openTurno(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-cal"/></svg>'+(o.proposedDate?'Cambiar día':'Agendar')+'</button>'+
      '<button class="solid-btn" onclick="APP.openDone(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Cerrar</button>'+
      (m?'<button class="mini-btn wa" title="WhatsApp al cliente" onclick="APP.notifyWA(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-send"/></svg></button>':'')+
      '</div>';
  }
  return '<div class="apt" style="cursor:pointer" onclick="APP.openOtInfo(\''+o.id+'\')">'+
    '<div class="apt-time"><div>'+Number(o.proposedDate.slice(8,10))+'</div><span>'+MES_CORTO[Number(o.proposedDate.slice(5,7))-1]+(o.proposedTime?' · '+esc(o.proposedTime):'')+'</span></div>'+
    '<div style="flex:1;min-width:0"><b>'+esc(m?mLabel(m):'—')+'</b> '+(conf?'<span class="badge ok">Confirmado</span>':'<span class="badge warn">Espera respuesta</span>')+
    '<div class="small">'+esc(c?c.name:'—')+(c&&c.phone?' · '+esc(c.phone):'')+(m&&m.serial?' · SN '+esc(m.serial):'')+'</div>'+
    '<div class="small">'+esc(o.type)+(o.issue?' · '+esc(o.issue):'')+'</div>'+
    (o.note?'<div class="small" style="color:var(--green2)">Nota: '+esc(o.note)+'</div>':'')+
    '</div>'+actions+'</div>';
}
function renderWsDay(){
  const el=document.getElementById('wsDay');
  if(!wsDaySel){el.innerHTML='<div class="small" style="padding:4px 2px">Tocá un día del calendario para ver sus turnos y actuar sobre ellos.</div>';document.getElementById('wsCalSub').textContent='Tocá un día para ver y actuar sobre sus turnos.';return}
  const list=(wsMode==='historico'?[]:wsOpenCitas().filter(o=>o.proposedDate===wsDaySel))
    .sort((a,b)=>(a.proposedTime||'').localeCompare(b.proposedTime||''));
  const done=wsDoneOf(wsDaySel);
  document.getElementById('wsCalSub').textContent=dayLabel(wsDaySel)+' · '+list.length+' turno'+(list.length===1?'':'s')+(done.length?' · '+done.length+' completado'+(done.length===1?'':'s'):'');
  let html=list.map(o=>aptCardHTML(o,true)).join('');
  if(done.length){
    html+='<div class="agenda-day">Completados este día</div>'+done.map(function(o){
      const m=machineOf(o.machineId),c=m?clientOf(m.clientId):null;
      const firma=o.signature?'<span class="badge ok">Firmado por el cliente ✓</span>':(o.ready?'<span class="badge warn">Retiro desde '+fmtDate(o.pickupDate||todayISO())+(o.pickupTime?' '+o.pickupTime:'')+'</span>':'');
      const demora=Math.max(0,Math.round((o.closedAt-o.createdAt)/86400000));
      return '<div class="apt done"><div class="apt-time" style="background:var(--tint);color:#335"><div>✓</div><span>'+esc(o.workDone?o.workDone.slice(0,10):o.type)+'</span></div>'+
        '<div style="flex:1;min-width:0"><b>'+esc(m?mLabel(m):'—')+'</b> <span class="badge ok">Completado</span> '+firma+
        '<div class="small">'+esc(c?c.name:'—')+(m&&m.serial?' · SN '+esc(m.serial):'')+' · '+esc(o.tech||'—')+' · tardó '+demora+' día'+(demora===1?'':'s')+'</div>'+
        '<div class="small">'+esc(o.workDone||o.issue||o.type)+'</div></div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap" onclick="event.stopPropagation()">'+
        '<button class="outline-btn" onclick="APP.openReport(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-file"/></svg>Informe</button>'+
        '<button class="outline-btn" onclick="APP.openInvoice(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-printer"/></svg>Factura</button>'+
        (!o.ready?'<button class="solid-btn" onclick="APP.markReady(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-send"/></svg>Avisar retiro</button>':'')+
        (o.ready&&!o.signature?'<button class="solid-btn" onclick="APP.openClientSign(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Firmar</button>':'')+
        '</div></div>';
    }).join('');
  }
  el.innerHTML=html||emptyHTML('#i-cal','Sin turnos este día.');
}
const WS_TITLES={confirmar:'Turnos por confirmar',hoy:'Confirmados para hoy',curso:'En taller — órdenes en curso',bloqueada:'Bloqueadas — atascos del taller',entrega:'Para entregar — retiro y firma'};
function reqCardHTML(o){
  const m=machineOf(o.machineId),c=m?clientOf(m.clientId):null;
  let color='var(--line)',state=OT_ESTADOS[o.status]||o.status,btn='Agendar';btn=(o.status==='bloqueada')?'Ver':btn;
  if(o.status==='bloqueada'){color='var(--red)';state='Bloqueada: '+(o.bloqueo==='pieza'?'falta repuesto':(o.bloqueo==='autorizacion'?'falta autorización':'falta técnico'))}
  else if(o.status==='presupuesto'){color='var(--amber)';state='Presupuesto '+money((o.presupuesto&&o.presupuesto.base||0)*(1+(o.presupuesto&&o.presupuesto.iva||0)/100))+' — cliente aprueba'}
  else if(o.status==='diagnostico'){color='var(--blue)';state='En diagnóstico'}
  else if(o.status==='recibida'&&o.type!=='Cita preventiva'){color='var(--blue)';state='Recibida — diagnosticar'}
  let act='APP.openTurno(\''+o.id+'\')';
  if(o.cita==='solicitada'){color='var(--blue)';state='Pedido — proponer día';btn='Proponer turno'}
  else if(o.cita==='propuesta'){color='var(--amber)';state='Propuesto '+fmtDate(o.proposedDate)+' — espera respuesta';btn='Cambiar propuesta'}
  else if(o.cita==='rechazada'){color='var(--red)';state='Rechazó el '+fmtDate(o.proposedDate);btn='Nuevo turno'}
  else if(o.proposedDate){color='var(--green2)';state='Confirmado '+fmtDate(o.proposedDate);btn='Cambiar día'}
  else if(o.status==='terminada'&&!o.ready){color='var(--blue)';state='Terminada — falta avisar retiro';btn='Avisar retiro';act='APP.markReady(\''+o.id+'\')'}
  else if(o.status==='terminada'){color='var(--green2)';state='Retiro desde '+fmtDate(o.pickupDate||todayISO())+(o.pickupTime?' '+o.pickupTime:'')+' — falta firma';btn='Firmar en mostrador';act='APP.openClientSign(\''+o.id+'\')'}
  return '<div class="req" style="border-left-color:'+color+'" onclick="APP.openOtInfo(\''+o.id+'\')">'+
    '<div style="flex:1;min-width:210px"><b>'+esc(o.id)+'</b> · '+esc(c?c.name:'—')+
    '<div class="small">'+esc(m?mLabel(m):'')+(m&&m.serial?' · SN '+esc(m.serial):'')+' · '+esc(o.type)+'</div></div>'+
    '<span class="small" style="white-space:nowrap">'+state+'</span>'+
    '<button class="solid-btn" onclick="event.stopPropagation();'+act+'"><svg class="ic ic-xs"><use href="#i-cal"/></svg>'+btn+'</button>'+
    '</div>';
}
function renderWsReqs(){
  const el=document.getElementById('wsReqs');
  const title=document.getElementById('wsReqTitle');
  let items=[];
  if(wsFilter==='confirmar')items=db.ots.filter(o=>otAbierta(o)&&['solicitada','propuesta','rechazada'].includes(o.cita));
  else if(wsFilter==='curso')items=db.ots.filter(o=>['recibida','diagnostico','presupuesto','taller'].includes(o.status));
  else if(wsFilter==='bloqueada')items=db.ots.filter(o=>o.status==='bloqueada');
  else if(wsFilter==='entrega')items=db.ots.filter(o=>o.status==='terminada'&&!o.signature);
  else if(wsFilter==='hoy')items=wsOpenCitas().filter(o=>o.proposedDate===todayISO());
  if(wsFilter){
    title.textContent=WS_TITLES[wsFilter]+' · '+items.length;
    el.innerHTML=items.length?items.map(reqCardHTML).join(''):emptyHTML('#i-checkc','Nada pendiente acá ✓');
    return;
  }
  title.textContent='Turnos por confirmar';
  const sol=db.ots.filter(o=>otAbierta(o)&&o.cita==='solicitada');
  const pro=db.ots.filter(o=>otAbierta(o)&&o.cita==='propuesta');
  const rec=db.ots.filter(o=>otAbierta(o)&&o.cita==='rechazada');
  let html='';
  if(sol.length)html+='<div class="agenda-day" style="margin-top:0">Turnos pedidos · '+sol.length+'</div>'+sol.map(reqCardHTML).join('');
  if(pro.length)html+='<div class="agenda-day">Esperando respuesta del cliente · '+pro.length+'</div>'+pro.map(reqCardHTML).join('');
  if(rec.length)html+='<div class="agenda-day">Rechazados — proponer otro día · '+rec.length+'</div>'+rec.map(reqCardHTML).join('');
  el.innerHTML=html||emptyHTML('#i-checkc','Sin turnos por confirmar — todo resuelto ✓');
}
function renderTemplates(){
  const el=document.getElementById('tplPage');
  el.innerHTML=Object.keys(SERVICE_GROUPS).map(gk=>{
    const g=SERVICE_GROUPS[gk];
    const puntosGrupo=g.byService?g.services.reduce((s,x)=>s+x.tasks.length,0):g.checklist.reduce((s,c)=>s+c.items.length,0);
    let html='<div class="card section-card" style="margin-bottom:16px">'+
      '<div class="section-head" style="margin-bottom:8px"><div><div class="section-title">'+esc(g.name)+'</div><div class="section-sub">'+g.services.length+' tipos de service · '+puntosGrupo+' puntos en total'+(g.oils?' · ficha de aceites':'')+'</div></div></div>'+
      g.services.map(s=>'<details class="svcdet"><summary><b>'+s.n+' · '+esc(s.t)+'</b><span>'+s.tasks.length+' puntos</span></summary><ul>'+s.tasks.map(tk=>'<li>'+esc(tk)+'</li>').join('')+'</ul></details>').join('');
    if(!g.byService){
      g.checklist.forEach(sec=>{html+='<details class="svcdet"><summary><b>'+esc(sec.sec)+'</b><span>'+sec.items.length+' puntos</span></summary><ul>'+sec.items.map(it=>'<li>'+esc(it)+'</li>').join('')+'</ul></details>'});
    }
    if(g.oils){
      html+='<details class="svcdet"><summary><b>Aceites y capacidades</b><span>ficha técnica</span></summary><table><thead><tr><th>Modelo</th><th>Capacidades y tipos</th></tr></thead><tbody>'+
        g.oils.map(o=>'<tr><td><b>'+esc(o[0])+'</b></td><td>'+esc(o[1])+'</td></tr>').join('')+'</tbody></table></details>';
    }
    return html+'</div>';
  }).join('');
}
function renderWorkshop(){
  renderWsStatus();renderCalendar();renderWsReqs();
  const t=$('#otTable');
  if(!db.ots.length){t.innerHTML=emptyHTML('#i-wrench','Sin órdenes de trabajo. Creá una desde «Nueva OT» o desde una máquina.');return}
  const order={cita:0,recibida:1,diagnostico:2,presupuesto:3,bloqueada:4,taller:5,terminada:6,anulada:7};
  const rows=db.ots.slice().sort((a,b)=>(order[a.status]-order[b.status])||String(b.id).localeCompare(String(a.id))).map(o=>{
    const m=machineOf(o.machineId),c=m?clientOf(m.clientId):null;
    const badge={recibida:'info',diagnostico:'info',presupuesto:'warn',bloqueada:'bad',cita:'warn',taller:'warn',terminada:'ok',anulada:'bad'}[o.status]||'info';
    const label=OT_ESTADOS[o.status]||o.status;
    const origin=o.origin==='cliente'?'<span class="badge info" style="margin-left:6px">Portal cliente</span>':'';
    const CITA_STATE={
      solicitada:'<span class="badge info">Turno solicitado — proponer día</span>',
      propuesta:'<span class="badge warn">Propuesto '+fmtDate(o.proposedDate)+' — espera respuesta</span>',
      confirmada:'<span class="badge ok">Confirmado '+fmtDate(o.proposedDate)+'</span>',
      rechazada:'<span class="badge bad">Rechazado — proponer otro día</span>'
    };
    const citaBadge=(o.type==='Cita preventiva'&&otAbierta(o))?('<div style="margin-top:5px">'+(CITA_STATE[o.cita||'solicitada']||'')+'</div>'):'';
    const retiroBadge=(o.status==='terminada')?('<div style="margin-top:5px">'+(o.signature?'<span class="badge ok">Firmado por el cliente ✓</span>':(o.ready?'<span class="badge warn">Retiro desde '+fmtDate(o.pickupDate||todayISO())+(o.pickupTime?' '+o.pickupTime:'')+' — falta firma</span>':'<span class="badge info">Terminada — falta avisar retiro</span>'))+'</div>'):'';
    let action='';
    const tasksBtn='<button class="outline-btn" onclick="APP.openTasks(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-clip"/></svg>Tareas'+(o.tasks&&o.tasks.length?' '+o.tasks.filter(t=>t.done).length+'/'+o.tasks.length:'')+'</button>';
    if(o.status==='anulada'){
      action='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'+tasksBtn+'<span class="badge bad">Anulada'+(o.anuladaMotivo?' — '+esc(o.anuladaMotivo.slice(0,26)):'')+'</span></div>';
    }else if(otAbierta(o)){
      let lbl=null;
      if(o.type==='Cita preventiva')lbl=(o.cita==='confirmada'?'Cambiar día':(o.cita==='rechazada'?'Nuevo turno':'Proponer turno'));
      else if(!o.proposedDate)lbl='Agendar';
      action='<div style="display:flex;gap:6px;flex-wrap:wrap">'+tasksBtn+
        (lbl?'<button class="solid-btn" onclick="APP.openTurno(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-cal"/></svg>'+lbl+'</button>':'')+
        '<button class="solid-btn" onclick="APP.openDone(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Cerrar</button></div>';
    }else{
      action='<div style="display:flex;gap:6px;flex-wrap:wrap">'+tasksBtn+
        '<button class="outline-btn" onclick="APP.openDone(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-cog"/></svg>Editar cierre</button>'+
        '<button class="outline-btn" onclick="APP.openReport(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-file"/></svg>Informe</button>'+
        '<button class="outline-btn" onclick="APP.openInvoice(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-printer"/></svg>'+(o.invoiced?'Ver factura':'Factura')+'</button>'+
        (!o.ready?'<button class="solid-btn" onclick="APP.markReady(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-send"/></svg>Avisar retiro</button>':'')+
        (o.ready&&!o.signature?'<button class="solid-btn" onclick="APP.openClientSign(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Firmar en mostrador</button>':'')+
        '</div>';
    }
    const sel='<select class="statussel" onchange="APP.setOTStatus(\''+o.id+'\',this.value)">'+
      ['cita','recibida','diagnostico','presupuesto','bloqueada','taller','terminada'].map(s=>'<option value="'+s+'"'+(s===o.status?' selected':'')+'>'+OT_ESTADOS[s]+'</option>').join('')+'</select>';
    const bloqueoBadge=(o.status==='bloqueada')?'<div style="margin-top:4px"><span class="badge bad">'+(o.bloqueo==='pieza'?'Falta repuesto':(o.bloqueo==='autorizacion'?'Falta autorización':'Falta técnico'))+(o.bloqueoNota?' — '+esc(o.bloqueoNota.slice(0,26)):'')+'</span></div>':'';
    const actor=otNextActor(o);
    return '<tr><td><b>'+esc(o.id)+'</b>'+citaBadge+retiroBadge+bloqueoBadge+(actor?'<div class="small" style="color:var(--green2);margin-top:3px">'+esc(actor)+'</div>':'')+'</td><td>'+esc(m?mLabel(m):'—')+'<div class="small">'+esc(c?c.name:'')+(m&&m.serial?' · SN '+esc(m.serial):'')+'</div></td>'+
      '<td>'+esc(o.type)+'<div class="small">'+esc(o.issue||'')+'</div></td><td>'+esc(o.responsable||o.tech||'—')+(o.fechaPrevista?'<div class="small">Prevista: '+fmtTs(o.fechaPrevista).slice(0,5)+'</div>':'')+origin+'</td><td>'+sel+'</td><td>'+action+'</td></tr>';
  }).join('');
  t.innerHTML='<table><thead><tr><th>OT</th><th>Máquina</th><th>Trabajo</th><th>Técnico</th><th>Estado</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>';
}
function renderParts(){
  const t=$('#partsTable');
  if(!db.parts.length){t.innerHTML=emptyHTML('#i-package','Todavía no hay repuestos cargados.');return}
  t.innerHTML='<table><thead><tr><th>Ref.</th><th>Descripción</th><th>Stock</th><th>Mínimo</th><th>Estado</th></tr></thead><tbody>'+
    db.parts.map(p=>'<tr><td><b>'+esc(p.ref)+'</b></td><td>'+esc(p.name)+'</td>'+
    '<td><span class="stepper"><button onclick="APP.stockDelta(\''+p.id+'\',-1)">−</button><b style="min-width:30px;text-align:center">'+p.stock+'</b><button onclick="APP.stockDelta(\''+p.id+'\',1)">+</button></span></td>'+
    '<td>'+p.min+'</td><td>'+(p.stock<p.min?'<span class="badge bad">Reponer</span>':'<span class="badge ok">Correcto</span>')+'</td></tr>').join('')+'</tbody></table>';
}
function renderReports(){
  const done=db.ots.filter(o=>o.status==='terminada');
  const prev=done.filter(o=>String(o.type).includes('preventi')||String(o.type).includes('Revisión')).length;
  const facturado=db.ots.reduce((s,o)=>s+(o.invoiced?(Number(o.invoiceBase||0)*(1+Number(o.invoiceIva||0)/100)):0),0);
  const ventas=db.machines.reduce((s,m)=>s+Number(m.salePrice||0),0);
  $('#repKpis').innerHTML=
    kpi('t-lime','i-checkc',money(facturado),'Facturado (servicios)','OTs facturadas')+
    kpi('t-blue','i-tractor',money(ventas),'Ventas registradas','valor de los equipos')+
    kpi('t-green','i-wrench',nf(done.length),'Servicios completados','histórico')+
    kpi('t-amber','i-clock',(done.length?Math.round(prev/done.length*100):0)+'%','Preventivos sobre total','más previsible');
  const months=[],sums=[];
  for(let i=5;i>=0;i--){
    const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);
    months.push(d.toLocaleDateString('es-AR',{month:'short'}));
    sums.push(db.ots.reduce((s,o)=>{
      if(!o.invoiced)return s;
      const c=new Date(o.closedAt||o.createdAt);
      return s+((c.getMonth()===d.getMonth()&&c.getFullYear()===d.getFullYear())?(Number(o.invoiceBase||0)*(1+Number(o.invoiceIva||0)/100)):0);
    },0));
  }
  const max=Math.max(1,...sums);
  if(!sums.some(v=>v>0)){
    $('#repBars').innerHTML='<div style="margin:auto;text-align:center;color:var(--muted);font-size:13.5px;line-height:1.5;padding:0 18px;max-width:420px">Todavía no hay órdenes facturadas. Cuando factures la primera, acá vas a ver la evolución mes a mes.</div>';
    $('#repMonths').innerHTML='';
    return;
  }
  $('#repBars').innerHTML=sums.map(v=>'<div class="bar" style="height:'+Math.max(4,v/max*100)+'%" data-v="'+money(v)+'"></div>').join('');
  $('#repMonths').innerHTML=months.map(m=>'<span>'+m+'</span>').join('');
}
function renderSettings(){
  const biz=db.meta.biz||{};
  $('#bizName').value=biz.name||'';$('#bizCif').value=biz.cif||'';
  $('#bizPhone').value=biz.phone||'';$('#bizCity').value=biz.city||'';
  $('#setStats').innerHTML=
    '<div class="kv"><span>Clientes</span><b>'+db.clients.length+'</b></div>'+
    '<div class="kv"><span>Máquinas</span><b>'+db.machines.length+'</b></div>'+
    '<div class="kv"><span>Órdenes de trabajo</span><b>'+db.ots.length+'</b></div>'+
    '<div class="kv"><span>'+(NUBE.on?'Dónde se guardan':'Tamaño de los datos')+'</span><b>'+(NUBE.on?'En la nube':storageOk?Math.round((localStorage.getItem(DB_KEY)||'').length/1024)+' KB':'—')+'</b></div>';
  try{
    const raw=localStorage.getItem(DB_KEY+'_bak');
    if(raw){
      const bj=JSON.parse(raw);
      $('#bakInfo').innerHTML='<div class="notice" style="background:var(--blue-soft)"><svg class="ic" style="color:var(--blue)"><use href="#i-shield"/></svg><div><b>Copia automática interna del '+fmtTs(bj.ts)+'.</b> Se guarda una vez por día en este navegador y sirve como red de seguridad. No reemplaza la exportación: '+
        (db.meta.lastExport?'última copia exportada '+fmtTs(db.meta.lastExport)+'.':'<b>aún no exportaste ninguna copia — usá el botón de arriba.</b>')+
        ' <button class="outline-btn" style="margin-top:8px" onclick="APP.restoreBak()">Restaurar copia automática</button></div></div>';
    }
  }catch(e){}
}

/* ---------- PORTAL CLIENTE ---------- */
function sessionClient(){return db.session.clientId?clientOf(db.session.clientId):null}
function requireClient(){const c=sessionClient();if(!c){showLogin();return null}return c}
function renderClientHome(){
  const c=requireClient();if(!c)return;
  $('#chGreeting').textContent='Hola, '+(c.contact||c.name);
  const ms=urgencySort(machinesOf(c.id));
  const next=ms.length?ms[0]:null;
  if(next){
    const info=dueInfo(next);
    const npix=machinePix(next);
    $('#chNextCard').innerHTML=(npix?'<div style="height:130px;border-radius:12px;overflow:hidden;margin:-4px -4px 14px"><img src="'+npix+'" style="width:100%;height:100%;object-fit:cover"/></div>':'')+'<span class="badge"><svg class="ic ic-xs"><use href="#i-clock"/></svg>Próximo mantenimiento</span>'+
      '<div class="service-number">'+(info.hoursLeft>0?nf(info.hoursLeft)+' h':'¡Ya!')+'</div>'+
      '<div style="font-size:13px;color:var(--tint2)">'+esc(mLabel(next))+' · revisión cada '+nf(next.intervalH)+' h</div>'+
      '<div class="progress" style="background:rgba(255,255,255,.15);margin-top:22px"><div style="width:'+info.pct+'%;background:'+(info.state==='overdue'?'#f1b94c':'var(--lime)')+'"></div></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--tint2)"><span>'+nf(next.hours)+' h actuales</span><span>'+nf(next.lastServiceHours+next.intervalH)+' h servicio</span></div>'+
      (info.state!=='ok'?'<div class="action-row" style="justify-content:center"><button class="solid-btn" style="background:var(--lime);color:var(--on-lime)" onclick="APP.requestCita(\''+next.id+'\')"><svg class="ic ic-xs"><use href="#i-cal"/></svg>Pedir turno ahora</button></div>':'');
  }else{
    $('#chNextCard').innerHTML='<span class="badge">Sin máquinas</span><div class="service-number">—</div><div style="font-size:13px;color:var(--tint2)">Cuando el taller registre tus equipos, van a aparecer acá.</div>';
  }
  document.getElementById('chMachines').innerHTML=ms.map(mm=>{
    const pix=machinePix(mm);
    return '<div title="'+esc(mLabel(mm))+'" onclick="APP.gotoPage(\'clientmachines\')" style="flex:none;cursor:pointer;text-align:center">'+
      '<div style="width:120px;height:78px;border-radius:12px;overflow:hidden;background:var(--tint);display:grid;place-items:center">'+(pix?'<img src="'+pix+'" style="width:100%;height:100%;object-fit:cover"/>':'<svg class="ic" style="width:30px;height:30px;color:var(--green2)"><use href="'+iconOf(mm)+'"/></svg>')+'</div>'+
      '<div class="small" style="margin-top:3px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(mLabel(mm))+'</div></div>';
  }).join('');
  const myOpen=db.ots.filter(o=>otAbierta(o)&&ms.some(m=>m.id===o.machineId));
  const at=[];
  myOpen.forEach(o=>{if(o.cita==='propuesta')at.push('un turno esperando tu respuesta');else if(o.status==='terminada')0});
  const paraFirmar=db.ots.filter(o=>o.status==='terminada'&&o.ready&&!o.signature&&ms.some(m=>m.id===o.machineId)).length;
  const propuestas=myOpen.filter(o=>o.cita==='propuesta').length;
  let att='';
  if(propuestas||paraFirmar){
    att='<div style="display:flex;flex-direction:column;gap:8px;margin:0 0 4px">'+
      (paraFirmar?'<button class="solid-btn" style="background:var(--lime);color:var(--on-lime)" onclick="APP.gotoPage(\'clientservices\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>'+paraFirmar+' informe'+(paraFirmar>1?'s':'')+' para firmar — tu máquina está lista</button>':'')+
      (propuestas?'<button class="solid-btn" onclick="APP.gotoPage(\'clientservices\')"><svg class="ic ic-xs"><use href="#i-cal"/></svg>'+propuestas+' turno'+(propuestas>1?'s':'')+' esperando tu respuesta</button>':'')+
      '</div>';
  }
  $('#chAttention').innerHTML=att;
  const pend=ms.filter(m=>dueInfo(m).state!=='ok');
  const items=(pend.length?'<div class="agenda-day" style="margin-top:0">Por venir</div>':'')+pend.map(m=>{
    const st=dueInfo(m).state;
    return '<div class="timeline-item"><div class="ticon"><svg class="ic ic-sm"><use href="#i-clock"/></svg></div><div><div class="tname">'+esc(mLabel(m))+' · '+esc(dueInfo(m).label)+'</div><div class="tdetail">'+esc(dueServiceLabel(m))+'</div></div><div class="date"'+(st==='overdue'?' style="background:var(--red-soft);color:var(--red)"':'')+'>'+(st==='overdue'?'¡Ahora!':'Pronto')+'</div></div>';
  }).join('');
  const movs=ms.flatMap(m=>m.history.slice(0,2).map(h=>({...h,m}))).sort((a,b)=>b.ts-a.ts).slice(0,4);
  const hist=(movs.length?'<div class="agenda-day">Últimos movimientos</div>':'')+movs
    .map(h=>'<div class="timeline-item"><div class="ticon"><svg class="ic ic-sm"><use href="#i-checkc"/></svg></div><div><div class="tname">'+esc(h.title)+' · '+esc(mLabel(h.m))+'</div><div class="tdetail">'+esc(h.detail||'')+'</div></div><div class="date">'+fmtTs(h.ts)+'</div></div>').join('');
  $('#chTimeline').innerHTML=items+hist||emptyHTML('#i-checkc','Todo al día — no hay servicios próximos por ahora.');
}
function renderClientMachines(){
  const c=requireClient();if(!c)return;
  const ms=machinesOf(c.id);
  $('#cmGrid').innerHTML=ms.length?ms.map(m=>machineCardHTML(m,true)).join(''):emptyHTML('#i-tractor','Todavía no tenés equipos registrados.');
  const groups={};
  ms.forEach(m=>{if(m.serviceGroup&&SERVICE_GROUPS[m.serviceGroup])groups[m.serviceGroup]=1});
  const keys=Object.keys(groups);
  $('#cmCatCard').style.display=keys.length?'block':'none';
  $('#cmCat').innerHTML=keys.map(gk=>{
    const g=SERVICE_GROUPS[gk];
    let html='<div class="agenda-day" style="margin-top:0">'+esc(g.name)+'</div>'+
      g.services.map(s=>'<details class="svcdet"><summary><b>'+s.n+' · '+esc(s.t)+'</b><span>'+s.tasks.length+' puntos</span></summary><ul>'+s.tasks.map(tk=>'<li>'+esc(tk)+'</li>').join('')+'</ul></details>').join('');
    if(g.oils){
      html+='<details class="svcdet"><summary><b>Aceites y capacidades</b><span>ficha técnica</span></summary><table><thead><tr><th>Modelo</th><th>Capacidades y tipos</th></tr></thead><tbody>'+
        g.oils.map(o=>'<tr><td><b>'+esc(o[0])+'</b></td><td>'+esc(o[1])+'</td></tr>').join('')+'</tbody></table></details>';
    }
    return html;
  }).join('');
}
function svcHours(t){const m=t.match(/([\d.]+)\s*horas?/i);return m?parseInt(m[1].replace(/\./g,''),10):null}
function dueServiceLabel(m){
  const g=m.serviceGroup&&SERVICE_GROUPS[m.serviceGroup];
  if(!g)return 'Aceite, filtros, engrase y chequeo general.';
  const base=(m.lastServiceHours!=null?m.lastServiceHours:0);
  let nxt=null;
  if(g.byService)nxt=g.services.find(s=>{const h=svcHours(s.t);return h!=null&&h>base});
  else{const since=m.hours-base;nxt=g.services.find(s=>{const h=svcHours(s.t);return h!=null&&h>since})}
  return nxt?'Le toca: '+nxt.t:'Aceite, filtros, engrase y chequeo general.';
}
function mThumb(m){
  const pix=machinePix(m);
  if(pix)return '<img src="'+pix+'" alt="">';
  return '<span class="planm-ic"><svg class="ic"><use href="#i-'+(m.iconKey||iconGuess(m.brand,m.model)||'tractor')+'"/></svg></span>';
}
function otSteps(o){
  const idxmap={cita:0,recibida:1,diagnostico:2,presupuesto:3,bloqueada:4,taller:5,terminada:6};
  const cur=idxmap[o.status]==null?1:idxmap[o.status];
  const st=[
    {t:'Solicitud recibida',st:cur>=1?'done':'next'},
    {t:'Diagnóstico del equipo',st:cur>2?'done':(cur===2?'now':'next')}
  ];
  if(o.presupuesto&&o.presupuesto.total)st.push({t:'Presupuesto '+money(o.presupuesto.total),st:cur>3?'done':(cur===3?'now':'next'),s:o.presupuesto.approved===true?'Aprobado por vos':(cur===3?'Esperando tu respuesta':'')});
  if(o.status==='bloqueada')st.push({t:'En espera',st:'now',s:o.bloqueo==='pieza'?'Falta un repuesto — te avisamos apenas llegue':(o.bloqueo==='autorizacion'?'Necesitamos tu autorización para seguir':'Coordinando con el taller')});
  st.push({t:'Trabajo en el taller',st:o.status==='terminada'?'done':(cur>=5?'now':'next')});
  const fin=o.status==='terminada';
  st.push({t:'Lista para retirar',st:fin?(o.ready?'done':'now'):'next',s:fin?(o.ready?'Podés buscarla el '+fmtDate(o.pickupDate||todayISO())+(o.pickupTime?' · a las '+o.pickupTime:''):'El taller está definiendo el día y la hora de retiro — te avisamos'):''});
  st.push({t:'Firma del informe',st:o.signature?'done':(fin&&o.ready?'now':'next'),s:o.signature?'Firmado ✓':(fin&&o.ready?'Firmalo antes de retirar (o en el mostrador)':'')});
  st.push({t:'Entregada',st:o.signature?'done':'next'});
  return st;
}
function renderCsTrack(ms){
  const act=db.ots.filter(o=>ms.some(m=>m.id===o.machineId)&&((o.status!=='terminada'&&['recibida','diagnostico','presupuesto','bloqueada','taller'].indexOf(o.status)>=0)||(o.status==='terminada'&&!o.signature)));
  const card=$('#csTrackCard');
  if(!act.length){card.style.display='none';return}
  card.style.display='block';
  $('#csTrack').innerHTML='<div class="section-head" style="margin-bottom:8px"><div><div class="section-title">Seguimiento del servicio</div><div class="section-sub">Con tu equipo en el taller, ves el avance paso a paso.</div></div></div>'+
    act.map(o=>{
      const m=machineOf(o.machineId);
      return '<div class="planm" style="background:var(--tint)"><div class="planm-h">'+mThumb(m)+'<div style="flex:1;min-width:0"><b>'+esc(m?mLabel(m):'')+'</b><div class="small">'+esc(o.id)+(o.tech?' · Técnico: '+esc(o.tech):'')+' · '+esc(OT_ESTADOS[o.status]||'')+'</div></div></div>'+
        '<ul class="tl">'+otSteps(o).map(s=>'<li class="'+s.st+'"><span class="dot">'+(s.st==='done'?'<svg><use href="#i-check"/></svg>':'')+'</span><div class="t">'+esc(s.t)+'</div>'+(s.s?'<div class="s">'+esc(s.s)+'</div>':'')+'</li>').join('')+'</ul></div>';
    }).join('');
}
function renderCsPlan(ms){
  if(!ms.length){$('#csTable').innerHTML=emptyHTML('#i-clock','Sin equipos registrados.');return}
  let html='';
  ms.forEach(m=>{
    const g=m.serviceGroup&&SERVICE_GROUPS[m.serviceGroup];
    const already=db.ots.some(o=>o.machineId===m.id&&otAbierta(o));
    const cta=already?'<span class="badge ok">Turno solicitado</span>':'<button class="solid-btn" onclick="APP.requestCita(\''+m.id+'\')"><svg class="ic ic-xs"><use href="#i-cal"/></svg>Solicitar turno</button>';
    html+='<div class="planm"><div class="planm-h">'+mThumb(m)+'<div style="flex:1;min-width:0"><b>'+esc(mLabel(m))+'</b><div class="small">'+(m.serial?'SN '+esc(m.serial)+' · ':'')+nf(m.hours)+' h de uso'+(g?' · '+esc(g.name):'')+'</div></div></div>';
    if(!g){
      const info=dueInfo(m);
      html+='<ul class="tl"><li class="now"><span class="dot"></span><div class="t">Revisión cada '+nf(m.intervalH)+' h / '+m.intervalM+' meses</div><div class="s">'+esc(info.label)+'</div><div style="margin-top:8px">'+cta+'</div></li></ul></div>';
      return;
    }
    const base=(m.lastServiceHours!=null?m.lastServiceHours:0);
    const since=m.hours-base;
    let ctaDone=false,nextFound=false;
    const items=g.services.map(s=>{
      const h=svcHours(s.t);
      if(h==null)return '<li class="rec"><span class="dot"></span><div class="t">'+esc(s.t)+'</div><div class="s">Recurrente — cuando corresponda</div></li>';
      if(g.byService){
        if(h<=base)return '<li class="done"><span class="dot"><svg><use href="#i-check"/></svg></span><div class="t">'+esc(s.t)+'</div><div class="s">Realizado'+(h===base&&m.lastServiceDate?' — '+fmtDate(m.lastServiceDate):'')+'</div></li>';
        const rem=h-m.hours;let cls,sub;
        if(!nextFound){
          nextFound=true;
          if(rem<=0){cls='over';sub='Ya te toca: pasaste las '+nf(h)+' h';}
          else if(rem<=Math.max(15,h*0.15)){cls='soon';sub='Próximo — te toca en ~'+nf(rem)+' h de uso';}
          else{cls='now';sub='Te toca a las '+nf(h)+' h — faltan ~'+nf(rem)+' h de uso';}
        }else if(rem<=0){cls='over';sub='Vencido — pasaste las '+nf(h)+' h';}
        else{cls='';sub='Luego — a las '+nf(h)+' h (en ~'+nf(rem)+' h de uso)';}
        const c=ctaDone?'':'<div style="margin-top:8px">'+cta+'</div>';ctaDone=true;
        return '<li class="'+cls+'"><span class="dot">'+(cls==='over'?'<svg><use href="#i-alert"/></svg>':'')+'</span><div class="t">'+esc(s.t)+'</div><div class="s">'+sub+'</div>'+c+'</li>';
      }
      if(h<=since){const c0=ctaDone?'':'<div style="margin-top:8px">'+cta+'</div>';ctaDone=true;
        return '<li class="over"><span class="dot"><svg><use href="#i-alert"/></svg></span><div class="t">'+esc(s.t)+'</div><div class="s">Vencido — pasaron '+nf(m.hours)+' h desde el último servicio</div>'+c0+'</li>';}
      const rem=h-since;const soon=rem<=Math.max(5,h*0.2);
      const c=ctaDone?'':'<div style="margin-top:8px">'+cta+'</div>';ctaDone=true;
      return '<li class="'+(soon?'soon':'now')+'"><span class="dot"></span><div class="t">'+esc(s.t)+'</div><div class="s">'+(soon?'Próximo — en ~'+nf(rem)+' h de uso':'Cada '+nf(h)+' h de uso — en ~'+nf(rem)+' h')+'</div>'+c+'</li>';
    }).join('');
    html+='<ul class="tl">'+items+'</ul>';
    if(!ctaDone)html+='<div style="margin-top:4px">'+cta+'</div>';
    html+='</div>';
  });
  $('#csTable').innerHTML=html;
}
function renderClientServices(){
  const c=requireClient();if(!c)return;
  const ms=urgencySort(machinesOf(c.id));
  renderCsPlan(ms);
  renderCsTrack(ms);
  const open=db.ots.filter(o=>otAbierta(o)&&ms.some(m=>m.id===o.machineId));
  const pendRet=db.ots.filter(o=>o.status==='terminada'&&!o.signature&&ms.some(m=>m.id===o.machineId));
  let att='';
  pendRet.forEach(o=>{
    const m=machineOf(o.machineId);
    if(o.ready){
      att+='<div class="req" style="border-left-color:var(--green2)" onclick="APP.openClientSign(\''+o.id+'\')">'+
        '<div style="flex:1;min-width:200px"><b>✓ '+esc(m?mLabel(m):'')+' está lista</b><div class="small">Podés buscarla el <b>'+fmtDate(o.pickupDate||todayISO())+'</b>'+(o.pickupTime?' a las <b>'+o.pickupTime+'</b>':'')+' · '+esc(o.id)+' — revisá el informe y fírmalo.</div></div>'+
        '<button class="solid-btn" onclick="event.stopPropagation();APP.openClientSign(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Ver informe y firmar</button></div>';
    }else{
      att+='<div class="req" style="border-left-color:var(--blue)" onclick="APP.viewReport(\''+o.id+'\')">'+
        '<div style="flex:1;min-width:200px"><b>Servicio terminado ✓</b><div class="small">'+esc(m?mLabel(m):'')+' · '+esc(o.id)+' — el taller te va a confirmar el día y la hora de retiro.</div></div>'+
        '<button class="outline-btn" onclick="event.stopPropagation();APP.viewReport(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-file"/></svg>Ver informe</button></div>';
    }
  });
  open.forEach(o=>{
    const m=machineOf(o.machineId);
    if(o.status==='presupuesto'&&o.presupuesto&&o.presupuesto.approved===null){
      att+='<div class="req" style="border-left-color:var(--amber)" onclick="APP.budgetApprove(\''+o.id+'\')">'+
        '<div style="flex:1;min-width:200px"><b>Presupuesto: '+money(o.presupuesto.total)+'</b><div class="small">'+esc(m?mLabel(m):'')+' · '+(o.presupuesto.nota?esc(o.presupuesto.nota):'base '+money(o.presupuesto.base)+' + IVA')+'</div></div>'+
        '<button class="solid-btn" onclick="event.stopPropagation();APP.budgetApprove(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Aprobar</button>'+
        '<button class="outline-btn" onclick="event.stopPropagation();APP.budgetReject(\''+o.id+'\')">Rechazar</button></div>';
    }else if(o.status==='bloqueada'&&o.bloqueo==='pieza'){
      att+='<div class="req" style="border-left-color:var(--red)"><div><b>Esperando repuesto</b><div class="small">'+esc(m?mLabel(m):'')+' — te avisamos cuando llegue la pieza para continuar</div></div></div>';
    }else if(o.status==='bloqueada'&&o.bloqueo==='autorizacion'){
      att+='<div class="req" style="border-left-color:var(--amber)"><div><b>Pendiente tu autorización</b><div class="small">El taller necesita tu aprobación para seguir con '+esc(m?mLabel(m):'')+'</div></div></div>';
    }
    if(o.cita==='propuesta'){
      att+='<div class="req" style="border-left-color:var(--amber)" onclick="APP.gotoPage(\'clientservices\')">'+
        '<div style="flex:1;min-width:200px"><b>Turno propuesto: '+fmtDate(o.proposedDate)+(o.proposedTime?' · '+o.proposedTime:'')+'</b><div class="small">'+esc(m?mLabel(m):'')+' · '+esc(o.type)+'</div></div>'+
        '<button class="solid-btn" onclick="event.stopPropagation();APP.citaAccept(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Aceptar</button>'+
        '<button class="outline-btn" onclick="event.stopPropagation();APP.citaReject(\''+o.id+'\')">Rechazar</button></div>';
    }else if(o.cita==='rechazada'){
      att+='<div class="req" style="border-left-color:var(--red)"><div><b>Turno rechazado</b><div class="small">El taller te propondrá otro día para '+esc(m?mLabel(m):'')+'</div></div></div>';
    }else if(o.status==='taller'){
      att+='<div class="req" style="border-left-color:var(--line)"><div><b>'+esc(m?mLabel(m):'')+' está en el taller</b><div class="small">Te avisamos cuando esté lista para retirar.</div></div></div>';
    }else if(o.cita==='solicitada'){
      att+='<div class="req" style="border-left-color:var(--blue)"><div><b>Turno pedido</b><div class="small">Esperando que el taller proponga día para '+esc(m?mLabel(m):'')+'</div></div></div>';
    }
  });
  $('#csAttention').innerHTML=att||emptyHTML('#i-checkc','Nada pendiente — todo al día ✓');

  const hist=db.ots.filter(o=>o.status==='terminada'&&ms.some(m=>m.id===o.machineId)).sort((a,b)=>(b.closedAt||0)-(a.closedAt||0));
  $('#csHist').innerHTML=hist.length?'<table><thead><tr><th>Fecha</th><th>Equipo</th><th>Trabajo realizado</th><th>Técnico</th><th></th></tr></thead><tbody>'+
    hist.map(o=>{
      const m=machineOf(o.machineId);
      return '<tr><td>'+fmtDate(isoOf(o.closedAt||Date.now()))+'</td>'+
        '<td><b>'+esc(m?mLabel(m):'—')+'</b><div class="small">'+esc(o.id)+(m&&m.serial?' · SN '+esc(m.serial):'')+'</div></td>'+
        '<td>'+esc(o.workDone||o.issue||o.type)+'</td><td>'+esc(o.tech||'—')+'</td>'+
        '<td>'+(o.signature?'<span class="badge ok">Firmado ✓</span>':(o.ready?'<button class="solid-btn" onclick="APP.openClientSign(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Ver y firmar</button>':''))+
        ' <button class="outline-btn" onclick="APP.viewReport(\''+o.id+'\')"><svg class="ic ic-xs"><use href="#i-file"/></svg>Informe</button></td></tr>';
    }).join('')+'</tbody></table>'
    :emptyHTML('#i-clock','Todavía no hay servicios completados.');
}
function renderClientDocs(){
  const c=requireClient();if(!c)return;
  const ms=machinesOf(c.id);
  $('#cdGrid').innerHTML=ms.length?ms.map(m=>
    '<div class="card machine-card hov"><div class="machine-hero-icon t-blue"><svg class="ic ic-lg"><use href="#i-file"/></svg></div><h3>Factura de compra</h3><div class="serial">'+esc(mLabel(m))+' · PDF</div><div class="action-row"><button class="outline-btn" onclick="APP.toast(\'Documento de ejemplo — disponible próximamente\')">Ver</button></div></div>'+
    '<div class="card machine-card hov"><div class="machine-hero-icon t-green"><svg class="ic ic-lg"><use href="#i-shield"/></svg></div><h3>Certificado de garantía</h3><div class="serial">'+(m.warrantyEnd?'Hasta '+fmtDate(m.warrantyEnd):'Sin garantía')+' · PDF</div><div class="action-row"><button class="outline-btn" onclick="APP.toast(\'Documento de ejemplo — disponible próximamente\')">Ver</button></div></div>'
  ).join(''):emptyHTML('#i-file','Sin equipos registrados.');
}
function renderClientSupport(){
  const c=requireClient();if(!c)return;
  const ms=machinesOf(c.id);
  $('#supMach').innerHTML=ms.length?ms.map(m=>'<option value="'+m.id+'">'+esc(mLabel(m))+' · '+esc(m.serial||'')+'</option>').join(''):'<option value="">— sin máquinas —</option>';
}

/* ---------- LOGIN CLIENTE ---------- */
function showLogin(){
  const sel=$('#loginSel');
  sel.innerHTML=db.clients.length?db.clients.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join(''):'<option value="">— todavía no hay clientes —</option>';
  $('#loginOverlay').classList.remove('off');
}
function hideLogin(){$('#loginOverlay').classList.add('off')}

/* ---------- CAMPANA ---------- */
function myNotifs(){
  if(currentRole==='admin')return db.notifs.filter(n=>n.audience==='admin');
  const cid=db.session.clientId;
  return db.notifs.filter(n=>n.audience==='client'&&(!n.clientId||n.clientId===cid));
}
function closeNotif(){var p=document.getElementById('notifPop');if(p)p.classList.remove('show')}
function renderBell(){
  const list=myNotifs();
  const unread=list.filter(n=>!n.read).length;
  const bc=$('#notifCount');
  bc.textContent=unread;bc.classList.toggle('zero',unread===0);
  $('#npList').innerHTML=list.length?list.slice(0,10).map(n=>{
    let actions='';
    if(n.kind==='presupuesto'&&n.otId){
      const ot3=db.ots.find(o=>o.id===n.otId);
      if(ot3&&ot3.presupuesto&&ot3.presupuesto.approved===null){
        actions='<div class="action-row" style="margin-top:9px" onclick="event.stopPropagation()"><button class="solid-btn" onclick="APP.budgetApprove(\''+n.otId+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Aprobar '+money(ot3.presupuesto.total)+'</button>'+
          '<button class="outline-btn" onclick="APP.budgetReject(\''+n.otId+'\')">Rechazar</button></div>';
      }
    }
    if(n.kind==='retiro'&&n.otId){
      const ot2=db.ots.find(o=>o.id===n.otId);
      if(ot2&&ot2.ready&&!ot2.signature){
        actions='<div class="action-row" style="margin-top:9px" onclick="event.stopPropagation()"><button class="solid-btn" onclick="APP.openClientSign(\''+n.otId+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Ver informe y firmar</button></div>';
      }
    }
    if(n.kind==='cita'&&n.otId){
      const ot=db.ots.find(o=>o.id===n.otId);
      if(ot&&ot.cita==='propuesta'){
        actions='<div class="action-row" style="margin-top:9px" onclick="event.stopPropagation()"><button class="solid-btn" onclick="APP.citaAccept(\''+n.otId+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Aceptar turno</button>'+
          '<button class="outline-btn" onclick="APP.citaReject(\''+n.otId+'\')">Rechazar</button></div>';
      }
    }
    return '<div class="np-item'+(n.read?'':' unread')+'" style="cursor:pointer" onclick="APP.notifGo(\''+n.id+'\')" title="Ir a la información"><span class="np-ic"><svg class="ic"><use href="#'+n.icon+'"/></svg></span>'+
    '<div><div class="np-t">'+esc(n.title)+'</div><div class="np-d">'+esc(n.detail)+'</div>'+actions+'</div><span class="np-m">'+fmtTs(n.ts)+'</span></div>';
  }).join(''):'<div class="np-item"><div><div class="np-d">Sin notificaciones.</div></div></div>';
}
