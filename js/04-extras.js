/* ================= AVISOS WA/EMAIL · CSV · FACTURA · COMPARTIR · LLAMADAS ================= */
const SERVICE_GROUPS={
  mini:{
    name:'Minitractor cortacésped / radio cero',
    services:[
      {n:1,t:'Cada uso (antes de comenzar)',tasks:['Revisar la operación del freno','Revisar la presión de las llantas','Verificar sistema de presencia del operador y ROS','Revisar sujetadores sueltos','Revisar el nivel de aceite del motor']},
      {n:2,t:'Cada 8 horas',tasks:['Revisar la operación del freno','Revisar la presión de las llantas','Revisar el nivel de aceite del motor']},
      {n:3,t:'Cada 25 horas',tasks:['Afilar o cambiar las cuchillas de la segadora','Tabla de lubricación','Revisar el nivel de la batería','Limpiar la batería y los terminales','Limpiar los residuos de la placa de dirección','Revisar el enfriamiento del transeje','Cambiar el aceite del motor (modelos sin filtro)','Limpiar el filtro de aire','Limpiar la rejilla de aire']},
      {n:4,t:'Cada 50 horas',tasks:['Comprobar la nivelación del cortacésped','Inspeccionar el silenciador y amortiguador de chispas','Cambiar el aceite del motor (modelos con filtro)']},
      {n:5,t:'Cada 100 horas',tasks:['Revisar sujetadores sueltos','Inspeccionar las correas trapezoidales','Cambiar el filtro de aceite','Limpiar las aletas de enfriamiento','Cambiar la bujía','Cambiar el cartucho de papel del filtro de aire']},
      {n:6,t:'Cada temporada',tasks:['Cambiar la bujía','Cambiar el filtro de combustible']},
      {n:7,t:'Almacenamiento',tasks:['Revisar sujetadores sueltos','Tabla de lubricación','Limpiar la batería y los terminales','Cambiar el aceite del motor']}
    ],
    checklist:[
      {sec:'I · Motor',items:['Cambio de aceite del motor','Cambio del filtro de aceite','Filtro de aire (limpiar o reemplazar)','Bujías (revisar, limpiar o reemplazar)']},
      {sec:'II · Cuchillas y plataforma',items:['Afilado y balanceo de cuchillas','Limpieza de la plataforma de corte','Inspección de la caja de la cuchilla','Ajuste del mecanismo de altura de corte']},
      {sec:'III · Transmisión y chasis',items:['Sistema hidrostático (nivel y fugas)','Correas de transmisión','Neumáticos (presión y daños)','Sistema de dirección']},
      {sec:'IV · Seguridad y limpieza',items:['Limpieza general del equipo','Revisión de frenos','Inspección de tuercas y tornillos','Batería y terminales']}
    ]
  },
  lovol:{
    name:'Tractor Lovol',
    oils:[['TE243 / TE254 / TE280','Motor 4,3 L · SAE 15W-40 — Transmisión 12 L · UTTO 10W-30 — Hidráulico 8 L · UTTO 10W-30'],['TE355 / TE366 / TE404','Motor 5,2 L · SAE 15W-40 — Transmisión 16 L · UTTO 10W-30'],['Serie M (M904–M1304)','Motor 8–10 L · SAE 15W-40 — Transmisión 20 L · UTTO 10W-30 — Hidráulico 10–18 L · UTTO 10W-30'],['CQ404 / CQ454','Motor 5,2 L · SAE 15W-30 — Transmisión 16 L · UTTO 10W-30 — Hidráulico 12 L · UTTO 10W-30'],['General','Motor: SAE 15W-40 · Transmisión/hidráulico: UTTO 10W-30 · Refrigerante: glicol 50/50']],
    byService:true,
    services:[
      {n:1,t:'Servicio de 50 horas',tasks:['Revisar y ajustar la holgura de la válvula','Cambiar el aceite de la caja de cambios','Cambiar el filtro de aceite (lubricación del motor)','Cambiar el aceite del motor (con filtro)','Revisar el nivel de electrolito de la batería','Revisar y apretar pernos y tuercas de las ruedas delanteras y traseras','Revisar y apretar pernos y tuercas del sistema de transmisión','Comprobar si hay fugas de aceite, agua y aire en el motor y el tractor']},
      {n:2,t:'Servicio de 250 horas',tasks:['Cambiar el aceite del motor y su filtro','Cambiar el aceite de la caja de cambios','Revisar y ajustar la holgura de la válvula','Revisar el nivel de electrolito de la batería','Revisar y apretar pernos y tuercas de ruedas y transmisión','Comprobar fugas de aceite, agua y aire','Revisar la tensión y el desgaste de la correa del ventilador','Cambiar el elemento filtrante del filtro de combustible','Drenar el agua y sedimentos del tanque de combustible']},
      {n:3,t:'Servicio de 500 horas',tasks:['Cambiar aceite y filtro de aceite del motor','Cambiar el aceite de la transmisión','Cambiar el aceite y el filtro del sistema hidráulico','Cambiar el filtro de combustible','Revisar y ajustar la holgura de la válvula','Revisar el nivel de electrolito de la batería','Revisar y apretar pernos y tuercas de ruedas y transmisión','Comprobar fugas de aceite, agua y aire','Revisar la tensión y el desgaste de la correa del ventilador','Servicio del aire acondicionado (si está instalado)','Drenar el agua y sedimentos del tanque de combustible']},
      {n:4,t:'Servicio de 750 horas',tasks:['Cambiar el aceite del motor y su filtro','Cambiar el aceite del sistema hidráulico','Cambiar el filtro del sistema hidráulico','Revisar y ajustar la holgura de la válvula','Revisar el nivel de electrolito de la batería','Revisar y apretar pernos y tuercas de las ruedas','Comprobar fugas de aceite, agua y aire','Revisar la tensión y el desgaste de la correa del ventilador','Servicio del aire acondicionado (si está instalado)','Verificar y ajustar el juego de las válvulas del motor','Cambiar el elemento filtrante del filtro de combustible','Drenar el agua y sedimentos del tanque de combustible','Drenar el aceite viejo del motor y del sistema hidráulico','Purga del sistema de combustible']},
      {n:5,t:'Servicio de 1.000 horas',tasks:['Cambiar el aceite del motor y su filtro','Cambiar el aceite de la transmisión','Cambiar el aceite y el filtro del sistema hidráulico','Cambiar el filtro de combustible','Revisar y ajustar la holgura de la válvula','Revisar el nivel de electrolito de la batería','Revisar y apretar pernos y tuercas de ruedas y transmisión','Comprobar fugas de aceite, agua y aire','Revisar la tensión y el desgaste de la correa del ventilador','Servicio del aire acondicionado (si está instalado)','Verificar y ajustar el juego de las válvulas del motor','Drenar el agua y sedimentos del tanque de combustible','Drenar el aceite viejo de motor, transmisión e hidráulico','Purga del sistema de combustible']},
      {n:6,t:'Servicio de 1.500 horas',tasks:['Incluye todos los puntos del servicio de 1.000 horas','Revisión general de motor, transmisión e hidráulico','Cambio de aceites y filtros según plan Lovol 1.500 h','Verificación de bomba de combustible y sistema eléctrico','Prueba final de funcionamiento en carga']}
    ],
    checklist:[
      {sec:'Service Lovol',items:['Cambiar aceite del motor y filtro','Cambiar aceite y filtro de transmisión','Cambiar aceite y filtro del sistema hidráulico','Cambiar filtro de combustible','Revisar y ajustar la holgura de las válvulas','Revisar el nivel de electrolito de la batería','Revisar y apretar pernos y tuercas de ruedas y transmisión','Comprobar fugas de aceite, agua y aire','Revisar la tensión y el desgaste de la correa del ventilador','Servicio del aire acondicionado (si está instalado)','Drenar el agua y sedimentos del tanque de combustible','Purga del sistema de combustible']}
    ]
  }
};
const OT_ESTADOS={
  cita:'Turno',recibida:'Recibida',diagnostico:'Diagnóstico',presupuesto:'Presupuesto',bloqueada:'Bloqueada',taller:'En reparación',terminada:'Cerrada',anulada:'Anulada'
};
function otAbierta(o){return o.status!=='terminada'&&o.status!=='anulada'}
function otNextActor(o){
  if(o.status==='anulada')return 'Anulada'+(o.anuladaMotivo?' — '+o.anuladaMotivo:'');
  if(o.status==='cita')return o.cita==='propuesta'?'→ Cliente: responder':(o.cita==='confirmada'?'→ Taller: preparar servicio':'→ Taller: proponer día');
  if(o.status==='recibida')return '→ Taller: diagnosticar';
  if(o.status==='diagnostico')return '→ Técnico: revisar';
  if(o.status==='presupuesto')return '→ Cliente: aprobar $';
  if(o.status==='bloqueada')return o.bloqueo==='pieza'?'→ Compras: conseguir repuesto':(o.bloqueo==='autorizacion'?'→ Cliente: autorizar':'→ Taller: asignar técnico');
  if(o.status==='taller')return '→ Técnico: reparar';
  if(o.status==='terminada')return o.ready?(o.signature?'✓ Entregada':'→ Cliente: retirar y firmar'):'→ Taller: avisar día de retiro';
  return '';
}
function repeatedIssueAlert(ot,machineId){
  const esIncidencia=/aver|incid|fallo|reparac/i.test(String(ot.type)+' '+String(ot.issue));
  if(!esIncidencia)return null;
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-záéíóúüñ0-9 ]/g,' ').split(/s+/).join(' ').split(/\s+/).filter(w=>w.length>3);
  const cur=norm(ot.issue+' '+(ot.workDone||''));
  if(cur.length<2)return null;
  const curSet=new Set(cur);
  let hits=0;
  db.ots.forEach(o=>{
    if(o.id===ot.id||(machineId?o.machineId!==machineId:o.machineId!==ot.machineId))return;
    const past=norm(o.issue+' '+(o.workDone||''));
    if(past.length<2)return;
    const pastSet=new Set(past);
    let inter=0;curSet.forEach(w=>{if(pastSet.has(w))inter++});
    if(inter>=2||inter>=Math.ceil(Math.min(curSet.size,pastSet.size)*0.6))hits++;
  });
  return hits>=2?('Fallo repetido: '+hits+' incidencias similares en esta máquina'):(hits===1?'Atención: 2ª incidencia similar en esta máquina':null);
}
const LOVOL_MODELS=[
  {k:'te2',n:'TE243 · TE254 · TE280',img:''},
  {k:'te3',n:'TE355 · TE366 · TE404',img:''},
  {k:'cq',n:'CQ404 · CQ454',img:''},
  {k:'m9',n:'M904 · M1004 · M1104',img:''},
  {k:'m12',n:'M1204 · M1304',img:''},
];
const LOVOL_IMGS={};LOVOL_MODELS.forEach(x=>LOVOL_IMGS[x.k]=x.img);
function machinePix(m){return m.foto||(m.modelImg&&LOVOL_IMGS[m.modelImg])||null}
function fotoFromFile(file,cb){
  const r=new FileReader();
  r.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const max=560;
      const scale=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement('canvas');
      c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      cb(c.toDataURL('image/jpeg',0.72));
    };
    img.src=r.result;
  };
  r.readAsDataURL(file);
}
function machineModelGuess(brand,model){
  const s=((brand||'')+' '+(model||'')).toLowerCase();
  if(!/lovol|foton/.test(s)&&!/te ?[23456]|cq ?[45]|m ?1[0-3]0[0-9]/.test(s))return '';
  if(/te ?2|243|254|280/.test(s))return 'te2';
  if(/te ?3|355|366|404|^404/.test(s))return 'te3';
  if(/cq/.test(s))return 'cq';
  if(/1204|1304/.test(s))return 'm12';
  if(/904|1004|1104/.test(s))return 'm9';
  return '';
}
function iconGuess(brand,model){
  const s=((brand||'')+' '+(model||'')).toLowerCase();
  if(/zero|radiomaster|4500|z ?track|zt|radio cero/.test(s))return 'zturn';
  if(/525|rider|rt ?6|sentad|ride/.test(s))return 'ride';
  if(/avant|carg|loader|635/.test(s))return 'layers';
  if(/lovol|te ?2|te ?3|m5|5075|m[0-9]0[0-9]/.test(s))return 'tractorcab';
  return '';
}
function normHeader(h){return String(h||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')}
function parseCSVText(text){
  const lines=String(text||'').split(/\r?\n/).filter(l=>l.trim());
  if(lines.length<2)return{rows:[],errors:['El archivo no tiene filas de datos.']};
  const head=lines[0];
  const delim=(head.split(';').length>head.split(',').length)?';':',';
  const cols=head.split(delim).map(normHeader);
  const ALIAS={cliente:['cliente','clientes','customer','nombrecliente','empresa'],cuit:['cuit','cuil','cuitcliente','cuitcuil'],grupo:['grupo','gruposervicio','grupomaquina'],contacto:['contacto','contact','personadecontacto'],telefono:['telefono','tel','phone','movil','celular'],email:['email','correo','mail','emailcliente'],marca:['marca','brand','fabricante'],modelo:['modelo','model'],serie:['serie','serial','sn','numserie','numerodeserie','nserie','numeroserie'],horas:['horas','horometro','hours','horasactuales','horasuso'],revision_horas:['revisionhoras','intervalohoras','cadahoras','serviciocadahoras'],revision_meses:['revisionmeses','intervalomeses','cadameses'],ultimo_servicio:['ultimoservicio','fechaultimoservicio','fechaultimo','ultimarevision','entrega','fechaentrega'],garantia:['garantia','garantiahasta','fechagarantia','garantiahastafecha'],precio_venta:['precioventa','precio','valorventa','preciodeventa'],precio_servicio:['precioservicio','preciorevision','preciodeservicio','tarifa']};
  const map={};Object.keys(ALIAS).forEach(k=>ALIAS[k].forEach(a=>{map[a]=k}));
  const idx={};cols.forEach((c,i)=>{if(map[c])idx[map[c]]=i});
  const rows=[],errors=[];
  if(idx.marca==null&&idx.modelo==null){return{rows:[],errors:['No encuentro las columnas "marca" y "modelo". Descargá la plantilla para ver el formato.']}}
  for(let i=1;i<lines.length;i++){
    const cells=lines[i].split(delim).map(s=>s.trim().replace(/^"|"$/g,''));
    const get=k=>idx[k]!=null?(cells[idx[k]]||''):'';
    if(!get('marca')&&!get('modelo'))continue;
    if(!get('cliente')){errors.push('Fila '+(i+1)+': falta el nombre del cliente');continue}
    rows.push({cliente:get('cliente'),cuit:get('cuit'),grupo:get('grupo'),contacto:get('contacto'),telefono:get('telefono'),email:get('email'),marca:get('marca'),modelo:get('modelo'),serie:get('serie'),horas:get('horas'),revision_horas:get('revision_horas'),revision_meses:get('revision_meses'),ultimo_servicio:get('ultimo_servicio'),garantia:get('garantia'),precio_venta:get('precio_venta'),precio_servicio:get('precio_servicio')});
  }
  return {rows,errors};
}
function normDate(v){
  v=String(v||'').trim();if(!v)return null;
  let m=v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if(m){let y=+m[3];if(y<100)y+=2000;return y+'-'+String(+m[2]).padStart(2,'0')+'-'+String(+m[1]).padStart(2,'0')}
  m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m)return m[1]+'-'+String(+m[2]).padStart(2,'0')+'-'+String(+m[3]).padStart(2,'0');
  return null;
}
function normHours(v){const d=String(v||'').replace(/[^\d]/g,'');return d?parseInt(d,10):0}
function phoneDigits(p){let d=String(p||'').replace(/[^\d]/g,'');if(d.length===9&&'6789'.indexOf(d[0])>=0)d='34'+d;return d}
function alertMsg(m,kind){
  const c=clientOf(m.clientId),info=dueInfo(m),biz=(db.meta.biz&&db.meta.biz.name)||'TerraFleet';
  const nombre=(c&&c.contact)?c.contact.split(' ')[0]:(c?c.name:'');
  if(kind==='hours')return 'Hola '+nombre+', ¿cuántas horas marca ahora tu '+mLabel(m)+'? Respondé con el número (o una foto del tablero) y lo actualizamos. Gracias — '+biz;
  const estado=info.state==='overdue'?'tiene la revisión vencida ('+info.label+')':'está cerca de su revisión ('+info.label+')';
  return 'Hola '+nombre+', te escribimos de '+biz+'. Tu '+mLabel(m)+' '+estado+'. ¿Querés que agendemos el turno? Respondé y lo organizamos.';
}
function b64enc(s){try{return btoa(unescape(encodeURIComponent(s)))}catch(e){return ''}}
function b64dec(s){try{return decodeURIComponent(escape(atob(s)))}catch(e){return null}}
let importPending=null;

function buildReportHTML(ot){
  const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
  const biz=db.meta.biz||{};
  const fecha=ot.closedAt?new Date(ot.closedAt):new Date();
  return '<!doctype html><html><head><meta charset="utf-8"><title>Informe '+ot.id+'</title>'+
      '<style>body{font-family:Inter,system-ui,sans-serif;color:#111;margin:0;padding:26px;font-size:13px}'+
      '.wrap{max-width:700px;margin:0 auto}'+
      '.rhead{display:flex;justify-content:space-between;align-items:flex-start;background:'+brandP()+';color:#fff;border-radius:12px;padding:16px 20px}'+
      '.rhead h1{margin:0;font-size:17px}.rhead .rno{text-align:right;font-size:12px;opacity:.9;line-height:1.6}'+
      '.biz{margin-top:10px;font-size:11px;color:#555}'+
      '.gridinfo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}'+
      '.box{border:1px solid #dde5dd;border-radius:10px;padding:12px 14px}'+
      '.box h3{margin:0 0 6px;font-size:10.5px;text-transform:uppercase;letter-spacing:.09em;color:'+brandS()+'}'+
      '.box div{font-size:13px;line-height:1.6}'+
      '.works{margin-top:14px;border:1px solid #dde5dd;border-radius:10px;padding:14px 16px;font-size:13.5px;line-height:1.7}'+
      '.firmas{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:24px}'+
      '.firma{border:1.5px solid #bbb;border-radius:10px;height:120px;position:relative;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}'+
      '.firma img{max-width:92%;max-height:110px;object-fit:contain}'+
      '.firma span{position:absolute;bottom:-20px;font-size:11px;color:#555}'+
      '.foot{margin-top:44px;color:#888;font-size:10.5px;text-align:center}'+
      '@media print{body{padding:10mm}}</style></head><body><div class="wrap">'+
      '<div class="rhead"><div><h1>INFORME DE SERVICIO REALIZADO</h1></div>'+
      '<div class="rno"><b>'+esc(ot.id)+'</b><br>'+fmtTs(fecha.getTime())+'</div></div>'+
      '<div class="biz">'+(typeof TFPro!=='undefined'?TFPro.logoHTML(34):'')+'<b>'+esc(biz.name||'Mi Empresa')+'</b>'+(biz.cif?' · CUIT '+esc(biz.cif):'')+(biz.phone?' · '+esc(biz.phone):'')+(biz.city?' · '+esc(biz.city):'')+'</div>'+
      '<div class="gridinfo">'+
      '<div class="box"><h3>Cliente</h3><div><b>'+esc(c?c.name:'—')+'</b>'+(c&&c.cuit?'<br>CUIT: '+esc(c.cuit):'')+(c&&c.contact?'<br>At.: '+esc(c.contact):'')+(c&&c.phone?'<br>'+esc(c.phone):'')+'</div></div>'+
      '<div class="box"><h3>Equipo</h3><div><b>'+esc(m?mLabel(m):'—')+'</b>'+(m&&m.serial?'<br>SN: '+esc(m.serial):'')+((m&&m.foto)||(m&&m.modelImg&&LOVOL_IMGS[m.modelImg])?'<br><img src="'+machinePix(m)+'" style="max-width:130px;max-height:95px;object-fit:cover;border-radius:8px;margin-top:6px"/>':'')+(m?'<br>Horómetro al cierre: '+nf(m.hours)+' h':'')+(m&&m.warrantyEnd?'<br>Garantía: '+fmtDate(m.warrantyEnd):'')+'</div></div>'+
      '</div>'+
      '<div class="works"><b>Trabajo realizado</b><br>'+esc(ot.workDone||ot.issue||ot.type)+(ot.tech?'<br><span style="color:#555;font-size:12px">Técnico: '+esc(ot.tech)+'</span>':'')+
      (ot.reportObs?'<br><br><b>Observaciones</b><br>'+esc(ot.reportObs):'')+
      ((ot.horasTrabajo||ot.materiales||ot.costoMateriales)?('<br><br><b>Registro del taller</b><br>Horas de taller: '+(ot.horasTrabajo||0)+' h'+(ot.materiales?' · Materiales: '+esc(ot.materiales):'')+(ot.costoMateriales?' · Costo materiales: '+money(ot.costoMateriales):'')):'')+'</div>'+
      (ot.tasks&&ot.tasks.length?'<div class="works"><b>Tareas</b><br>'+ot.tasks.map(t=>(t.done?'<span style="color:#1c6b3a">✓</span>':'○')+' '+esc(t.t)+(t.done?'':'<span style="color:#a33"> — no se realizó'+(t.why?': '+esc(t.why):'')+'</span>')).join('<br>')+'</div>':'')+
      '<div class="firmas">'+
      '<div class="firma">'+(ot.signature?'<img src="'+ot.signature+'">':'')+'<span>Firma del cliente — '+esc(c?c.name:'')+'</span></div>'+
      '<div class="firma"><span>Por el taller — '+esc(ot.tech||'')+'</span></div>'+
      '</div>'+
      '<div class="foot">Este informe deja constancia del trabajo realizado sobre el equipo indicado.<br>Generado con TerraFleet · '+fmtTs(Date.now())+'</div>'+
      '</div></body></html>';;
}

Object.assign(APP,{
  notifyWA(machineId,kind){
    const m=machineOf(machineId);if(!m)return;
    const c=clientOf(m.clientId);
    const digits=c?phoneDigits(c.phone):'';
    if(!digits){toast('Este cliente no tiene teléfono (edítalo en Clientes)');return}
    window.open('https://wa.me/'+digits+'?text='+encodeURIComponent(alertMsg(m,kind||'alert')),'_blank');
    m.history.unshift({ts:Date.now(),title:kind==='hours'?'Petición de horas por WhatsApp':'Aviso de revisión por WhatsApp',detail:(c?c.name:'')+' · '+dueInfo(m).label});
    saveDb();renderAll();
  },
  notifyMail(machineId,kind){
    const m=machineOf(machineId);if(!m)return;
    const c=clientOf(m.clientId);
    if(!c||!c.email){toast('Este cliente no tiene email (edítalo en Clientes)');return}
    location.href='mailto:'+encodeURIComponent(c.email)+'?subject='+encodeURIComponent('Revisión de tu '+mLabel(m))+'&body='+encodeURIComponent(alertMsg(m,kind||'alert'));
    m.history.unshift({ts:Date.now(),title:kind==='hours'?'Petición de horas por email':'Aviso de revisión por email',detail:(c?c.name:'')+' · '+dueInfo(m).label});
    saveDb();renderAll();
  },

  /* ---- tareas de la orden ---- */
  toggleOtTable(){
    const t=$('#otTable');
    const show=t.style.display==='none';
    t.style.display=show?'block':'none';
    $('#otTableBtn').textContent=show?'Ocultar registro':'Mostrar registro';
  },
  setWsFilter(k){wsFilter=(wsFilter===k?null:k);if(wsFilter==='hoy'){wsDaySel=todayISO();wsWeekOff=0;wsMonthOff=0;wsMode='agenda';wsView='semana'}renderPage('workshop')},
  setCalMode(m){wsMode=m;wsDaySel=null;if(m==='historico')wsWeekOff=0;renderPage('workshop')},
  setCalView(v){wsView=v;renderPage('workshop')},
  wsPrev(){if(wsMode==='agenda'&&wsView==='semana')wsWeekOff--;else if(wsMonthOff>-24)wsMonthOff--;renderPage('workshop')},
  wsNext(){if(wsMode==='agenda'&&wsView==='semana')wsWeekOff++;else if(wsMonthOff<0)wsMonthOff++;renderPage('workshop')},
  wsToday(){wsWeekOff=0;wsMonthOff=0;wsDaySel=todayISO();renderPage('workshop')},
  setWsDay(iso){wsDaySel=iso;wsFilter=null;renderPage('workshop')},
  wsWeek(d){if(d===0){wsWeekOff=0;wsDaySel=todayISO()}else wsWeekOff+=d;renderPage('workshop')},
  openMachineInfo(mid){
    const m=machineOf(mid);if(!m)return;
    const c=clientOf(m.clientId),info=dueInfo(m);
    document.getElementById('miTitle').textContent=mLabel(m);
    document.getElementById('miSub').textContent='SN '+esc(m.serial||'—')+' · '+(c?c.name:'')+(m.serviceGroup?' · '+SERVICE_GROUPS[m.serviceGroup].name:'');
    const abiertas=db.ots.filter(o=>o.machineId===mid&&otAbierta(o));
    let rep=null;
    db.ots.forEach(o=>{if(o.machineId===mid&&o.repeatFlag)rep=o.repeatFlag});
    if(!rep&&abiertas.length){const probe={issue:abiertas[0].issue,workDone:abiertas[0].workDone,type:abiertas[0].type,machineId:mid,id:'probe'};rep=repeatedIssueAlert(probe,mid)}
    let html='';
    if(rep)html+='<div class="notice" style="background:var(--red-soft)"><svg class="ic" style="color:#ac4136"><use href="#i-alert"/></svg><div><b>'+esc(rep)+'</b><br>Analiza la causa de fondo: esta máquina ya presentó este problema varias veces.</div></div>';
    html+='<div class="machine-meta" style="grid-template-columns:1fr 1fr">'+
      '<div class="meta">Mantenimiento<span>'+STATE_BADGE[info.state]+' '+esc(info.label)+'</span></div>'+
      '<div class="meta">Horómetro<span>'+nf(m.hours)+' h</span></div>'+
      '<div class="meta">Garantía<span>'+(info.warrantyLeft==null?'—':(info.warrantyLeft>0?fmtDate(m.warrantyEnd):'Finalizada'))+'</span></div>'+
      '<div class="meta">Grupo<span>'+(m.serviceGroup?esc(SERVICE_GROUPS[m.serviceGroup].name):'—')+'</span></div></div>';
    html+='<div class="agenda-day" style="margin-top:14px">Trabajos abiertos ('+abiertas.length+')</div>';
    html+=abiertas.length?abiertas.map(o=>{
      const bloq=(o.status==='bloqueada')?'<span class="badge bad">'+(o.bloqueo==='pieza'?'Falta repuesto':(o.bloqueo==='autorizacion'?'Falta autorización':'Falta técnico'))+'</span>':'';
      return '<div class="req" style="border-left-color:'+(o.status==='bloqueada'?'var(--red)':'var(--green2)')+'" onclick="APP.openOtInfo(\''+o.id+'\')">'+
        '<div style="flex:1"><b>'+esc(o.id)+'</b> · <span class="badge info">'+esc(OT_ESTADOS[o.status]||o.status)+'</span> '+bloq+
        '<div class="small">'+esc(o.type)+(o.issue?' · '+esc(trunc(o.issue,40)):'')+'</div>'+
        '<div class="small" style="color:var(--green2)">'+esc(otNextActor(o))+(o.responsable?' · resp. '+esc(o.responsable):'')+(o.fechaPrevista?' · prevista '+fmtTs(o.fechaPrevista).slice(0,5):'')+'</div></div></div>';
    }).join(''):'<div class="small">Sin trabajos abiertos ✓</div>';
    const hist=(m.history||[]).slice(0,5);
    html+='<div class="agenda-day" style="margin-top:14px">Historial reciente</div><div class="timeline">'+hist.map(h=>
      '<div class="timeline-item"><div class="ticon"><svg class="ic ic-sm"><use href="#i-clock"/></svg></div><div><div class="tname">'+esc(h.title)+'</div><div class="tdetail">'+esc(h.detail||'')+'</div></div><div class="date">'+fmtTs(h.ts)+'</div></div>').join('')+'</div>';
    const mpix=machinePix(m);if(mpix)html='<img src="'+mpix+'" alt="" style="width:100%;max-height:190px;object-fit:cover;border-radius:12px;margin-bottom:12px"/>'+html;
    document.getElementById('miBody').innerHTML=html;
    const admin=currentRole==='admin'&&!esTecnico();
    document.getElementById('miActions').innerHTML=(admin?'<button class="solid-btn" onclick="APP.closeModal(\'mMachineInfo\');APP.openOTModal(\''+mid+'\')">Nueva OT</button>'+
      '<button class="outline-btn" onclick="APP.closeModal(\'mMachineInfo\');APP.openMachineModal(\''+mid+'\')">Editar</button>':'')+
      '<button class="outline-btn" onclick="APP.closeModal(\'mMachineInfo\');APP.openHours(\''+mid+'\')">Actualizar horas</button>'+
      '<button class="outline-btn" onclick="APP.closeModal(\'mMachineInfo\');APP.openHistory(\''+mid+'\')">Historial completo</button>';
    this.openModal('mMachineInfo');
  },
  openOtInfo(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    document.getElementById('oiOtId').value=otId;
    document.getElementById('oiTitle').textContent=(ot.type==='Cita preventiva'?'Turno ':'Orden ')+ot.id;
    document.getElementById('oiSub').textContent=(m?mLabel(m):'')+(m&&m.serial?' · SN '+m.serial:'')+' · '+(c?c.name:'');
    const estado=({solicitada:'Pedido — proponer día',propuesta:'Esperando respuesta',rechazada:'Rechazado',confirmada:'Confirmado'}[ot.cita]||ot.status)+(ot.status==='terminada'?' · terminada':'');
    document.getElementById('oiInfo').innerHTML=
      '<div class="meta">Cliente<span>'+esc(c?c.name:'—')+'</span></div>'+
      '<div class="meta">Equipo<span>'+esc(m?mLabel(m):'—')+'</span></div>'+
      '<div class="meta">Servicio<span>'+esc(ot.type)+'</span></div>'+
      '<div class="meta">Fecha<span>'+(ot.proposedDate?fmtDate(ot.proposedDate)+(ot.proposedTime?' · '+ot.proposedTime:''):'sin fecha')+'</span></div>'+
      '<div class="meta">Estado<span>'+estado+'</span></div>'+
      '<div class="meta">Técnico<span>'+esc(ot.tech||'—')+'</span></div>';
    document.getElementById('oiResp').value=ot.responsable||ot.tech||'';
    document.getElementById('oiFecha').value=ot.fechaPrevista?new Date(ot.fechaPrevista).toISOString().slice(0,10):'';
    document.getElementById('oiEstado').value='';
    document.getElementById('oiBloqueo').value=ot.bloqueo||'pieza';
    document.getElementById('oiBloqueoNota').value=ot.bloqueoNota||'';
    document.getElementById('oiBloqueoRow').style.display='';
    document.getElementById('oiNote').value=ot.note||'';
    const oiT=document.getElementById('oiTasks');
    if(ot.tasks&&ot.tasks.length){
      oiT.style.display='block';
      oiT.innerHTML='<b style="color:var(--ink)">Tareas</b><br>'+ot.tasks.map(tk=>(tk.done?'<span style="color:#1c6b3a">✓</span>':'○')+' '+esc(tk.t)+(tk.why&&!tk.done?' <i style="color:#a33">('+esc(tk.why)+')</i>':'')).join('<br>');
    }else oiT.style.display='none';
    let acts='';
    if(ot.status==='anulada'){
      acts='<span class="badge bad">Anulada'+(ot.anuladaMotivo?' — '+esc(ot.anuladaMotivo):'')+'</span>';
    }else if(otAbierta(ot)){
      acts='<button class="solid-btn" onclick="APP.closeModal(\'mOtInfo\');APP.openTurno(\''+ot.id+'\')"><svg class="ic ic-xs"><use href="#i-cal"/></svg>'+(ot.proposedDate?'Cambiar día':'Agendar')+'</button>'+
        ((ot.status==='recibida'||ot.status==='diagnostico'||ot.status==='presupuesto')?'<button class="solid-btn" onclick="APP.closeModal(\'mOtInfo\');APP.openBudget(\''+ot.id+'\')"><svg class="ic ic-xs"><use href="#i-mail"/></svg>Presupuesto</button>':'')+
        '<button class="outline-btn" onclick="APP.closeModal(\'mOtInfo\');APP.openTasks(\''+ot.id+'\')"><svg class="ic ic-xs"><use href="#i-clip"/></svg>Tareas</button>'+
        '<button class="outline-btn" onclick="APP.closeModal(\'mOtInfo\');APP.openDone(\''+ot.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Cerrar</button>'+
        '<button class="outline-btn" style="color:#ac4136" onclick="APP.openAnular(\''+ot.id+'\')">Anular</button>';
    }else{
      acts='<button class="solid-btn" onclick="APP.closeModal(\'mOtInfo\');APP.openReport(\''+ot.id+'\')"><svg class="ic ic-xs"><use href="#i-file"/></svg>Informe firmado</button>'+
      '<button class="outline-btn" onclick="APP.closeModal(\'mOtInfo\');APP.viewReport(\''+ot.id+'\')"><svg class="ic ic-xs"><use href="#i-search"/></svg>Ver</button>'+
        '<button class="outline-btn" onclick="APP.closeModal(\'mOtInfo\');APP.openInvoice(\''+ot.id+'\')"><svg class="ic ic-xs"><use href="#i-printer"/></svg>Factura</button>';
    }
    document.getElementById('oiActions').innerHTML=acts;
    this.openModal('mOtInfo');
  },
  saveOtInfo(){
    const ot=db.ots.find(o=>o.id===document.getElementById('oiOtId').value);if(!ot)return;
    const resp=document.getElementById('oiResp').value.trim();
    const fecha=document.getElementById('oiFecha').value;
    const estado=document.getElementById('oiEstado').value;
    const bloq=document.getElementById('oiBloqueo').value;
    const bloqNota=document.getElementById('oiBloqueoNota').value.trim();
    if(resp!==(ot.responsable||''))ot.responsable=resp;
    ot.fechaPrevista=fecha?new Date(fecha+'T12:00:00').getTime():null;
    if(estado){ot.status=estado;if(estado==='bloqueada'){ot.bloqueo=bloq;ot.bloqueoNota=bloqNota}else{ot.bloqueo=null;ot.bloqueoNota=''}}
    else if(ot.status==='bloqueada'){ot.bloqueo=bloq;ot.bloqueoNota=bloqNota}
    const m=machineOf(ot.machineId);
    if(m)m.history.unshift({ts:Date.now(),title:'Orden actualizada · '+ot.id,detail:'Responsable: '+(resp||'—')+(fecha?' · prevista '+fmtDate(fecha):'')+(ot.status==='bloqueada'?' · bloqueada por '+(ot.bloqueo==='pieza'?'repuesto':(ot.bloqueo==='autorizacion'?'autorización':'técnico')):'')});
    saveDb();this.closeModal('mOtInfo');toast('Orden actualizada');renderAll();
  },
  openAnular(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot||!otAbierta(ot)){this.toast('Solo se pueden anular órdenes abiertas');return}
    const m=machineOf(ot.machineId);
    document.getElementById('anId').value=otId;
    document.getElementById('anSub').textContent=ot.id+' · '+(m?mLabel(m):'');
    document.getElementById('anMotivo').value='';
    this.openModal('mAnular');
  },
  doAnular(){
    const ot=db.ots.find(o=>o.id===document.getElementById('anId').value);if(!ot)return;
    const motivo=document.getElementById('anMotivo').value.trim()||'sin motivo';
    ot.status='anulada';ot.anuladaMotivo=motivo;ot.anuladaAt=Date.now();
    ot.cita=null;ot.proposedDate=null;ot.proposedTime=null;
    const m=machineOf(ot.machineId);
    if(m)m.history.unshift({ts:Date.now(),title:'Orden anulada · '+ot.id,detail:motivo});
    saveDb();this.closeModal('mAnular');toast(ot.id+' anulada');renderAll();
  },
  openBudget(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const m=machineOf(ot.machineId);
    document.getElementById('bgOtId').value=otId;
    document.getElementById('bgSub').textContent=ot.id+' · '+(m?mLabel(m):'');
    document.getElementById('bgBase').value=(ot.presupuesto&&ot.presupuesto.base)||'';
    document.getElementById('bgIva').value=(ot.presupuesto&&ot.presupuesto.iva)||21;
    document.getElementById('bgNota').value='';
    this.openModal('mBudget');
  },
  saveOtNote(){
    const ot=db.ots.find(o=>o.id===document.getElementById('oiOtId').value);if(!ot)return;
    const v=document.getElementById('oiNote').value.trim();
    if(v!==(ot.note||'')){
      ot.note=v;
      const m=machineOf(ot.machineId);
      if(m)m.history.unshift({ts:Date.now(),title:'Nota en '+ot.id,detail:v||'(nota borrada)'});
      saveDb();toast('Nota guardada');renderPage('workshop');
    }else toast('Sin cambios');
  },
  openTasks(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const m=machineOf(ot.machineId);
    const g=m&&m.serviceGroup&&SERVICE_GROUPS[m.serviceGroup];
    const row=document.getElementById('tplRow');
    if(!g){row.style.display='none'}
    else{
      row.style.display='flex';
      let html='';
      if(g.byService){
        html='<span class="small" style="align-self:center">Cargar checklist:</span>'+g.services.map((s,i)=>'<button class="outline-btn" onclick="APP.loadTemplateTasks('+(i+1)+')"><svg class="ic ic-xs"><use href="#i-clip"/></svg>'+s.t.replace('Servicio de ','')+'</button>').join('');
      }else{
        html='<button class="outline-btn" onclick="APP.loadTemplateTasks(0)"><svg class="ic ic-xs"><use href="#i-clip"/></svg>Cargar checklist · '+g.name+'</button>';
      }
      row.innerHTML=html;
    }
    document.getElementById('taskSub').textContent=ot.id+' · '+(m?mLabel(m):'')+' · '+ot.type;
    document.getElementById('taskOtId').value=otId;
    document.getElementById('taskNew').value='';
    ot.tasks=ot.tasks||[];
    this.renderTasks();this.openModal('mTasks');
  },
  renderTasks(){
    const ot=db.ots.find(o=>o.id===document.getElementById('taskOtId').value);if(!ot)return;
    const list=document.getElementById('taskList');
    list.innerHTML=(ot.tasks&&ot.tasks.length)?ot.tasks.map((t,i)=>
      '<div class="task'+(t.done?' done':'')+'"><input type="checkbox"'+(t.done?' checked':'')+' onchange="APP.toggleTask('+i+')" /><span>'+esc(t.t)+'</span>'+
      '<button class="mini-btn" title="Quitar" onclick="APP.delTask('+i+')"><svg class="ic ic-xs"><use href="#i-x"/></svg></button>'+
      (t.done?'':'<input class="taskwhy" placeholder="¿Por qué no se realizó? (queda en el informe)" value="'+esc(t.why||'')+'" onchange="APP.setTaskWhy('+i+',this.value)" />')+
      '</div>'
    ).join(''):'<div class="small" style="padding:6px 0 2px">Sin tareas todavía — agregá qué hay que hacer.</div>';
  },
  loadTemplateTasks(which){
    const ot=db.ots.find(o=>o.id===document.getElementById('taskOtId').value);if(!ot)return;
    const m=machineOf(ot.machineId);
    const g=m&&m.serviceGroup&&SERVICE_GROUPS[m.serviceGroup];
    if(!g){toast('Esta máquina no tiene grupo de servicio');return}
    let tasks=[],titulo=g.name;
    if(g.byService&&which){
      const svc=g.services[which-1];
      svc.tasks.forEach(it=>tasks.push({t:svc.t+' — '+it,done:false}));
      titulo=svc.t;
    }else{
      g.checklist.forEach(sec=>sec.items.forEach(it=>tasks.push({t:sec.sec+' — '+it,done:false})));
    }
    ot.tasks=tasks;
    saveDb();this.renderTasks();renderPage('workshop');
    toast('Checklist cargado: '+tasks.length+' puntos · '+titulo);
  },
  addTask(){
    const ot=db.ots.find(o=>o.id===document.getElementById('taskOtId').value);if(!ot)return;
    const v=document.getElementById('taskNew').value.trim();if(!v)return;
    ot.tasks=ot.tasks||[];ot.tasks.push({t:v,done:false});
    document.getElementById('taskNew').value='';
    saveDb();this.renderTasks();renderPage('workshop');
  },
  setTaskWhy(i,v){
    const ot=db.ots.find(o=>o.id===document.getElementById('taskOtId').value);if(!ot||!ot.tasks||!ot.tasks[i])return;
    ot.tasks[i].why=v.trim();
    saveDb();
  },
  toggleTask(i){
    const ot=db.ots.find(o=>o.id===document.getElementById('taskOtId').value);if(!ot||!ot.tasks||!ot.tasks[i])return;
    ot.tasks[i].done=!ot.tasks[i].done;
    saveDb();this.renderTasks();renderPage('workshop');
  },
  delTask(i){
    const ot=db.ots.find(o=>o.id===document.getElementById('taskOtId').value);if(!ot||!ot.tasks)return;
    ot.tasks.splice(i,1);
    saveDb();this.renderTasks();renderPage('workshop');
  },

  markReady(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot||ot.status!=='terminada')return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    document.getElementById('readyOtId').value=otId;
    document.getElementById('readySub').textContent=ot.id+' · '+mLabel(m)+' · '+(c?c.name:'');
    const d=new Date();
    document.getElementById('readyDate').value=todayISO();
    d.setHours(d.getHours()+1,0,0,0);
    document.getElementById('readyTime').value=String(d.getHours()).padStart(2,'0')+':00';
    this.openModal('mReady');
  },
  sendReady(){
    const otId=document.getElementById('readyOtId').value;
    const ot=db.ots.find(o=>o.id===otId);if(!ot||ot.status!=='terminada')return;
    const date=document.getElementById('readyDate').value||todayISO();
    const time=document.getElementById('readyTime').value;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    ot.ready=true;ot.pickupDate=date;ot.pickupTime=time;
    pushNotif('client','i-checkc','Tu máquina está lista para retirar ✓','Puede retirarse a partir del '+fmtDate(date)+(time?' a las '+time:'')+' — '+mLabel(m)+' · '+ot.id+'. Revisá el informe del service y firmalo desde acá.',m.clientId,{kind:'retiro',otId:ot.id});
    saveDb();this.closeModal('mReady');
    toast('Aviso enviado: retiro desde '+fmtDate(date)+(time?' '+time:''));renderAll();
  },
  openClientSign(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot||ot.status!=='terminada')return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    document.getElementById('csOtId').value=otId;
    document.getElementById('csSub').textContent=ot.id+' · '+mLabel(m)+' · '+(c?c.name:'')+' · '+fmtTs(ot.closedAt||Date.now())+(ot.pickupDate?' — retiro desde '+fmtDate(ot.pickupDate)+(ot.pickupTime?' '+ot.pickupTime:''):'');
    let html='<div style="font-size:13.5px;line-height:1.6"><b>Trabajo realizado:</b> '+esc(ot.workDone||ot.issue||ot.type)+'</div>';
    if(ot.tasks&&ot.tasks.length){
      html+='<div style="font-size:12.5px;margin-top:8px;line-height:1.8">'+ot.tasks.map(t2=>(t2.done?'<span style="color:#1c6b3a">✓</span>':'○')+' '+esc(t2.t)).join('<br>')+'</div>';
    }
    document.getElementById('csTasks').innerHTML=html;
    this.openModal('mClientSig');
    this.initSig2();
  },
  initSig2(){
    const c=document.getElementById('sigCanvas2');
    const ctx=c.getContext('2d');
    const rect=c.getBoundingClientRect();
    if(c.width!==Math.round(rect.width*2)){c.width=Math.round(rect.width*2);c.height=300}
    ctx.clearRect(0,0,c.width,c.height);
    ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#0f271c';
    let drawing=false;
    const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*(c.width/r.width),y:(e.clientY-r.top)*(c.height/r.height)}};
    c.onpointerdown=e=>{drawing=true;APP._sig2Dirty=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()};
    c.onpointermove=e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()};
    c.onpointerup=()=>{drawing=false};c.onpointerleave=()=>{drawing=false};c.onpointercancel=()=>{drawing=false};
  },
  sig2Clear(){
    const c=document.getElementById('sigCanvas2');
    c.getContext('2d').clearRect(0,0,c.width,c.height);
    this._sig2Dirty=false;
  },
  saveClientSign(){
    const ot=db.ots.find(o=>o.id===document.getElementById('csOtId').value);if(!ot)return;
    const canvas=document.getElementById('sigCanvas2');
    if(!(this._sig2Dirty&&!this.isBlankSig(canvas))){toast('Dibujá tu firma para confirmar');return}
    ot.signature=canvas.toDataURL('image/png');
    ot.clientSignedAt=Date.now();
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    pushNotif('admin','i-checkc','Informe firmado por el cliente',(c?c.name:'Cliente')+' firmó el informe '+ot.id+' · '+mLabel(m));
    saveDb();this.closeModal('mClientSig');this._sig2Dirty=false;
    toast('¡Listo! Informe firmado ✓');renderAll();
  },

  notifGo(id){
    const n=db.notifs.find(x=>x.id===id);if(!n)return;
    closeNotif();
    const ot=n.otId?db.ots.find(o=>o.id===n.otId):null;
    if(currentRole==='client'){
      if(n.kind==='retiro'&&ot){this.openClientSign(ot.id);return}
      if(n.kind==='cita'&&ot){gotoPage('clientservices');return}
      if(n.title.indexOf('completado')>=0){gotoPage('clientservices');return}
      gotoPage('clientmachines');return;
    }
    if((n.kind==='cita'||n.kind==='retiro')&&ot){gotoPage('workshop');this.openOtInfo(ot.id);return}
    if(n.title.indexOf('Stock')>=0){gotoPage('parts');return}
    if(n.title.indexOf('Garant')>=0||n.title.indexOf('Aviso')>=0||n.title.indexOf('aviso')>=0||n.title.indexOf('Planilla')>=0){gotoPage('machines');return}
    if(ot){gotoPage('workshop');this.openOtInfo(ot.id);return}
    gotoPage('dashboard');
  },

  /* ---- turnos: proponer / aceptar / rechazar ---- */
  openTurno(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    document.getElementById('turnoOtId').value=otId;
    document.getElementById('turnoSub').textContent=ot.id+' · '+(m?mLabel(m):'')+' · '+(c?c.name:'');
    const d=new Date();d.setDate(d.getDate()+1);
    document.getElementById('turnoDate').value=isoOf(d.getTime());
    document.getElementById('turnoTime').value='';
    document.getElementById('turnoNote').value='';
    this.openModal('mTurno');
  },
  saveTurno(){
    const otId=document.getElementById('turnoOtId').value;
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const date=document.getElementById('turnoDate').value;
    if(!date){this.toast('Elegí un día para el turno');return}
    const time=document.getElementById('turnoTime').value.trim();
    const note=document.getElementById('turnoNote').value.trim();
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    ot.proposedDate=date;ot.proposedTime=time;ot.turnoNote=note;
    ot.issue='Turno: '+fmtDate(date)+(time?' '+time:'')+(note?' · '+note:'');
    if(ot.origin==='cliente'){
      ot.cita='propuesta';
      if(m)m.history.unshift({ts:Date.now(),title:'Turno propuesto · '+ot.id,detail:fmtDate(date)+(time?' '+time:'')+(note?' · '+note:'')});
      pushNotif('client','i-cal','Turno propuesto para tu '+mLabel(m),fmtDate(date)+(time?' · '+time:'')+(note?' — '+note:'')+'. Aceptalo o rechazalo acá.',m.clientId,{kind:'cita',otId:ot.id});
      this.toast('Propuesta enviada al cliente: '+fmtDate(date));
    }else{
      ot.cita='confirmada';
      if(m)m.history.unshift({ts:Date.now(),title:'Agendado · '+ot.id,detail:fmtDate(date)+(time?' '+time:'')});
      this.toast('Turno agendado: '+fmtDate(date));
    }
    saveDb();this.closeModal('mTurno');renderAll();
  },
  citaAccept(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot||ot.cita!=='propuesta')return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    ot.cita='confirmada';
    if(m)m.history.unshift({ts:Date.now(),title:'Turno confirmado · '+ot.id,detail:'El cliente aceptó el '+fmtDate(ot.proposedDate)});
    pushNotif('admin','i-checkc','Turno confirmado ✓',(c?c.name+' aceptó':'Cliente aceptó')+' el turno del '+fmtDate(ot.proposedDate)+' · '+(m?mLabel(m):''));
    saveDb();toast('Turno confirmado ✓ Nos vemos el '+fmtDate(ot.proposedDate));renderAll();
  },
  citaReject(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot||ot.cita!=='propuesta')return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    ot.cita='rechazada';
    if(m)m.history.unshift({ts:Date.now(),title:'Turno rechazado · '+ot.id,detail:'El cliente no pudo el '+fmtDate(ot.proposedDate)+' — esperar nueva propuesta'});
    pushNotif('admin','i-alert','Turno rechazado',(c?c.name+' rechazó':'Cliente rechazó')+' el turno del '+fmtDate(ot.proposedDate)+' — proponé otro día');
    saveDb();toast('Rechazado — avisamos al taller para proponerte otro día');renderAll();
  },

  openImport(){importPending=null;document.getElementById('impPreview').innerHTML='';this.openModal('mImport')},
  downloadTemplate(){
    const csv='cliente;cuit;contacto;telefono;email;marca;modelo;serie;horas;revision_horas;revision_meses;entrega;garantia;precio_venta;precio_servicio;grupo\n'+
      'Agro Sur SRL;30-70123456-9;Carlos Gómez;+54 9 11 5555 1234;carlos@agrosur.com.ar;Kubota;M5-112;KBT-12345;1230;500;12;15/03/2026;30/06/2028;95000000;750000;mini\n'+
      'Agro Sur SRL;30-70123456-9;Carlos Gómez;+54 9 11 5555 1234;carlos@agrosur.com.ar;Husqvarna;P 525DX;HQ-99887;410;400;12;10/05/2026;;12000000;;mini\n'+
      'Finca La Sierra;30-70999888-4;Ana Vila;+54 9 11 4444 3333;ana@sierra.com.ar;John Deere;5075E;JD-556677;680;2000;12;01/09/2025;01/09/2027;88000000;700000';
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='plantilla-terrafleet.csv';
    document.body.appendChild(a);a.click();a.remove();
  },
  importCSVText(text){
    const res=parseCSVText(text);
    if(!res.rows.length){
      document.getElementById('impPreview').innerHTML='<div class="notice" style="background:var(--red-soft)"><svg class="ic" style="color:#ac4136"><use href="#i-alert"/></svg><div>'+(res.errors&&res.errors[0]||'No se pudo leer el archivo.')+'</div></div>';
      return;
    }
    importPending=res.rows;
    document.getElementById('impPreview').innerHTML=
      '<div class="notice"><svg class="ic"><use href="#i-checkc"/></svg><div><b>'+res.rows.length+' máquinas listas para importar.</b> '+(res.errors.length?('Avisos: '+res.errors.slice(0,3).join(' · ')+((res.errors.length>3)?'…':'')):'Sin errores.')+'</div></div>'+
      '<div class="action-row"><button class="solid-btn" onclick="APP.doImport()"><svg class="ic ic-xs"><use href="#i-check"/></svg>Importar '+res.rows.length+' máquinas</button></div>';
  },
  doImport(){
    if(!importPending)return;
    let created=0,updated=0,newClients=0;
    importPending.forEach(r=>{
      let c=db.clients.find(x=>x.name.toLowerCase()===r.cliente.toLowerCase());
      if(!c){c={id:uid('c'),name:r.cliente,cuit:r.cuit||'',contact:r.contacto||'',phone:r.telefono||'',email:r.email||''};db.clients.push(c);newClients++}
      else{if(r.telefono&&!c.phone)c.phone=r.telefono;if(r.email&&!c.email)c.email=r.email;if(r.contacto&&!c.contact)c.contact=r.contacto;if(r.cuit&&!c.cuit)c.cuit=r.cuit}
      const hours=normHours(r.horas);
      const existing=r.serie?db.machines.find(m=>m.serial&&m.serial.toLowerCase()===r.serie.toLowerCase()):null;
      if(existing){
        if(hours>existing.hours)existing.hours=hours;
        existing.lastHoursUpdate=Date.now();
        const w=normDate(r.garantia);if(w)existing.warrantyEnd=w;
        const sp=normHours(r.precio_venta);if(sp)existing.salePrice=sp;
        const pp=normHours(r.precio_servicio);if(pp)existing.servicePrice=pp;
        existing.stage=dueInfo(existing).state;
        existing.history.unshift({ts:Date.now(),title:'Actualizada desde planilla',detail:'Importación CSV · '+nf(hours)+' h'});
        updated++;
      }else{
        db.machines.push({id:uid('m'),clientId:c.id,brand:r.marca||'',model:r.modelo||'',serial:r.serie||'',iconKey:'tractor',
          hours:hours,lastServiceHours:hours,lastHoursUpdate:Date.now(),
          lastServiceDate:normDate(r.ultimo_servicio)||todayISO(),
          intervalH:Math.max(50,normHours(r.revision_horas)||500),intervalM:Math.max(1,normHours(r.revision_meses)||12),
          warrantyEnd:normDate(r.garantia)||null,
          salePrice:normHours(r.precio_venta)||null,
          servicePrice:normHours(r.precio_servicio)||null,
          serviceGroup:(/mini|corta|radio/i.test(r.grupo||''))?'mini':((/lovol/i.test(r.grupo||''))?'lovol':null),
          stage:'ok',
          history:[{ts:Date.now(),title:'Importada de planilla',detail:'Alta CSV · '+nf(hours)+' h registradas'}]});
        created++;
      }
    });
    pushNotif('admin','i-upload','Planilla importada',created+' máquinas nuevas · '+updated+' actualizadas · '+newClients+' clientes nuevos');
    saveDb();importPending=null;this.closeModal('mImport');
    toast('Importación lista: '+created+' nuevas, '+updated+' actualizadas');
    machFilter='all';renderAll();
  },

  openInvoice(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    document.getElementById('invOtId').value=otId;
    document.getElementById('invSub').textContent=ot.id+' · '+(m?mLabel(m):'')+(m&&m.serial?' · SN '+m.serial:'')+' · '+(c?c.name:'');
    const prefill=(ot.invoiceBase!=null)?ot.invoiceBase:((m&&m.servicePrice&&!m.servicePriceTBD&&ot.type==='Revisión preventiva')?m.servicePrice:0);
    document.getElementById('invBase').value=prefill;
    document.getElementById('invSerie').value=ot.invoiceSerie||'';
    document.getElementById('invNo').value=ot.invoiceNo||('F-'+new Date().getFullYear()+'-'+String((db.meta.invSeq||0)+1).padStart(3,'0'));
    document.getElementById('invIva').value=ot.invoiceIva!=null?ot.invoiceIva:21;
    document.getElementById('invConcept').value=ot.invoiceConcept||(ot.type+(ot.issue?' · '+ot.issue:''));
    this.invCalc();this.openModal('mInvoice');
  },
  invCalc(){
    const base=Number(document.getElementById('invBase').value||0);
    const iva=Number(document.getElementById('invIva').value||0);
    document.getElementById('invTotal').textContent='$ '+(base*(1+iva/100)).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
  },
  printInvoice(){
    const otId=document.getElementById('invOtId').value;
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    const base=Number(document.getElementById('invBase').value||0);
    const iva=Number(document.getElementById('invIva').value||0);
    const concept=document.getElementById('invConcept').value||ot.type;
    const serie=document.getElementById('invSerie').value.trim();
    let num=document.getElementById('invNo').value.trim();
    if(!num){db.meta.invSeq=(db.meta.invSeq||0)+1;num='F-'+new Date().getFullYear()+'-'+String(db.meta.invSeq).padStart(3,'0')}
    else if(!ot.invoiceNo){db.meta.invSeq=(db.meta.invSeq||0)+1}
    ot.invoiceSerie=serie;
    ot.invoiceNo=(serie?serie+'-':'')+num;
    ot.invoiced=true;ot.invoiceBase=base;ot.invoiceIva=iva;ot.invoiceConcept=concept;ot.invoiceDate=todayISO();
    const biz=db.meta.biz||{};
    const html='<!doctype html><html><head><meta charset="utf-8"><title>'+ot.invoiceNo+'</title>'+
      '<style>body{font-family:Inter,system-ui,sans-serif;color:#111;margin:0;padding:32px;font-size:13px}'+
      '.wrap{max-width:700px;margin:0 auto}'+
      '.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid '+brandP()+';padding-bottom:16px}'+
      '.biz h1{margin:0;font-size:20px;color:'+brandP()+'}.biz div{color:#555;margin-top:3px}'+
      '.num{text-align:right}.num b{font-size:22px;display:block}.num div{color:#555;margin-top:3px}'+
      '.client{margin:22px 0;background:#f4f7f3;border-radius:10px;padding:14px}'+
      'table{width:100%;border-collapse:collapse}th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#777;border-bottom:1px solid #ddd;padding:8px 4px}'+
      'td{padding:10px 4px;border-bottom:1px solid #eee}.r{text-align:right}'+
      '.tot td{border:0;font-size:15px;padding:6px 4px}.tot.big td{font-weight:800;font-size:18px;color:'+brandP()+'}'+
      '.foot{margin-top:34px;color:#888;font-size:11px;text-align:center}</style></head><body><div class="wrap">'+
      '<div class="head"><div class="biz">'+(typeof TFPro!=='undefined'?TFPro.logoHTML(48):'')+'<h1>'+esc(biz.name||'Mi Empresa')+'</h1>'+(biz.cif?'<div>CUIT: '+esc(biz.cif)+'</div>':'')+(biz.phone?'<div>Tel. '+esc(biz.phone)+'</div>':'')+(biz.city?'<div>'+esc(biz.city)+'</div>':'')+'</div>'+
      '<div class="num"><b>FACTURA</b><div>'+ot.invoiceNo+'</div><div>'+fmtDate(todayISO())+'</div></div></div>'+
      '<div class="client"><b>Cliente</b><br>'+esc(c?c.name:'—')+(c&&c.contact?' · '+esc(c.contact):'')+(c&&c.phone?'<br>Tel. '+esc(c.phone):'')+(c&&c.email?' · '+esc(c.email):'')+'<br>'+(m?'Equipo: '+esc(mLabel(m))+' · SN '+esc(m.serial||'—')+' · OT '+esc(ot.id):'')+'</div>'+
      '<table><thead><tr><th>Concepto</th><th class="r">Importe</th></tr></thead><tbody>'+
      '<tr><td>'+esc(concept)+'</td><td class="r">'+'$ '+base.toLocaleString('es-AR',{minimumFractionDigits:2})+'</td></tr>'+
      '<tr class="tot"><td class="r">Base imponible</td><td class="r">'+'$ '+base.toLocaleString('es-AR',{minimumFractionDigits:2})+'</td></tr>'+
      '<tr class="tot"><td class="r">IVA ('+iva+'%)</td><td class="r">'+'$ '+(base*iva/100).toLocaleString('es-AR',{minimumFractionDigits:2})+'</td></tr>'+
      '<tr class="tot big"><td class="r">Total</td><td class="r">'+'$ '+(base*(1+iva/100)).toLocaleString('es-AR',{minimumFractionDigits:2})+'</td></tr>'+
      '</tbody></table><div class="foot">Gracias por confiar en nuestro servicio.<br>Documento generado con TerraFleet · demo</div></div></body></html>';
    saveDb();this.closeModal('mInvoice');renderAll();
    toast('Factura '+ot.invoiceNo+' generada');
    const f=document.createElement('iframe');
    f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    f.srcdoc=html;
    f.onload=function(){try{f.contentWindow.print()}catch(e){}};
    document.body.appendChild(f);
    setTimeout(function(){f.remove()},60000);
  },

  /* ---- informe de servicio con firma ---- */

  openReport(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    document.getElementById('repOtId').value=otId;
    document.getElementById('repSub').textContent=ot.id+' · '+(m?mLabel(m):'')+(m&&m.serial?' · SN '+m.serial:'')+' · '+(c?c.name:'');
    document.getElementById('repObs').value=ot.reportObs||'';
    this.openModal('mReport');
    this.initSig();
  },
  initSig(){
    const c=document.getElementById('sigCanvas');
    const ctx=c.getContext('2d');
    const rect=c.getBoundingClientRect();
    if(c.width!==Math.round(rect.width*2)){c.width=Math.round(rect.width*2);c.height=300}
    ctx.clearRect(0,0,c.width,c.height);
    ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#0f271c';
    let drawing=false;
    const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*(c.width/r.width),y:(e.clientY-r.top)*(c.height/r.height)}};
    const down=e=>{drawing=true;APP._sigDirty=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()};
    const move=e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()};
    const up=()=>{drawing=false};
    c.onpointerdown=down;c.onpointermove=move;
    c.onpointerup=up;c.onpointerleave=up;c.onpointercancel=up;
  },
  sigClear(){
    const c=document.getElementById('sigCanvas');
    c.getContext('2d').clearRect(0,0,c.width,c.height);
    this._sigDirty=false;
  },
  viewReport(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    this._viewOt=otId;
    document.getElementById('viewTitle').textContent='Informe de servicio · '+ot.id;
    document.getElementById('viewFrame').srcdoc=buildReportHTML(ot);
    const needSig=ot.status==='terminada'&&!ot.signature;
    const gate=document.getElementById('viewGate'),btn=document.getElementById('viewPrintBtn');
    if(needSig){
      gate.style.display='flex';
      gate.innerHTML='<svg class="ic" style="width:22px;height:22px;color:var(--amber)"><use href="#i-file"/></svg>'+
        '<div style="flex:1;min-width:220px"><b>Informe sin firma</b><div class="small">Primero fírmalo — es tu conformidad con el servicio. Después podés descargarlo o imprimirlo.</div></div>'+
        '<button class="solid-btn" onclick="APP.closeModal(\'mView\');APP.openClientSign(\''+ot.id+'\')"><svg class="ic ic-xs"><use href="#i-check"/></svg>Firmar ahora</button>';
      btn.style.display='none';
    }else{gate.style.display='none';btn.style.display=''}
    this.openModal('mView');
  },
  printView(){
    const ot=db.ots.find(o=>o.id===this._viewOt);
    if(ot&&ot.status==='terminada'&&!ot.signature){this.toast('Primero firmá el informe — después podés descargarlo');return}
    const f=document.getElementById('viewFrame');
    try{f.contentWindow.print()}catch(e){toast('Usá el botón derecho → Imprimir')};
  },
  printReport(){
    const otId=document.getElementById('repOtId').value;
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    ot.reportObs=document.getElementById('repObs').value.trim();
    const canvas=document.getElementById('sigCanvas');
    if(this._sigDirty&&!this.isBlankSig(canvas))ot.signature=canvas.toDataURL('image/png');
    ot.reportPrinted=true;
    const biz=db.meta.biz||{};
    const fecha=ot.closedAt?new Date(ot.closedAt):new Date();
    const html=buildReportHTML(ot);
    saveDb();this.closeModal('mReport');this._sigDirty=false;renderAll();
    toast('Informe '+ot.id+' generado'+(ot.signature?' con firma ✓':''));
    const f=document.createElement('iframe');
    f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    f.srcdoc=html;
    f.onload=function(){try{f.contentWindow.print()}catch(e){}};
    document.body.appendChild(f);
    setTimeout(function(){f.remove()},60000);
  },
  isBlankSig(canvas){
    try{
      const ctx=canvas.getContext('2d');
      const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      for(let i=3;i<d.length;i+=4){if(d[i]>0)return false}
      return true;
    }catch(e){return true}
  },

  copyText(t,msg){
    const done=()=>toast(msg||'Copiado al portapapeles');
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(done).catch(()=>this.showShareBox(t));
    }else this.showShareBox(t);
  },
  showShareBox(t){document.getElementById('shareBox').value=t;this.openModal('mShare');document.getElementById('shareBox').select()},
  copyAppLink(){this.copyText(location.href.split('#')[0],'Enlace de la app copiado')},
  copyDataLink(){
    const b=b64enc(JSON.stringify(db));
    if(!b||b.length>50000){toast('Demasiados datos para el enlace: usá «Exportar copia (JSON)»');return}
    this.copyText(location.href.split('#')[0]+'#datos='+b,'Enlace con tus datos copiado');
  },
  applyHashData(){
    if(location.hash.indexOf('#datos=')!==0)return false;
    const obj=(()=>{try{const raw=b64dec(decodeURIComponent(location.hash.slice(7)));if(!raw)return null;const o=JSON.parse(raw);return (o&&Array.isArray(o.clients)&&Array.isArray(o.machines)&&Array.isArray(o.ots)&&Array.isArray(o.notifs)&&Array.isArray(o.parts)&&o.meta)?o:null}catch(e){return null}})();
    history.replaceState(null,'',location.pathname+location.search);
    if(!obj){toast('El enlace traía datos pero no se pudieron leer');return false}
    if(!confirm('Este enlace contiene datos de una copia ('+obj.clients.length+' clientes, '+obj.machines.length+' máquinas). ¿Cargarlos y sustituir los actuales?'))return false;
    db=obj;
    db.session={clientId:null};
    db.notifs=db.notifs||[];db.parts=db.parts||[];
    db.meta.biz=db.meta.biz||{name:'Mi Empresa',cif:'',phone:'',city:''};
    migrate();
    recomputeStages(true);
    saveDb();renderAll();
    toast('Datos del enlace cargados ('+obj.clients.length+' clientes)');
    return true;
  },
  saveBiz(){
    db.meta.biz={name:document.getElementById('bizName').value.trim()||'Mi Empresa',cif:document.getElementById('bizCif').value.trim(),phone:document.getElementById('bizPhone').value.trim(),city:document.getElementById('bizCity').value.trim()};
    saveDb();toast('Datos de la empresa guardados');
  }
});
