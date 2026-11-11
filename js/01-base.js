/* ================= REGISTRO DE ERRORES =================
   Todo error de JavaScript se anota y, cuando hay conexión con la nube, se envía
   (máximo 5 por visita) para enterarnos sin esperar a que alguien avise. */
const TF_ERRS=[];let TF_ERRS_SENT=0;
function tfLogError(msg,stack){
  if(TF_ERRS.length+TF_ERRS_SENT>=5)return;
  TF_ERRS.push({message:String(msg||'').slice(0,500),stack:String(stack||'').slice(0,4000)});
  tfFlushErrors();
}
function tfFlushErrors(){
  try{
    if(typeof NUBE==='undefined'||!NUBE.sb)return;
    const meta=document.querySelector('meta[name="app-version"]');
    while(TF_ERRS.length){
      const e=TF_ERRS.shift();TF_ERRS_SENT++;
      NUBE.sb.rpc('log_error',{p:{version:meta?meta.content:'',url:location.pathname,message:e.message,stack:e.stack,ua:navigator.userAgent}}).then(function(){},function(){});
    }
  }catch(e){}
}
window.addEventListener('error',function(e){tfLogError(e.message,(e.error&&e.error.stack)||((e.filename||'')+':'+(e.lineno||'')))});
window.addEventListener('unhandledrejection',function(e){const r=e.reason;tfLogError('Promesa: '+((r&&r.message)||r),r&&r.stack)});

/* ================= MARCA =================
   Paleta de la agencia (la calcula js/08-pro.js). Los documentos que se imprimen
   (informe, factura) no heredan las variables CSS de la app: leen los colores de acá. */
let TF_PAL=null;
function brandP(){return (TF_PAL&&TF_PAL.green)||'#14402c'}     /* principal */
function brandS(){return (TF_PAL&&TF_PAL.green2)||'#2f7a52'}    /* principal, tono medio */
function brandA(){return (TF_PAL&&TF_PAL.lime)||'#c9f464'}      /* resalte */
function brandOnA(){return (TF_PAL&&TF_PAL.onLime)||'#12331f'}  /* texto sobre el resalte */

/* ================= UTILIDADES ================= */
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const trunc=(t,n)=>{t=String(t==null?'':t);return t.length>n?t.slice(0,n)+'…':t};
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const nf=n=>Number(n||0).toLocaleString('es-AR');
const money=v=>'$ '+Number(v||0).toLocaleString('es-AR',{maximumFractionDigits:0});
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function fmtDate(iso){if(!iso)return '—';const p=String(iso).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:iso}
function addMonths(iso,m){const d=new Date(iso+'T00:00:00');d.setMonth(d.getMonth()+Number(m||0));return d}
function daysUntil(d){const t=new Date();t.setHours(0,0,0,0);return Math.ceil((d-t)/86400000)}
function fmtTs(ts){const d=new Date(ts);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function toast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600)}

/* ================= BASE DE DATOS LOCAL ================= */
const DB_KEY='terrafleet_prueba_v1';
const NUBE={on:false,queue(){}}; /* con cuenta: los datos van a la nube (ver sección NUBE) */
let storageOk=true;
try{const k='__tf';localStorage.setItem(k,'1');localStorage.removeItem(k)}catch(e){storageOk=false}

