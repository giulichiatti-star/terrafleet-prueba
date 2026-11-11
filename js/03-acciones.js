/* ================= APP (ACCIONES) ================= */
const APP={
  db:()=>db,
  gotoPage,toast(msg){toast(msg)},
  openModal(id){document.getElementById(id).classList.add('show')},
  closeModal(id){document.getElementById(id).classList.remove('show')},

  toggleRole(){this.switchRole(currentRole==='admin'?'client':'admin')},
  goAlert(){machFilter='alert';gotoPage('machines')},

  mmGo(page){this.closeMobileMenu();gotoPage(page)},
  openMobileMenu(){
    document.getElementById('mmAdmin').style.display=currentRole==='admin'?'block':'none';
    document.getElementById('mmClient').style.display=currentRole==='client'?'block':'none';
    document.getElementById('mobileMenu').classList.add('show');
  },
  closeMobileMenu(){document.getElementById('mobileMenu').classList.remove('show')},

  switchRole(role){
    currentRole=role;
    this.closeMobileMenu();
    document.querySelectorAll('.role-switch button').forEach(b=>b.classList.toggle('active',b.dataset.role===role));
    document.querySelector('.admin-nav').style.display=role==='admin'?'flex':'none';
    document.querySelector('.client-nav').style.display=role==='client'?'flex':'none';
    if(role==='admin'){$('#avatar').textContent='AM'}
    else{
      const c=sessionClient();
      $('#avatar').textContent=c?(c.contact||c.name).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase():'?';
      if(!c){showLogin()}
    }
    gotoPage(role==='admin'?'dashboard':'clienthome');
  },

  /* ---- clientes ---- */
  openClientModal(id){
    const c=id?clientOf(id):null;
    $('#mClientTitle').textContent=c?'Editar cliente':'Nuevo cliente';
    $('#cliId').value=c?c.id:'';
    $('#cliName').value=c?c.name:'';$('#cliContact').value=c?c.contact:'';
    $('#cliPhone').value=c?c.phone:'';$('#cliEmail').value=c?c.email:'';
    $('#cliCuit').value=c?(c.cuit||''):'';
    this.openModal('mClient');
  },
  async lookupCuit(){
    const input=document.getElementById('cliCuit');
    const raw=String(input.value||'').replace(/\D/g,'');
    if(raw.length!==11){toast('El CUIT debe tener 11 dígitos');return}
    const mult=[5,4,3,2,7,6,5,4,3,2];
    let s=0;for(let i=0;i<10;i++)s+=Number(raw[i])*mult[i];
    let ver=11-(s%11);if(ver===11)ver=0;if(ver===10)ver=9;
    if(ver!==Number(raw[10])){toast('CUIT inválido: el dígito verificador no coincide');return}
    input.value=raw.slice(0,2)+'-'+raw.slice(2,10)+'-'+raw.slice(10);
    toast('CUIT válido ✓ ('+input.value+')');
  },
  saveClient(){
    const name=$('#cliName').value.trim();
    if(!name){this.toast('El nombre del cliente es obligatorio');return}
    const id=$('#cliId').value;
    const data={name,contact:$('#cliContact').value.trim(),phone:$('#cliPhone').value.trim(),email:$('#cliEmail').value.trim(),cuit:$('#cliCuit').value.trim()};
    if(id){Object.assign(clientOf(id),data)}
    else{db.clients.push({id:uid('c'),...data});pushNotif('admin','i-users','Cliente registrado',name)}
    saveDb();this.closeModal('mClient');this.toast(id?'Cliente actualizado':'Cliente registrado');renderAll();
  },

  /* ---- máquinas ---- */
  setMachinePhoto(file){
    if(!file)return;
    fotoFromFile(file,d=>{
      APP._fotoTmp=d;
      const p=document.getElementById('maFotoPrev');
      p.innerHTML='<img src="'+d+'" style="width:100%;height:100%;object-fit:cover"/>';
      document.getElementById('maFotoDel').style.display='inline-flex';
      toast('Foto lista — se guarda con la máquina');
    });
  },
  clearMachinePhoto(){
    this._fotoTmp=null;
    const p=document.getElementById('maFotoPrev');
    p.innerHTML='<svg class="ic" style="width:26px;height:26px;color:var(--green2)"><use href="#i-tractor"/></svg>';
    document.getElementById('maFotoDel').style.display='none';
  },
  renderThumbs(sel){
    document.getElementById('maThumbs').innerHTML=LOVOL_MODELS.map(x=>
      '<div class="lov'+(sel===x.k?' sel':'')+'" onclick="APP.pickLovol(\''+x.k+'\')" title="'+esc(x.n)+'">'+(x.img?'<img src="'+x.img+'" alt="'+esc(x.n)+'"/>':'<div class="lov-ic"><svg class="ic"><use href="#i-tractor"/></svg></div>')+'<span>'+esc(x.n)+'</span></div>'
    ).join('');
    document.getElementById('maModelImg').value=sel||'';
  },
  pickLovol(k){
    this.renderThumbs(k);
    $('#maGroup').value='lovol';
    const fam=LOVOL_MODELS.find(x=>x.k===k);
    const mod=$('#maModel').value.trim().toUpperCase();
    if(!mod||/^(TE|CQ|M)\d/.test(mod)===false){
      const first=fam.n.split(' · ')[1]||fam.n.split(' · ')[0];
      if(!mod)$('#maModel').value=first;
    }
    toast('Modelo: '+fam.n);
  },
  openMachineModal(id){
    if(!db.clients.length){this.toast('Primero creá un cliente');return}
    const m=id?machineOf(id):null;
    $('#maTitle').textContent=m?'Editar máquina':'Registrar máquina';
    $('#maSub').textContent=m?'Ajustá los datos del equipo (las horas se actualizan desde su tarjeta).':'Creá el pasaporte digital del equipo. El contador de mantenimiento empieza ahora.';
    $('#maId').value=m?m.id:'';
    $('#maClient').innerHTML=db.clients.map(c=>'<option value="'+c.id+'"'+(m&&m.clientId===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join('');
    $('#maBrand').value=m?m.brand:'';$('#maModel').value=m?m.model:'';$('#maSerial').value=m?m.serial||'':'';
    $('#maBrand').oninput=$('#maModel').oninput=function(){if($('#maId').value)return;const g=iconGuess($('#maBrand').value,$('#maModel').value);if(g)$('#maIcon').value=g;const fam=machineModelGuess($('#maBrand').value,$('#maModel').value);if(fam)APP.renderThumbs(fam)};
    $('#maIcon').value=m?m.iconKey:'tractor';
    $('#maHours').value=m?m.hours:0;$('#maHours').disabled=!!m;
    $('#maIntH').value=m?m.intervalH:500;$('#maIntM').value=m?m.intervalM:12;
    $('#maLastDate').value=m?m.lastServiceDate:todayISO();$('#maLastDate').disabled=!!m;
    $('#maWarranty').value=m?m.warrantyEnd||'':'';
    $('#maSalePrice').value=m&&m.salePrice?m.salePrice:'';
    const tbd=m&&m.servicePriceTBD;
    $('#maServiceTBD').checked=!!tbd;
    $('#maServicePrice').disabled=!!tbd;
    $('#maServicePrice').value=m&&m.servicePrice&&!tbd?m.servicePrice:'';
    $('#maGroup').value=m?m.serviceGroup||'':'';
    this.renderThumbs(m?(m.modelImg||''):(machineModelGuess($('#maBrand').value,$('#maModel').value)));
    this._fotoTmp=undefined;
    const fp=document.getElementById('maFotoPrev');
    if(m&&m.foto){fp.innerHTML='<img src="'+m.foto+'" style="width:100%;height:100%;object-fit:cover"/>';document.getElementById('maFotoDel').style.display='inline-flex'}
    else{fp.innerHTML='<svg class="ic" style="width:26px;height:26px;color:var(--green2)"><use href="#i-tractor"/></svg>';document.getElementById('maFotoDel').style.display='none'}
    this.openModal('mMachine');
  },
  saveMachine(){
    const brand=$('#maBrand').value.trim(),model=$('#maModel').value.trim();
    if(!brand||!model){this.toast('Marca y modelo son obligatorios');return}
    const editId=$('#maId').value;
    const existing=editId?machineOf(editId):null;
    const hours=existing?existing.hours:Math.max(0,Number($('#maHours').value||0));
    const tbd=$('#maServiceTBD').checked;
    const m=existing||{id:uid('m'),hours,lastServiceHours:hours,history:[]};
    m.clientId=$('#maClient').value;m.brand=brand;m.model=model;m.serial=$('#maSerial').value.trim();
    m.iconKey=$('#maIcon').value;m.serviceGroup=$('#maGroup').value||null;
    m.modelImg=$('#maModelImg').value||null;
    if(this._fotoTmp)m.foto=this._fotoTmp;
    else if(this._fotoTmp===null&&existing)m.foto=null;
    if(!existing)m.lastServiceDate=$('#maLastDate').value||todayISO();
    m.intervalH=Math.max(50,Number($('#maIntH').value||500));m.intervalM=Math.max(1,Number($('#maIntM').value||12));
    m.warrantyEnd=$('#maWarranty').value||null;
    m.salePrice=Math.max(0,Number($('#maSalePrice').value||0))||null;
    m.servicePrice=tbd?null:(Math.max(0,Number($('#maServicePrice').value||0))||null);
    m.servicePriceTBD=tbd;
    m.stage=dueInfo(m).state;
    if(existing){
      m.history.unshift({ts:Date.now(),title:'Ficha actualizada',detail:'Datos del equipo modificados'+(m.serviceGroup?' · grupo: '+SERVICE_GROUPS[m.serviceGroup].name:'')});
      saveDb();this.closeModal('mMachine');this.toast('Máquina actualizada');renderAll();
      return;
    }
    m.history.unshift({ts:Date.now(),title:'Equipo registrado',detail:'Pasaporte digital creado · entrega '+fmtDate($('#maLastDate').value||todayISO())+' · contador iniciado en '+nf(hours)+' h'});
    db.machines.push(m);
    pushNotif('admin','i-tractor','Máquina registrada',mLabel(m)+' · SN '+(m.serial||'—'));
    saveDb();this.closeModal('mMachine');this.toast('Máquina registrada');machFilter='all';renderAll();
  },
  setMachFilter(f){machFilter=f;renderMachines()},
  openHours(machineId){
    hoursTarget=machineId;
    const m=machineOf(machineId);if(!m)return;
    $('#mHoursSub').textContent=mLabel(m)+' · SN '+(m.serial||'—')+' · últimas horas conocidas: '+nf(m.hours)+' h';
    const inp=$('#mHoursInput');inp.min=m.hours;inp.value=m.hours;
    this.openModal('mHours');inp.focus();
  },
  saveHours(){
    const m=machineOf(hoursTarget);if(!m)return;
    const v=Math.max(m.hours,Number($('#mHoursInput').value||m.hours));
    if(v===m.hours){this.closeModal('mHours');this.toast('Sin cambios');return}
    const who=currentRole==='client'?'cliente':'taller';
    m.history.unshift({ts:Date.now(),title:'Actualización de horómetro',detail:nf(m.hours)+' h → '+nf(v)+' h · registrado por '+who});
    m.hours=v;
    m.lastHoursUpdate=Date.now();
    checkStage(m,who);
    saveDb();this.closeModal('mHours');this.toast('Horómetro actualizado · '+nf(v)+' h');renderAll();
  },
  openHistory(id){
    const m=machineOf(id);if(!m)return;
    $('#mHistoryTitle').textContent='Historial · '+mLabel(m);
    $('#mHistoryBody').innerHTML=(m.history&&m.history.length)?m.history.map(h=>
      '<div class="timeline-item"><div class="ticon"><svg class="ic ic-sm"><use href="#i-clock"/></svg></div><div><div class="tname">'+esc(h.title)+'</div><div class="tdetail">'+esc(h.detail||'')+'</div></div><div class="date">'+fmtTs(h.ts)+'</div></div>'
    ).join(''):emptyHTML('#i-clock','Sin historial todavía.');
    this.openModal('mHistory');
  },

  /* ---- OTs ---- */
  openOTModal(machineId){
    if(!db.machines.length){this.toast('Primero registrá una máquina');return}
    $('#otMach').innerHTML=db.machines.map(m=>'<option value="'+m.id+'"'+(m.id===machineId?' selected':'')+'>'+esc(mLabel(m))+(m.serial?' · SN '+esc(m.serial):'')+' · '+esc(clientOf(m.clientId)?clientOf(m.clientId).name:'')+'</option>').join('');
    $('#otType').value='Revisión preventiva';$('#otIssue').value='';
    this.openModal('mOT');
  },
  saveOT(){
    const m=machineOf($('#otMach').value);if(!m){this.toast('Seleccioná una máquina');return}
    db.meta.otSeq=(db.meta.otSeq||4100)+1;
    const ot={id:'OT-'+db.meta.otSeq,machineId:m.id,type:$('#otType').value,issue:$('#otIssue').value.trim(),status:'recibida',tech:'',origin:'taller',createdAt:Date.now()};
    db.ots.unshift(ot);
    m.history.unshift({ts:Date.now(),title:'OT creada · '+ot.id,detail:ot.type+(ot.issue?' · '+ot.issue:'')});
    pushNotif('admin','i-clip','OT creada',ot.id+' · '+mLabel(m));
    saveDb();this.closeModal('mOT');this.toast('Orden '+ot.id+' creada');renderAll();
  },
  setOTStatus(id,status){
    const ot=db.ots.find(o=>o.id===id);if(!ot)return;
    if(status==='terminada'){this.openDone(id);return}
    if(status==='bloqueada'){ot.status='bloqueada';this.openOtInfo(id);saveDb();renderAll();return}
    const prev=ot.status;
    ot.status=status;
    const m=machineOf(ot.machineId);
    if(m)m.history.unshift({ts:Date.now(),title:'Estado: '+status,detail:ot.id+' pasó de '+(OT_ESTADOS[prev]||prev)+' a '+(OT_ESTADOS[status]||status)});
    if(status==='diagnostico'&&m){pushNotif('client','i-wrench','Tu '+mLabel(m)+' entró a revisión','Orden '+ot.id+' — el técnico está diagnosticando el equipo.',m.clientId)}
    if(status==='taller'&&m){pushNotif('client','i-wrench','Reparación en curso','Empezamos a trabajar en tu '+mLabel(m)+' · '+ot.id+'. Te avisamos al terminar.',m.clientId)}
    saveDb();this.toast(ot.id+' → '+(OT_ESTADOS[status]||status));renderAll();
  },
  sendBudget(){
    const otId=document.getElementById('bgOtId').value;
    const ot=db.ots.find(o=>o.id===otId);if(!ot)return;
    const base=Number(document.getElementById('bgBase').value||0);
    const iva=Number(document.getElementById('bgIva').value||21);
    const nota=document.getElementById('bgNota').value.trim();
    if(base<=0){this.toast('Indicá el monto del presupuesto');return}
    ot.presupuesto={base,iva,total:base*(1+iva/100),sentAt:Date.now(),approved:null,nota};
    ot.status='presupuesto';
    const m=machineOf(ot.machineId);
    pushNotif('client','i-mail','Presupuesto para tu '+mLabel(m),money(ot.presupuesto.total)+' (base '+money(base)+' + IVA)'+(nota?' — '+nota:'')+'. Aprobalo o rechazalo acá.',m?m.clientId:null,{kind:'presupuesto',otId:ot.id});
    if(m)m.history.unshift({ts:Date.now(),title:'Presupuesto enviado · '+ot.id,detail:money(ot.presupuesto.total)});
    saveDb();this.closeModal('mBudget');toast('Presupuesto enviado al cliente');renderAll();
  },
  budgetApprove(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot||!ot.presupuesto||ot.presupuesto.approved!==null)return;
    ot.presupuesto.approved=true;
    if(ot.status==='bloqueada'&&ot.bloqueo==='autorizacion'){ot.bloqueo=null}
    ot.status='taller';
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    pushNotif('admin','i-checkc','Presupuesto aprobado ✓',(c?c.name+' aprobó':'Cliente aprobó')+' '+money(ot.presupuesto.total)+' · '+ot.id+' — a reparar');
    if(m)m.history.unshift({ts:Date.now(),title:'Presupuesto aprobado · '+ot.id,detail:money(ot.presupuesto.total)+' — el trabajo sigue'});
    saveDb();toast('Presupuesto aprobado ✓ Comienza la reparación');renderAll();
  },
  budgetReject(otId){
    const ot=db.ots.find(o=>o.id===otId);if(!ot||!ot.presupuesto||ot.presupuesto.approved!==null)return;
    ot.presupuesto.approved=false;
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null;
    pushNotif('admin','i-alert','Presupuesto rechazado',(c?c.name+' rechazó':'Cliente rechazó')+' el presupuesto de '+ot.id+' — contactar para ajustar');
    if(m)m.history.unshift({ts:Date.now(),title:'Presupuesto rechazado · '+ot.id,detail:'El cliente no aprobó '+money(ot.presupuesto.total)});
    saveDb();toast('Presupuesto rechazado — avisamos al taller');renderAll();
  },
  openDone(id){
    const ot=db.ots.find(o=>o.id===id);if(!ot)return;
    const m=machineOf(ot.machineId);if(!m){this.toast('Máquina no encontrada');return}
    const editing=ot.status==='terminada';
    $('#doneId').value=id;
    $('#mDoneTitle').textContent=editing?'Editar cierre · '+ot.id:'Cerrar orden · ficha del servicio';
    $('#doneBtn').textContent=editing?'Guardar cambios':'Cerrar OT';
    $('#mDoneSub').textContent=ot.id+' · '+mLabel(m)+(m.serial?' · SN '+m.serial:'')+' · '+ot.type;
    $('#doneTech').value=ot.tech||'';
    $('#doneHours').value=m.hours;
    $('#doneWork').value=ot.issue||'';
    $('#doneHoras').value=ot.horasTrabajo!=null?ot.horasTrabajo:'';
    $('#doneCosto').value=ot.costoMateriales!=null?ot.costoMateriales:'';
    $('#doneMateriales').value=ot.materiales||'';
    $('#doneReset').checked=!editing&&String(ot.type).indexOf('preventi')>=0;
    this.openModal('mDone');
  },
  completeOT(){
    const ot=db.ots.find(o=>o.id===$('#doneId').value);if(!ot)return;
    const m=machineOf(ot.machineId);if(!m)return;
    const editing=ot.status==='terminada';
    ot.status='terminada';ot.closedAt=Date.now();
    ot.tech=$('#doneTech').value.trim()||'—';
    ot.workDone=$('#doneWork').value.trim()||ot.type;
    ot.horasTrabajo=Number($('#doneHoras').value||0);
    if(!esTecnico())ot.costoMateriales=Number($('#doneCosto').value||0);
    ot.materiales=$('#doneMateriales').value.trim();
    const newH=Math.max(m.hours,Number($('#doneHours').value||m.hours));
    if(newH!==m.hours){m.history.unshift({ts:Date.now(),title:'Actualización de horómetro',detail:nf(m.hours)+' h → '+nf(newH)+' h · en taller'});m.hours=newH}
    const reset=$('#doneReset').checked;
    if(reset){m.lastServiceHours=m.hours;m.lastServiceDate=todayISO()}
    m.stage=dueInfo(m).state;
    if(editing){
      m.history.unshift({ts:Date.now(),title:'Cierre editado · '+ot.id,detail:($('#doneWork').value.trim()||ot.type)+' · técnico '+ot.tech+(reset?' · plan reiniciado':'')});
      saveDb();this.closeModal('mDone');this.toast(ot.id+' actualizada');renderAll();return;
    }
    m.history.unshift({ts:Date.now(),title:'Servicio completado · '+ot.id,detail:($('#doneWork').value.trim()||ot.type)+' · técnico '+ot.tech+(reset?' · plan reiniciado':'')});
    pushNotif('client','i-checkc','Servicio completado','Tu '+mLabel(m)+' está lista · '+ot.id,m.clientId);
    pushNotif('admin','i-checkc','OT cerrada',ot.id+' · '+mLabel(m)+(ot.horasTrabajo?' · '+ot.horasTrabajo+' h taller':'')+(ot.costoMateriales?' · materiales '+money(ot.costoMateriales):''));
    const rep=repeatedIssueAlert(ot);
    if(rep){
      ot.repeatFlag=rep;
      pushNotif('admin','i-alert','Fallo repetido en '+mLabel(m),rep+' — revisar causa de fondo antes de la próxima venta/reparación');
      m.history.unshift({ts:Date.now(),title:'⚠ '+rep,detail:'Detectado al cerrar '+ot.id});
    }
    saveDb();this.closeModal('mDone');this.toast(ot.id+' cerrada'+(reset?' · plan reiniciado':''));renderAll();
  },

  /* ---- portal cliente ---- */
  loginClient(){
    const v=$('#loginSel').value;
    if(!v){this.toast('No hay clientes creados todavía');return}
    db.session.clientId=v;
    saveDb();hideLogin();
    this.switchRole('client');
    this.toast('Sesión iniciada como '+(clientOf(v)?clientOf(v).name:''));
  },
  changeClient(){db.session.clientId=null;saveDb();showLogin()},
  requestCita(machineId){
    const m=machineOf(machineId);if(!m)return;
    if(db.ots.some(o=>o.machineId===machineId&&otAbierta(o))){this.toast('Ya tenés una solicitud abierta para esta máquina');return}
    db.meta.otSeq=(db.meta.otSeq||4100)+1;
    const ot={id:'OT-'+db.meta.otSeq,machineId:m.id,type:'Cita preventiva',issue:'Solicitada desde el portal · '+dueInfo(m).label,status:'cita',cita:'solicitada',tech:'',origin:'cliente',createdAt:Date.now()};
    db.ots.unshift(ot);
    m.history.unshift({ts:Date.now(),title:'Turno solicitado · '+ot.id,detail:'El cliente pidió turno desde el portal'});
    pushNotif('admin','i-cal','Turno solicitado',clientOf(m.clientId)?clientOf(m.clientId).name+' · '+mLabel(m):mLabel(m));
    saveDb();this.toast('Turno solicitado · te confirmamos pronto');renderAll();
  },
  sendSAT(){
    const mid=$('#supMach').value;
    if(!mid){this.toast('Primero registrá una máquina');return}
    const text=$('#supText').value.trim();
    if(!text){this.toast('Describe brevemente qué está pasando');return}
    const m=machineOf(mid);
    db.meta.satSeq=(db.meta.satSeq||80)+1;
    const ot={id:'SAT-'+db.meta.satSeq,machineId:m.id,type:$('#supType').value,issue:text,status:'recibida',tech:'',origin:'cliente',createdAt:Date.now()};
    db.ots.unshift(ot);
    m.history.unshift({ts:Date.now(),title:'Asistencia solicitada · '+ot.id,detail:text});
    pushNotif('admin','i-alert','Asistencia solicitada',mLabel(m)+' · '+trunc(text,60));
    $('#supText').value='';
    saveDb();this.toast('Solicitud registrada: '+ot.id);renderAll();
  },

  /* ---- recambios / datos ---- */
  stockDelta(id,d){
    const p=db.parts.find(x=>x.id===id);if(!p)return;
    p.stock=Math.max(0,p.stock+d);
    if(p.stock<p.min)pushNotif('admin','i-package','Stock bajo mínimo',p.name+' '+p.ref+' · quedan '+p.stock);
    saveDb();renderAll();
  },
  exportData(){
    try{
      db.meta.lastExport=Date.now();
      const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='terrafleet-datos-'+todayISO()+'.json';
      document.body.appendChild(a);a.click();a.remove();saveDb();
      this.toast('Copia exportada (archivo JSON)');
    }catch(e){this.toast('No se pudo exportar en este navegador')}
  },
  restoreBak(){
    let bj=null;
    try{bj=JSON.parse(localStorage.getItem(DB_KEY+'_bak')||'null')}catch(e){}
    if(!bj||!bj.db){this.toast('No hay copia automática guardada');return}
    if(!confirm('Se reemplazará todo por la copia del '+fmtTs(bj.ts)+'. ¿Continuar?'))return;
    db=bj.db;migrate();saveDb();renderAll();
    this.toast('Copia automática restaurada ✓');
  },
  importData(file){
    const r=new FileReader();
    r.onload=()=>{
      try{
        const obj=JSON.parse(r.result);
        if(!obj||!Array.isArray(obj.clients)||!Array.isArray(obj.machines)||!Array.isArray(obj.ots)||!Array.isArray(obj.notifs)||!Array.isArray(obj.parts)||!obj.meta)throw 0;
        if(!confirm('Esto sustituirá los datos actuales por los de la copia. ¿Continuar?'))return;
        obj.session=obj.session&&obj.session.clientId!==undefined?obj.session:{clientId:null};
        obj.meta.biz=obj.meta.biz||{name:'Mi Empresa',cif:'',phone:'',city:''};
        db=obj;migrate();
        saveDb();recomputeStages(true);renderAll();
        this.toast('Datos importados correctamente');
      }catch(e){this.toast('El archivo no es una copia válida (faltan secciones: clientes, máquinas, OTs, notificaciones o repuestos)')}
    };
    r.readAsText(file);
  },
  reseed(){
    if(!confirm('Se cargarán los datos de ejemplo y se perderán los cambios propios. ¿Continuar?'))return;
    const keep=db.meta.trialStart;
    db=seedDb();db.meta.trialStart=keep;db.meta.seenWelcome=true;
    saveDb();renderAll();this.toast('Datos de ejemplo cargados');
  },
  wipe(){
    if(!confirm('Se borrarán TODOS los datos (clientes, máquinas, OTs). ¿Seguro?'))return;
    const keep=db.meta.trialStart;
    db=emptyDb(keep);
    machFilter='all';currentRole='admin';
    saveDb();this.switchRole('admin');
    this.toast('Listo: empezá registrando tu primer cliente');
  }
};
let hoursTarget=null;
window.APP=APP;
window.gotoPage=gotoPage;
