/* ================= FUNCIONES PRO =================
   Buscador global · tablero del taller (kanban) · QR por máquina ·
   rentabilidad por orden · pronóstico de services · marca por agencia · modo oscuro.
   Se apoya en lo existente (db, APP, renderX) sin reescribirlo. */
const TFPro={};
(function(){
  'use strict';
  const isClient=()=>currentRole==='client';
  const myMachines=()=>isClient()?db.machines.filter(m=>m.clientId===db.session.clientId):db.machines;
  const myOts=()=>{if(!isClient())return db.ots;const ids=new Set(myMachines().map(m=>m.id));return db.ots.filter(o=>ids.has(o.machineId))};
  const norm=s=>String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const el=(html)=>{const d=document.createElement('div');d.innerHTML=html.trim();return d.firstChild};

  /* ───────────── Buscador global (Ctrl/⌘+K o /) ───────────── */
  let sIdx=0,sRes=[];
  function searchResults(q){
    const n=norm(q).trim();const out=[];
    if(!n)return out;
    const hit=(...parts)=>norm(parts.join(' ')).indexOf(n)>=0;
    myMachines().forEach(m=>{const c=clientOf(m.clientId);
      if(hit(m.brand,m.model,m.serial,c?c.name:''))out.push({k:'m',id:m.id,icon:iconOf(m),t:mLabel(m),s:(m.serial?'SN '+m.serial+' · ':'')+(c?c.name:'')+' · '+nf(m.hours)+' h'})});
    myOts().forEach(o=>{const m=machineOf(o.machineId),c=m?clientOf(m.clientId):null;
      if(hit(o.id,o.issue,o.type,m?mLabel(m):'',c?c.name:''))out.push({k:'o',id:o.id,icon:'#i-wrench',t:o.id+' · '+(OT_ESTADOS[o.status]||o.status),s:(m?mLabel(m)+' · ':'')+(o.issue||o.type||'')})});
    if(!isClient()){
      db.clients.forEach(c=>{if(hit(c.name,c.contact,c.cuit,c.phone,c.email))out.push({k:'c',id:c.id,icon:'#i-users',t:c.name,s:[c.contact,c.phone,c.cuit].filter(Boolean).join(' · ')})});
      db.parts.forEach(p=>{if(hit(p.ref,p.name))out.push({k:'p',id:p.id,icon:'#i-package',t:p.name,s:(p.ref?p.ref+' · ':'')+'stock '+nf(p.stock)})});
    }
    return out.slice(0,30);
  }
  function searchRender(){
    const box=$('#tfSearchRes'),q=$('#tfSearchIn').value;
    sRes=searchResults(q);if(sIdx>=sRes.length)sIdx=0;
    if(!q.trim()){box.innerHTML='<div class="tfs-hint">Escribí un cliente, un equipo, un número de serie o una orden.</div>';return}
    if(!sRes.length){box.innerHTML='<div class="tfs-hint">Sin resultados para «'+esc(q)+'».</div>';return}
    box.innerHTML=sRes.map((r,i)=>'<button class="tfs-item'+(i===sIdx?' on':'')+'" data-i="'+i+'"><span class="tile t-green"><svg class="ic ic-sm"><use href="'+r.icon+'"/></svg></span><span class="tfs-txt"><b>'+esc(r.t)+'</b><small>'+esc(r.s)+'</small></span></button>').join('');
  }
  function searchGo(r){
    if(!r)return;TFPro.closeSearch();
    if(r.k==='m'){if(isClient())gotoPage('clientmachines');APP.openMachineInfo(r.id)}
    else if(r.k==='o'){if(isClient())gotoPage('clientservices');else APP.openOtInfo(r.id)}
    else if(r.k==='c'){gotoPage('clients');APP.openClientModal(r.id)}
    else if(r.k==='p'){gotoPage('parts')}
  }
  TFPro.openSearch=function(){
    APP.closeMobileMenu();
    $('#tfSearch').classList.add('show');const i=$('#tfSearchIn');i.value='';sIdx=0;searchRender();setTimeout(()=>{try{i.focus()}catch(e){}},30);
  };
  TFPro.closeSearch=function(){$('#tfSearch').classList.remove('show')};
  TFPro._search=searchResults;

  /* ───────────── Tablero del taller (kanban) ───────────── */
  const COLS=[['cita','Turnos'],['recibida','Recibidas'],['diagnostico','Diagnóstico'],['presupuesto','Presupuesto'],['bloqueada','Bloqueadas'],['taller','En reparación'],['entrega','Para entregar']];
  const colOf=o=>o.status==='terminada'?((o.signature)?null:'entrega'):(o.status==='anulada'?null:o.status);
  function cardHTML(o){
    const m=machineOf(o.machineId),c=m?clientOf(m.clientId):null,col=colOf(o);
    const tasks=o.tasks&&o.tasks.length?'<span class="kb-chip">'+o.tasks.filter(t=>t.done).length+'/'+o.tasks.length+' tareas</span>':'';
    const resp=o.responsable?'<span class="kb-chip">'+esc(trunc(o.responsable,14))+'</span>':'';
    const prev=o.fechaPrevista?'<span class="kb-chip'+(o.fechaPrevista<Date.now()&&col!=='entrega'?' late':'')+'">'+fmtTs(o.fechaPrevista).slice(0,5)+'</span>':'';
    const turno=(o.status==='cita'&&o.proposedDate)?'<span class="kb-chip">'+fmtDate(o.proposedDate).slice(0,5)+(o.proposedTime?' '+o.proposedTime:'')+'</span>':'';
    const mover=col==='entrega'?'':'<select class="kb-move" aria-label="Mover '+esc(o.id)+'" onclick="event.stopPropagation()" onchange="TFPro.move(\''+o.id+'\',this.value);this.value=\'\'"><option value="">Mover…</option>'+
      COLS.filter(x=>x[0]!=='cita'&&x[0]!==col).map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+'</select>';
    return '<div class="kb-card" draggable="'+(col==='entrega'?'false':'true')+'" data-id="'+esc(o.id)+'" onclick="APP.openOtInfo(\''+o.id+'\')">'+
      '<div class="kb-top"><b>'+esc(o.id)+'</b>'+(o.origin==='cliente'?'<span class="kb-dot" title="Pedido desde el portal"></span>':'')+mover+'</div>'+
      '<div class="kb-m">'+esc(m?mLabel(m):'—')+'</div>'+
      '<div class="kb-c">'+esc(c?c.name:'')+'</div>'+
      (o.issue?'<div class="kb-i">'+esc(trunc(o.issue,70))+'</div>':'')+
      '<div class="kb-foot">'+turno+prev+resp+tasks+'</div>'+
      '<div class="kb-next">'+esc(otNextActor(o))+'</div></div>';
  }
  function renderKanban(){
    const host=$('#tfKanban');if(!host)return;
    const by={};COLS.forEach(c=>by[c[0]]=[]);
    db.ots.forEach(o=>{const c=colOf(o);if(c&&by[c])by[c].push(o)});
    Object.keys(by).forEach(k=>by[k].sort((a,b)=>(a.fechaPrevista||9e15)-(b.fechaPrevista||9e15)||String(a.id).localeCompare(String(b.id))));
    const total=COLS.reduce((s,c)=>s+by[c[0]].length,0);
    if(!total){host.innerHTML=emptyHTML('#i-wrench','No hay órdenes en curso. Creá una con «Nueva OT».');return}
    host.innerHTML='<div class="kb">'+COLS.map(c=>'<div class="kb-col" data-col="'+c[0]+'"><div class="kb-head"><span>'+c[1]+'</span><b>'+by[c[0]].length+'</b></div><div class="kb-list">'+
      (by[c[0]].map(cardHTML).join('')||'<div class="kb-empty">—</div>')+'</div></div>').join('')+'</div>';
  }
  TFPro.move=function(id,col){
    if(!col)return;
    APP.setOTStatus(id,col==='entrega'?'terminada':col);
  };
  let dragId=null;
  function kanbanWire(host){
    host.addEventListener('dragstart',e=>{const c=e.target.closest&&e.target.closest('.kb-card');if(!c)return;dragId=c.dataset.id;c.classList.add('drag');try{e.dataTransfer.setData('text/plain',dragId);e.dataTransfer.effectAllowed='move'}catch(x){}});
    host.addEventListener('dragend',e=>{const c=e.target.closest&&e.target.closest('.kb-card');if(c)c.classList.remove('drag');host.querySelectorAll('.kb-col.over').forEach(x=>x.classList.remove('over'));dragId=null});
    host.addEventListener('dragover',e=>{const col=e.target.closest&&e.target.closest('.kb-col');if(!col||!dragId||col.dataset.col==='cita')return;e.preventDefault();host.querySelectorAll('.kb-col.over').forEach(x=>{if(x!==col)x.classList.remove('over')});col.classList.add('over')});
    host.addEventListener('drop',e=>{const col=e.target.closest&&e.target.closest('.kb-col');if(!col||!dragId)return;e.preventDefault();const id=dragId,to=col.dataset.col;dragId=null;
      const o=db.ots.find(x=>x.id===id);if(!o||colOf(o)===to||to==='cita')return;TFPro.move(id,to)});
  }
  TFPro._colOf=colOf;

  /* ───────────── QR por máquina ───────────── */
  const qrUrl=id=>location.origin+location.pathname+'#m='+encodeURIComponent(id);
  function qrSvg(text,cell){
    if(typeof qrcode!=='function')return '';
    const q=qrcode(0,'M');q.addData(text);q.make();
    return q.createSvgTag({cellSize:cell||6,margin:2,scalable:true});
  }
  TFPro.openQR=function(mid){
    const m=machineOf(mid);if(!m)return;
    const c=clientOf(m.clientId),url=qrUrl(mid),svg=qrSvg(url);
    $('#tfQRBody').innerHTML=(svg?'<div class="qr-box">'+svg+'</div>':'<div class="small">No se pudo generar el código.</div>')+
      '<div class="qr-lbl"><b>'+esc(mLabel(m))+'</b><span>'+(m.serial?'SN '+esc(m.serial)+' · ':'')+esc(c?c.name:'')+'</span></div>'+
      '<div class="small" style="text-align:center;margin-top:8px">Pegá esta etiqueta en el equipo. Al escanearla con el celular se abre su ficha: el taller ve historial y órdenes; el cliente puede pedir turno.</div>';
    $('#tfQRPrint').onclick=()=>TFPro.printQR([mid]);
    APP.closeModal('mMachineInfo');APP.openModal('tfQR');
  };
  TFPro.printQR=function(ids){
    const biz=(db.meta&&db.meta.biz)||{};
    const labels=ids.map(id=>{const m=machineOf(id);if(!m)return '';const c=clientOf(m.clientId);
      return '<div class="l">'+qrSvg(qrUrl(id),4)+'<div><b>'+esc(mLabel(m))+'</b><span>'+(m.serial?'SN '+esc(m.serial):'')+'</span><span>'+esc(c?c.name:'')+'</span><em>'+esc(biz.name||'')+(biz.phone?' · '+esc(biz.phone):'')+'</em></div></div>'}).join('');
    const doc='<!doctype html><html><head><meta charset="utf-8"><title>Etiquetas QR</title><style>body{font-family:Inter,system-ui,sans-serif;margin:10mm;color:#0f271c}.g{display:grid;grid-template-columns:repeat(2,1fr);gap:6mm}.l{display:flex;gap:4mm;align-items:center;border:1px solid #cfd8cf;border-radius:3mm;padding:4mm;break-inside:avoid}.l svg{width:32mm;height:32mm;flex:none}.l b{display:block;font-size:12pt}.l span{display:block;font-size:9pt;color:#44564b}.l em{display:block;font-style:normal;font-size:8pt;color:#68776e;margin-top:2mm}</style></head><body><div class="g">'+labels+'</div></body></html>';
    let f=document.getElementById('tfPrintFrame');if(f)f.remove();
    f=document.createElement('iframe');f.id='tfPrintFrame';f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(f);
    f.contentDocument.open();f.contentDocument.write(doc);f.contentDocument.close();
    setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){toast('Usá el menú del navegador → Imprimir')}},250);
  };
  TFPro.printAllQR=function(){if(!db.machines.length){toast('Todavía no hay máquinas');return}TFPro.printQR(db.machines.map(m=>m.id))};
  /* Enlace de un QR: #m=<id de máquina> */
  TFPro.deepLink=function(){
    if(location.hash.indexOf('#m=')!==0)return false;
    const id=decodeURIComponent(location.hash.slice(3)),m=machineOf(id);
    if(m&&(!isClient()||m.clientId===db.session.clientId)){
      history.replaceState(null,'',location.pathname+location.search);
      if(isClient())gotoPage('clientmachines');
      APP.openMachineInfo(id);return true;
    }
    if(NUBE.sb&&!NUBE.on&&!NUBE.entering){NUBE.show('login');NUBE.msg('Ingresá con tu cuenta para ver la ficha de este equipo.',true)}
    else if(NUBE.on){history.replaceState(null,'',location.pathname+location.search);toast('Ese equipo no está entre los tuyos')}
    return false;
  };
  TFPro.afterEnter=function(){applyBrand();TFPro.deepLink()};

  /* ───────────── Rentabilidad por orden ───────────── */
  const costoHora=()=>Number(db.meta.costoHora)||0;
  function otMoney(o){
    const ingreso=o.invoiced?Number(o.invoiceBase||0):((o.presupuesto&&o.presupuesto.approved===true)?Number(o.presupuesto.base||0):null);
    const horas=Number(o.horasTrabajo)||0,mat=(Number(o.costoMateriales)||0)+(typeof TFGest!=='undefined'?TFGest.costoRepuestos(o):0);
    const costo=horas*costoHora()+mat;
    return {ingreso,horas,mat,costo,margen:ingreso==null?null:ingreso-costo};
  }
  TFPro._otMoney=otMoney;
  function renderRent(){
    const host=$('#tfRent');if(!host)return;
    const done=db.ots.filter(o=>o.status==='terminada').sort((a,b)=>(b.closedAt||0)-(a.closedAt||0));
    if(!done.length){host.innerHTML=emptyHTML('#i-chart','Cuando cierres órdenes, acá vas a ver cuánto dejó cada una: ingreso, horas, materiales y margen.');return}
    let ti=0,tc=0,n=0;
    const rows=done.slice(0,25).map(o=>{const x=otMoney(o),m=machineOf(o.machineId);
      if(x.ingreso!=null){ti+=x.ingreso;tc+=x.costo;n++}
      const pct=(x.ingreso&&x.ingreso>0)?Math.round(x.margen/x.ingreso*100):null;
      return '<tr onclick="APP.openOtInfo(\''+o.id+'\')" style="cursor:pointer"><td><b>'+esc(o.id)+'</b><div class="small">'+esc(m?mLabel(m):'')+'</div></td>'+
        '<td class="num">'+(x.ingreso==null?'<span class="small">sin facturar</span>':money(x.ingreso))+'</td>'+
        '<td class="num">'+(x.horas?nf(x.horas)+' h':'—')+'</td><td class="num">'+(x.mat?money(x.mat):'—')+'</td><td class="num">'+money(x.costo)+'</td>'+
        '<td class="num">'+(x.margen==null?'—':'<b style="color:'+(x.margen<0?'var(--red)':'var(--green2)')+'">'+money(x.margen)+'</b>'+(pct==null?'':' <span class="small">'+pct+'%</span>'))+'</td></tr>'}).join('');
    const tm=ti-tc;
    host.innerHTML=(costoHora()?'':'<div class="notice" style="margin-bottom:12px"><svg class="ic"><use href="#i-bulb"/></svg><div>Para que el costo incluya la mano de obra, cargá el <b>costo de la hora de taller</b> en Ajustes. Hoy solo se cuentan los materiales.</div></div>')+
      '<div class="rent-kpis"><div><span>Ingresos</span><b>'+money(ti)+'</b></div><div><span>Costos</span><b>'+money(tc)+'</b></div><div><span>Margen</span><b style="color:'+(tm<0?'var(--red)':'var(--green2)')+'">'+money(tm)+'</b></div><div><span>Margen %</span><b>'+(ti>0?Math.round(tm/ti*100)+'%':'—')+'</b></div></div>'+
      '<div class="tf-scroll"><table class="rent"><thead><tr><th>Orden</th><th class="num">Ingreso (sin IVA)</th><th class="num">Horas</th><th class="num">Materiales</th><th class="num">Costo</th><th class="num">Margen</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '<div class="small" style="margin-top:8px">Totales sobre las '+n+' órdenes con ingreso cargado (facturadas o con presupuesto aprobado). Se muestran las últimas 25 cerradas.</div>';
  }

  /* ───────────── Pronóstico de services (90 días) ───────────── */
  function forecast(){
    const out=[];
    db.machines.forEach(m=>{const i=dueInfo(m);
      let dias=i.dateLeftDays;
      if(i.hoursLeft<=0)dias=Math.min(dias,0);else if(i.hoursLeft<=50)dias=Math.min(dias,30);
      if(dias>90)return;
      if(db.ots.some(o=>o.machineId===m.id&&otAbierta(o)))return; /* ya está en el taller o con turno */
      out.push({m:m,dias:dias,label:i.label,precio:m.servicePriceTBD?null:(Number(m.servicePrice)||null)})});
    return out.sort((a,b)=>a.dias-b.dias);
  }
  TFPro._forecast=forecast;
  function renderForecast(){
    const host=$('#tfFore');if(!host)return;
    const f=forecast();
    if(!f.length){host.innerHTML=emptyHTML('#i-clock','Ningún equipo tiene un service previsto en los próximos 90 días.');return}
    const B=[['Vencidos',x=>x.dias<=0],['Próximos 30 días',x=>x.dias>0&&x.dias<=30],['31 a 60 días',x=>x.dias>30&&x.dias<=60],['61 a 90 días',x=>x.dias>60]];
    const sum=l=>l.reduce((s,x)=>s+(x.precio||0),0);
    const sinPrecio=f.filter(x=>x.precio==null).length;
    host.innerHTML='<div class="rent-kpis">'+B.map(b=>{const l=f.filter(b[1]);return '<div><span>'+b[0]+'</span><b>'+l.length+' <small>'+(sum(l)?money(sum(l)):'')+'</small></b></div>'}).join('')+'</div>'+
      '<div class="small" style="margin:2px 0 10px">Trabajo previsto: <b>'+money(sum(f))+'</b> en '+f.length+' services'+(sinPrecio?' · '+sinPrecio+' sin precio de service cargado':'')+'. No incluye equipos que ya tienen una orden abierta.</div>'+
      f.slice(0,40).map(x=>{const c=clientOf(x.m.clientId);
        return '<div class="req" style="border-left-color:'+(x.dias<=0?'var(--red)':(x.dias<=30?'var(--amber)':'var(--green2)'))+'" onclick="APP.openMachineInfo(\''+x.m.id+'\')"><div style="flex:1"><b>'+esc(mLabel(x.m))+'</b> <span class="small">'+esc(c?c.name:'')+'</span><div class="small">'+esc(x.label)+'</div></div><div style="text-align:right"><b>'+(x.precio?money(x.precio):'<span class="small">sin precio</span>')+'</b></div></div>'}).join('');
  }

  /* ───────────── Marca por agencia ───────────── */
  function lum(hex){const n=parseInt(hex.slice(1),16),r=(n>>16)/255,g=((n>>8)&255)/255,b=(n&255)/255;return .2126*r+.7152*g+.0722*b}
  function applyBrand(){
    const b=(db.meta&&db.meta.brand)||{},biz=(db.meta&&db.meta.biz)||{};
    const mark=document.querySelector('.brandmark'),name=document.querySelector('.brandname'),sub=document.querySelector('.brandsub');
    if(mark){if(b.logo){mark.innerHTML='<img src="'+b.logo+'" alt="">';mark.classList.add('has-logo')}else{mark.innerHTML='<svg class="ic"><use href="#i-tractor"/></svg>';mark.classList.remove('has-logo')}}
    if(NUBE.on){if(name)name.textContent=biz.name||'TerraFleet';if(sub)sub.textContent='Servicio técnico · TerraFleet'}
    const root=document.documentElement.style;
    if(b.color&&/^#[0-9a-f]{6}$/i.test(b.color)&&lum(b.color)>.45){root.setProperty('--lime',b.color)}else root.removeProperty('--lime');
  }
  TFPro.applyBrand=applyBrand;
  TFPro.logoHTML=function(h){const b=(db.meta&&db.meta.brand)||{};return b.logo?'<img src="'+b.logo+'" alt="" style="height:'+(h||44)+'px;max-width:160px;object-fit:contain;vertical-align:middle;margin-right:10px">':''};
  TFPro.setLogo=function(file){
    if(!file)return;
    const r=new FileReader();
    r.onload=()=>{const img=new Image();img.onload=()=>{
      const max=200,k=Math.min(1,max/Math.max(img.width,img.height)),cv=document.createElement('canvas');
      cv.width=Math.max(1,Math.round(img.width*k));cv.height=Math.max(1,Math.round(img.height*k));cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      db.meta.brand=Object.assign({},db.meta.brand,{logo:cv.toDataURL('image/png')});saveDb();applyBrand();renderSettings();toast('Logo guardado')};
      img.onerror=()=>toast('No se pudo leer esa imagen');img.src=r.result};
    r.readAsDataURL(file);
  };
  TFPro.clearLogo=function(){if(db.meta.brand){delete db.meta.brand.logo;saveDb();applyBrand();renderSettings()}};
  TFPro.setColor=function(v){
    if(!/^#[0-9a-f]{6}$/i.test(v))return;
    if(lum(v)<=.45){toast('Elegí un color claro: se usa de resalte sobre fondo oscuro');return}
    db.meta.brand=Object.assign({},db.meta.brand,{color:v});saveDb();applyBrand();
  };
  TFPro.resetColor=function(){if(db.meta.brand){delete db.meta.brand.color;saveDb();applyBrand();renderSettings()}};
  TFPro.saveCostoHora=function(){const v=Number($('#tfCostoHora').value);db.meta.costoHora=v>0?v:0;saveDb();toast('Costo de la hora guardado')};

  /* ───────────── Modo oscuro (por equipo, no por agencia) ───────────── */
  TFPro.setTheme=function(t){try{localStorage.setItem('tf_tema',t)}catch(e){}applyTheme()};
  function applyTheme(){
    let t='claro';try{t=localStorage.getItem('tf_tema')||'claro'}catch(e){}
    document.documentElement.setAttribute('data-theme',t==='oscuro'?'dark':'light');
    const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=t==='oscuro'?'#0b1711':'#14402c';
    document.querySelectorAll('[data-tema]').forEach(b=>b.classList.toggle('active',b.dataset.tema===t));
  }

  /* ───────────── Montaje ───────────── */
  function mount(){
    /* buscador */
    document.body.appendChild(el('<div class="modal-backdrop tfs" id="tfSearch"><div class="tfs-panel"><div class="tfs-top"><svg class="ic ic-sm"><use href="#i-search"/></svg><input id="tfSearchIn" type="search" placeholder="Buscar cliente, equipo, serie u orden…" autocomplete="off" aria-label="Buscar"><button class="tfs-esc" onclick="TFPro.closeSearch()">Esc</button></div><div id="tfSearchRes"></div></div></div>'));
    const ta=document.querySelector('.top-actions');
    if(ta)ta.insertBefore(el('<button class="iconbtn" id="btnSearch" title="Buscar (Ctrl+K)" aria-label="Buscar" onclick="TFPro.openSearch()"><svg class="ic ic-sm"><use href="#i-search"/></svg></button>'),ta.firstChild);
    $('#tfSearchIn').addEventListener('input',()=>{sIdx=0;searchRender()});
    $('#tfSearchIn').addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'){e.preventDefault();sIdx=Math.min(sRes.length-1,sIdx+1);searchRender()}
      else if(e.key==='ArrowUp'){e.preventDefault();sIdx=Math.max(0,sIdx-1);searchRender()}
      else if(e.key==='Enter'){e.preventDefault();searchGo(sRes[sIdx])}
      else if(e.key==='Escape'){TFPro.closeSearch()}});
    $('#tfSearchRes').addEventListener('click',e=>{const b=e.target.closest('.tfs-item');if(b)searchGo(sRes[Number(b.dataset.i)])});
    $('#tfSearch').addEventListener('click',e=>{if(e.target.id==='tfSearch')TFPro.closeSearch()});
    document.addEventListener('keydown',e=>{
      const typing=/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||'');
      if((e.key==='k'||e.key==='K')&&(e.ctrlKey||e.metaKey)){e.preventDefault();TFPro.openSearch()}
      else if(e.key==='/'&&!typing&&!document.querySelector('.modal-backdrop.show,.overlay:not(.off)')){e.preventDefault();TFPro.openSearch()}});
    /* en el celular: Buscar en la barra de abajo (Plantillas pasa al menú) */
    const mn=document.querySelector('.mobile-nav button[onclick*="templates"]');
    if(mn){mn.setAttribute('onclick','TFPro.openSearch()');mn.innerHTML='<svg class="ic"><use href="#i-search"/></svg>Buscar'}
    const mm=$('#mmAdmin');if(mm&&!mm.querySelector('[onclick*="templates"]'))mm.insertBefore(el('<button onclick="APP.mmGo(\'templates\')"><svg class="ic"><use href="#i-book"/></svg>Plantillas de service</button>'),mm.children[3]||null);

    /* tablero */
    const ws=$('#wsStatus');
    if(ws){ws.insertAdjacentHTML('afterend','<div class="card section-card" style="margin-bottom:16px"><div class="section-head" style="margin-bottom:12px"><div><div class="section-title">Tablero del taller</div><div class="section-sub">Cada orden es una tarjeta. Arrastrala a otra columna (o usá «Mover…» en el celular) para cambiar su estado; tocala para ver el detalle.</div></div></div><div id="tfKanban"></div></div>');
      kanbanWire($('#tfKanban'))}
    /* QR */
    document.body.appendChild(el('<div class="modal-backdrop" id="tfQR"><div class="modal" style="width:min(420px,100%)"><h3>Código QR del equipo</h3><p>Una etiqueta por máquina.</p><div id="tfQRBody"></div><div class="modal-actions"><button class="outline-btn" onclick="APP.closeModal(\'tfQR\')">Cerrar</button><button class="solid-btn" id="tfQRPrint"><svg class="ic ic-xs"><use href="#i-file"/></svg>Imprimir etiqueta</button></div></div></div>'));
    $('#tfQR').addEventListener('click',e=>{if(e.target.id==='tfQR')APP.closeModal('tfQR')});
    /* informes */
    const rep=$('#reports');
    if(rep)rep.insertAdjacentHTML('beforeend','<div class="card section-card" style="margin-top:16px"><div class="section-head"><div><div class="section-title">Pronóstico de services</div><div class="section-sub">Lo que vence en los próximos 90 días y cuánto trabajo representa: la lista para salir a ofrecer turnos.</div></div></div><div id="tfFore"></div></div>'+
      '<div class="card section-card" style="margin-top:16px"><div class="section-head"><div><div class="section-title">Rentabilidad por orden</div><div class="section-sub">Ingreso menos mano de obra y materiales de cada orden cerrada.</div></div></div><div id="tfRent"></div></div>');
    /* ajustes */
    const sg=document.querySelector('#settings .setgrid');
    if(sg)sg.insertAdjacentHTML('beforeend','<div class="card section-card" id="tfSetPro"></div>');
  }
  function renderSetPro(){
    const host=$('#tfSetPro');if(!host)return;
    const b=(db.meta&&db.meta.brand)||{};
    host.innerHTML='<div class="section-head"><div><div class="section-title">Marca, costos y apariencia</div><div class="section-sub">El logo y el color se ven en la app, el portal del cliente y los informes.</div></div></div>'+
      '<label>Logo de la agencia</label><div style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><div class="logo-prev">'+(b.logo?'<img src="'+b.logo+'" alt="">':'<svg class="ic"><use href="#i-image"/></svg>')+'</div>'+
        '<button class="outline-btn" onclick="document.getElementById(\'tfLogoFile\').click()">Subir logo…</button>'+(b.logo?'<button class="outline-btn" onclick="TFPro.clearLogo()">Quitar</button>':'')+
        '<input type="file" id="tfLogoFile" accept="image/*" style="display:none" onchange="TFPro.setLogo(this.files[0]);this.value=\'\'"></div>'+
      '<label>Color de resalte</label><div style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><input type="color" value="'+esc(b.color||'#c9f464')+'" onchange="TFPro.setColor(this.value)" style="width:46px;height:36px;border:1px solid var(--line);border-radius:10px;background:none;padding:2px">'+
        (b.color?'<button class="outline-btn" onclick="TFPro.resetColor()">Volver al original</button>':'<span class="small">Tiene que ser un color claro.</span>')+'</div>'+
      '<label>Costo de la hora de taller ($)</label><div style="display:flex;gap:8px;margin-bottom:14px"><input class="field" id="tfCostoHora" type="number" min="0" step="100" value="'+(Number(db.meta.costoHora)||'')+'" placeholder="Ej. 18000" style="max-width:180px"><button class="outline-btn" onclick="TFPro.saveCostoHora()">Guardar</button></div>'+
      '<div class="small" style="margin:-8px 0 14px">Lo que le cuesta a la agencia una hora de técnico. Se usa para calcular el margen de cada orden en Informes.</div>'+
      '<label>Apariencia en este equipo</label><div class="filters" style="margin:0 0 14px"><button class="filter" data-tema="claro" onclick="TFPro.setTheme(\'claro\')">Claro</button><button class="filter" data-tema="oscuro" onclick="TFPro.setTheme(\'oscuro\')">Oscuro</button></div>'+
      '<label>Etiquetas QR</label><div><button class="outline-btn" onclick="TFPro.printAllQR()"><svg class="ic ic-xs"><use href="#i-file"/></svg>Imprimir QR de todas las máquinas</button></div>';
    applyTheme();
  }

  /* enganchar a los render existentes */
  const _rw=renderWorkshop;renderWorkshop=function(){_rw.apply(this,arguments);renderKanban()};
  const _rr=renderReports;renderReports=function(){_rr.apply(this,arguments);renderForecast();renderRent()};
  const _rs=renderSettings;renderSettings=function(){_rs.apply(this,arguments);renderSetPro()};
  const _omi=APP.openMachineInfo;
  APP.openMachineInfo=function(mid){
    _omi.apply(this,arguments);
    const a=document.getElementById('miActions');
    if(a&&machineOf(mid)&&currentRole==='admin')a.insertAdjacentHTML('beforeend','<button class="outline-btn" onclick="TFPro.openQR(\''+mid+'\')"><svg class="ic ic-xs"><use href="#i-grid"/></svg>Código QR</button>');
  };

  applyTheme();
  mount();
  applyBrand();
  /* si la página abrió con un QR y no hay sesión que lo resuelva, se atiende acá */
  window.addEventListener('load',()=>setTimeout(()=>{if(!NUBE.on&&!NUBE.entering)TFPro.deepLink()},1200));
})();