function seedDb(){
  const now=Date.now(),min=60000;
  const db={
    meta:{trialStart:now,otSeq:4100,satSeq:80,seenWelcome:false},
    session:{clientId:null},
    clients:[
      {id:'c1',name:'Jardins del Vallès SL',contact:'Jordi Rovira',phone:'+34 620 11 22 33',email:'jordi@jardinsvalles.cat',plan:'Premium'},
      {id:'c2',name:'GreenSport BCN',contact:'Marta Puig',phone:'+34 630 44 55 66',email:'marta@greensport.cat',plan:'Premium+'},
      {id:'c3',name:'Masia Can Roca',contact:'Toni Ferret',phone:'+34 660 77 88 99',email:'toni@canroca.cat',plan:'Care'},
      {id:'c4',name:'Serveis Maresme',contact:'Laura Vidal',phone:'+34 610 23 45 67',email:'laura@smareme.cat',plan:'Premium'}
    ],
    machines:[
      {id:'m1',clientId:'c1',brand:'Kubota',model:'M5-112',serial:'KBT-M5-88421',iconKey:'tractorcab',hours:491,lastServiceHours:0,lastServiceDate:'2026-03-20',intervalH:500,intervalM:12,warrantyEnd:'2028-06-30',salePrice:95000000,servicePrice:750000,stage:'soon',
       history:[{ts:now-90*86400000,title:'Servicio 250 h',detail:'Aceite motor + filtros · OT-2026-0291'},{ts:now-160*86400000,title:'Servicio inicial 50 h',detail:'Revisión de entrega · OT-2025-0110'},{ts:now-200*86400000,title:'Entrega de la máquina',detail:'Venta inicial · garantía hasta 30/06/2028'}]},
      {id:'m2',clientId:'c2',brand:'Toro',model:'Groundsmaster 4500-D',serial:'TR-4500-10231',iconKey:'zturn',serviceGroup:'mini',hours:1014,lastServiceHours:0,lastServiceDate:'2025-11-01',intervalH:1000,intervalM:24,warrantyEnd:'2024-11-01',salePrice:62000000,servicePrice:480000,stage:'overdue',
       history:[{ts:now-140*86400000,title:'Servicio 750 h',detail:'Filtros y comprobación hidráulica · OT-2025-0355'},{ts:now-400*86400000,title:'Entrega de la máquina',detail:'Venta inicial'}]},
      {id:'m3',clientId:'c3',brand:'John Deere',model:'5075E',serial:'JD5075-72190',iconKey:'tractor',hours:726,lastServiceHours:0,lastServiceDate:'2025-10-01',intervalH:2000,intervalM:12,warrantyEnd:'2027-02-28',salePrice:88000000,servicePrice:700000,stage:'soon',
       history:[{ts:now-180*86400000,title:'Revisión anual',detail:'Aceite, filtros y engrase · OT-2025-0301'},{ts:now-500*86400000,title:'Entrega de la máquina',detail:'Venta inicial · garantía hasta 28/02/2027'}]},
      {id:'m4',clientId:'c4',brand:'Husqvarna',model:'P 525DX',serial:'HQ525-40117',iconKey:'ride',serviceGroup:'mini',hours:358,lastServiceHours:0,lastServiceDate:'2026-06-15',intervalH:400,intervalM:12,warrantyEnd:'2027-11-30',salePrice:12000000,servicePrice:180000,stage:'soon',
       history:[{ts:now-70*86400000,title:'Cambio de cuchillas',detail:'Kit BL-4500 · OT-2026-0415'},{ts:now-300*86400000,title:'Entrega de la máquina',detail:'Venta inicial'}]},
      {id:'m5',clientId:'c1',brand:'Stihl',model:'RT 6112 ZL',serial:'ST6112-88912',iconKey:'sprout',serviceGroup:'mini',hours:81,lastServiceHours:0,lastServiceDate:'2026-06-01',intervalH:200,intervalM:12,warrantyEnd:'2028-09-04',salePrice:9500000,servicePrice:95000,stage:'ok',
       history:[{ts:now-100*86400000,title:'Entrega de la máquina',detail:'Venta inicial · garantía hasta 04/09/2028'}]},
      {id:'m7',clientId:'c3',brand:'Lovol',model:'TE254',serial:'LV-TE254-33021',iconKey:'tractorcab',serviceGroup:'lovol',modelImg:'te2',hours:494,lastServiceHours:0,lastServiceDate:'2026-05-11',intervalH:500,intervalM:12,warrantyEnd:'2028-05-11',salePrice:42000000,servicePrice:520000,stage:'soon',
       history:[{ts:now-150*86400000,title:'Entrega de la máquina',detail:'Venta inicial · garantía hasta 11/05/2028'}]},
      {id:'m6',clientId:'c2',brand:'Avant',model:'635',serial:'AV635-22013',iconKey:'layers',hours:1244,lastServiceHours:0,lastServiceDate:'2025-09-10',intervalH:1500,intervalM:24,warrantyEnd:'2023-09-10',salePrice:78000000,servicePrice:520000,stage:'ok',
       history:[{ts:now-250*86400000,title:'Servicio 1.000 h',detail:'Transmisión e hidráulico · OT-2025-0280'},{ts:now-800*86400000,title:'Entrega de la máquina',detail:'Venta inicial'}]}
    ],
    ots:[
      {id:'OT-0418',machineId:'m2',type:'Revisión preventiva',issue:'Revisión 1.000 h (vencida)',status:'taller',tech:'Marc',origin:'taller',createdAt:now-2*86400000},
      {id:'OT-0417',machineId:'m1',type:'Revisión preventiva',issue:'Preventivo 500 h',status:'recibida',tech:'',origin:'taller',createdAt:now-86400000},
      {id:'OT-0416',machineId:'m6',type:'Avería',issue:'Fuga hidráulica en brazo',status:'bloqueada',bloqueo:'pieza',bloqueoNota:'Esperando manguera hidráulica',tech:'Pau',responsable:'Pau',fechaPrevista:now+2*86400000,origin:'taller',createdAt:now-3*86400000},
      {id:'OT-0415',machineId:'m4',type:'Revisión preventiva',issue:'Cambio de cuchillas',status:'terminada',tech:'Marc',origin:'taller',createdAt:now-4*86400000,closedAt:now-3*86400000,workDone:'Cambio de cuchillas y limpieza de plataforma'}
    ],
    notifs:[
      {id:uid('n'),audience:'admin',icon:'i-clock',title:'Servicio próximo',detail:'Kubota M5-112 · revisión 500 h en ~9 h',ts:now-40*min,read:false},
      {id:uid('n'),audience:'client',clientId:'c1',icon:'i-clock',title:'Revisión 500 h próxima',detail:'Kubota M5-112 · te avisamos para agendar',ts:now-40*min,read:false},
      {id:uid('n'),audience:'admin',icon:'i-checkc',title:'OT-0415 completada',detail:'Husqvarna P 525DX · cambio de cuchillas',ts:now-69*86400000,read:true},
      {id:uid('n'),audience:'admin',icon:'i-package',title:'Stock bajo mínimo',detail:'Filtro hidráulico HF-8821 · quedan 3',ts:now-5*3600000,read:false}
    ],
    parts:[
      {id:'p1',ref:'HF-8821',name:'Filtro hidráulico',stock:3,min:5},
      {id:'p2',ref:'OF-2210',name:'Filtro de aceite',stock:18,min:8},
      {id:'p3',ref:'BL-4500',name:'Kit cuchillas 4500-D',stock:7,min:4}
    ]
  };
  db.machines.forEach((m,i)=>{m.lastHoursUpdate=now-(6+i*9)*86400000});
  return db;
}
function emptyDb(trialStart){
  return {meta:{trialStart:trialStart||Date.now(),otSeq:4100,satSeq:80,invSeq:0,seenWelcome:true,biz:{name:'Mi Empresa',cif:'',phone:'',city:''}},session:{clientId:null},clients:[],machines:[],ots:[],notifs:[],parts:[]};
}
let db;
function loadDb(){
  if(storageOk){
    try{const raw=localStorage.getItem(DB_KEY);if(raw){db=JSON.parse(raw);migrate();return}}
    catch(e){try{const raw2=localStorage.getItem(DB_KEY);if(raw2)localStorage.setItem(DB_KEY+'_corrupt',raw2)}catch(e2){}}
  }
  db=emptyDb();
  db.meta.seenWelcome=false;
  try{if(storageOk)localStorage.setItem(DB_KEY,JSON.stringify(db))}catch(e){storageOk=false}
  let bak=null;
  try{bak=JSON.parse(localStorage.getItem(DB_KEY+'_bak')||'null')}catch(e){}
  if(bak&&bak.db&&((bak.db.clients||[]).length||(bak.db.machines||[]).length||(bak.db.ots||[]).length)){
    db.notifs.unshift({id:uid('n'),audience:'admin',icon:'i-alert',title:'Datos dañados detectados',detail:'La información guardada no se pudo leer. Hay una copia automática del '+fmtTs(bak.ts)+' — restaurala desde Ajustes › Tus datos.',ts:Date.now(),read:false,clientId:null});
  }
}
function migrate(){
  let dirty=false;
  (db.ots||[]).forEach(o=>{if(o.status==='pendiente'){o.status='recibida';dirty=true}});
  if(dirty&&storageOk){try{localStorage.setItem(DB_KEY,JSON.stringify(db))}catch(e){}}
}
function saveDb(){
  if(NUBE.on){NUBE.queue();return}
  if(!storageOk)return;
  try{localStorage.setItem(DB_KEY,JSON.stringify(db))}
  catch(e){
    storageOk=false;
    try{$('#footStatus').textContent='No se puede guardar (almacenamiento lleno) — exportá una copia';$('#footDot').classList.add('red')}catch(e2){}
  }
  saveBakDaily();
}
function saveBakDaily(){
  try{
    const last=Number(localStorage.getItem(DB_KEY+'_bakts')||0);
    if(Date.now()-last<=86400000)return;
    const vacia=!db.clients.length&&!db.machines.length&&!db.ots.length;
    if(vacia){
      try{
        const prev=JSON.parse(localStorage.getItem(DB_KEY+'_bak')||'null');
        if(prev&&prev.db&&((prev.db.clients||[]).length+(prev.db.machines||[]).length+(prev.db.ots||[]).length)>0)return;
      }catch(e){}
    }
    localStorage.setItem(DB_KEY+'_bak',JSON.stringify({ts:Date.now(),db:db}));
    localStorage.setItem(DB_KEY+'_bakts',String(Date.now()));
  }catch(e){}
}

/* ================= CÁLCULOS ================= */
function clientOf(id){return db.clients.find(c=>c.id===id)}
function machineOf(id){return db.machines.find(m=>m.id===id)}
function mLabel(m){return (m.brand+' '+m.model).trim()||'(sin nombre)'}
function nextServiceHours(m){
  const base=Number(m.lastServiceHours)||0;
  const g=m.serviceGroup&&SERVICE_GROUPS[m.serviceGroup];
  if(g&&g.byService){const nxt=g.services.find(s=>{const h=svcHours(s.t);return h!=null&&h>base});if(nxt)return svcHours(nxt.t)}
  return base+Number(m.intervalH||500);
}
function dueInfo(m){
  const target=nextServiceHours(m);
  const hoursLeft=target-Number(m.hours||0);
  const dateTarget=addMonths(m.lastServiceDate||todayISO(),m.intervalM||12);
  const dateTargetISO=isoOf(dateTarget.getTime());
  const dateLeftDays=daysUntil(dateTarget);
  let state='ok';
  if(hoursLeft<=0||dateLeftDays<=0)state='overdue';
  else if(hoursLeft<=50||dateLeftDays<=30)state='soon';
  let label;
  if(hoursLeft<=0)label='vencido hace '+nf(-hoursLeft)+' h';
  else if(dateLeftDays<=0)label='vencía el '+fmtDate(dateTargetISO);
  else label=(hoursLeft<=50?nf(hoursLeft)+' h restantes':nf(dateLeftDays)+' días');
  let reason;
  if(hoursLeft<=0&&dateLeftDays<=0)reason='horómetro y calendario vencidos';
  else if(hoursLeft<=0)reason='horómetro: '+nf(m.hours)+' h superan el límite de '+nf(target)+' h';
  else if(dateLeftDays<=0)reason='calendario: venció el '+fmtDate(dateTargetISO)+' (cada '+m.intervalM+' meses)';
  else if(hoursLeft<=50)reason='horómetro: '+nf(hoursLeft)+' h para llegar a '+nf(target)+' h';
  else reason='calendario: '+dateLeftDays+' días, vence el '+fmtDate(dateTargetISO);
  const pct=Math.max(0,Math.min(100,(Number(m.hours||0)-Number(m.lastServiceHours||0))/Number(m.intervalH||500)*100));
  const warrantyLeft=m.warrantyEnd?daysUntil(new Date(m.warrantyEnd+'T00:00:00')):null;
  return {hoursLeft,dateLeftDays,state,label,reason,pct,warrantyLeft};
}
const STATE_BADGE={overdue:'<span class="badge bad">Vencido</span>',soon:'<span class="badge warn">Próximo</span>',ok:'<span class="badge ok">Correcto</span>'};
const RANK={overdue:0,soon:1,ok:2};
function machinesOf(clientId){return db.machines.filter(m=>m.clientId===clientId)}
function urgencySort(list){return list.slice().sort((a,b)=>(RANK[dueInfo(a).state]-RANK[dueInfo(b).state])||((nextServiceHours(a)-a.hours)-(nextServiceHours(b)-b.hours)))}
function trialDaysLeft(){return 30-Math.floor((Date.now()-db.meta.trialStart)/86400000)}
function iconOf(m){return '#i-'+(m.iconKey||'tractor')}

/* Notificaciones */
function pushNotif(audience,icon,title,detail,clientId,extra){
  db.notifs.unshift(Object.assign({id:uid('n'),audience,icon,title,detail,ts:Date.now(),read:false,clientId:clientId||null},extra||{}));
  if(db.notifs.length>60)db.notifs.length=60;
}
function checkStage(m,who){
  const info=dueInfo(m);
  if(m.stage!==info.state&&(info.state==='soon'||info.state==='overdue')){
    const msg=info.state==='overdue'
      ? 'Revisión vencida ('+info.label+') de '+mLabel(m)
      : 'Revisión de '+mLabel(m)+' en '+info.label;
    pushNotif('admin','i-alert','Aviso de mantenimiento',msg+(who&&who!=='taller'?' · registrado por '+who:''));
    pushNotif('client','i-clock','Revisión próxima','Tu '+mLabel(m)+' necesita servicio: '+info.label,m.clientId);
    toast('Aviso generado para '+mLabel(m));
  }
  m.stage=info.state;
}
function recomputeStages(silent){
  db.machines.forEach(m=>{m.stage=dueInfo(m).state});
  if(silent)saveDb();
}
