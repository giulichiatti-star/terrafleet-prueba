/* ================= GESTIÓN =================
   Usuarios de la agencia · catálogo de modelos · repuestos usados por orden ·
   fotos de antes y después · informe de servicio rediseñado. */
const TFGest={};
(function(){
  'use strict';
  const el=html=>{const d=document.createElement('div');d.innerHTML=html.trim();return d.firstChild};
  const staff=()=>currentRole==='admin';
  const esAdmin=()=>NUBE.on&&NUBE.prof&&NUBE.prof.role==='admin';
  const cat=()=>(db.catalog=db.catalog||[]);
  const num=v=>(v===''||v==null||isNaN(Number(v)))?'':Number(v);
  function modal(id,inner,ancho){
    let m=document.getElementById(id);
    if(!m){m=el('<div class="modal-backdrop" id="'+id+'"><div class="modal"'+(ancho?' style="width:min('+ancho+'px,100%)"':'')+'></div></div>');document.body.appendChild(m);
      m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')})}
    m.firstChild.innerHTML=inner;m.classList.add('show');return m;
  }
  const cerrar=id=>{const m=document.getElementById(id);if(m)m.classList.remove('show')};
  TFGest.cerrar=cerrar;

  /* ═════════════ USUARIOS ═════════════ */
  const ROL={admin:'Administrador',tecnico:'Técnico',cliente:'Cliente'};
  function claveProvisoria(){
    const abc='abcdefghjkmnpqrstuvwxyz23456789';let s='';
    const r=new Uint32Array(10);(window.crypto||{getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*4294967296);return a}}).getRandomValues(r);
    for(let i=0;i<10;i++)s+=abc[r[i]%abc.length];
    return s.slice(0,5)+'-'+s.slice(5);
  }
  TFGest._clave=claveProvisoria;
  async function cargarUsuarios(){
    const host=$('#tfUsers');if(!host)return;
    if(!NUBE.on){host.innerHTML='<div class="small">Ingresá con tu cuenta para administrar usuarios.</div>';return}
    let html='<label>Mi contraseña</label><div style="display:flex;gap:8px;margin-bottom:6px"><input class="field" id="tfMiClave" type="password" autocomplete="new-password" placeholder="Contraseña nueva (8 o más)" style="max-width:260px"><button class="outline-btn" onclick="TFGest.cambiarMiClave()">Cambiar</button></div>'+
      '<div class="small" style="margin-bottom:16px">Sesión: '+esc(NUBE.prof.email||'')+' · '+esc(ROL[NUBE.prof.role]||NUBE.prof.role)+'</div>';
    if(!esAdmin()){host.innerHTML=html;return}
    html+='<div class="section-head" style="margin-bottom:8px"><div><div class="section-title" style="font-size:15px">Usuarios de la agencia</div><div class="section-sub">Creás la cuenta acá y le pasás el email y la contraseña provisoria. La persona la cambia al entrar.</div></div><button class="solid-btn" onclick="TFGest.nuevoUsuario()"><svg class="ic ic-xs"><use href="#i-plus"/></svg>Nuevo usuario</button></div><div id="tfUsersList"><div class="small">Cargando…</div></div>';
    host.innerHTML=html;
    try{
      const r=await NUBE.sb.from('profiles').select('user_id,email,full_name,role,client_id,active').eq('agency_id',NUBE.prof.agency_id).order('created_at');
      if(r.error)throw r.error;
      TFGest._users=r.data;
      $('#tfUsersList').innerHTML='<div class="tf-scroll"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>'+r.data.map(u=>{
        const c=u.client_id?clientOf(u.client_id):null,yo=u.user_id===NUBE.prof.user_id;
        return '<tr><td><b>'+esc(u.full_name||u.email||'—')+'</b><div class="small">'+esc(u.email||'')+'</div></td>'+
          '<td>'+esc(ROL[u.role]||u.role)+(c?'<div class="small">'+esc(c.name)+'</div>':'')+'</td>'+
          '<td>'+(u.active?'<span class="badge ok">Activo</span>':'<span class="badge bad">Sin acceso</span>')+'</td>'+
          '<td style="text-align:right;white-space:nowrap">'+(yo?'<span class="small">vos</span>':
            '<button class="outline-btn" onclick="TFGest.resetClave(\''+u.user_id+'\')">Nueva contraseña</button> <button class="outline-btn" onclick="TFGest.activar(\''+u.user_id+'\','+(!u.active)+')">'+(u.active?'Quitar acceso':'Dar acceso')+'</button>')+'</td></tr>'}).join('')+'</tbody></table></div>';
    }catch(e){$('#tfUsersList').innerHTML='<div class="small">No se pudieron cargar los usuarios (sin conexión).</div>'}
  }
  TFGest.cargarUsuarios=cargarUsuarios;
  TFGest.cambiarMiClave=async function(){
    const v=$('#tfMiClave').value;
    if(v.length<8){toast('La contraseña tiene que tener 8 caracteres o más');return}
    const r=await NUBE.sb.auth.updateUser({password:v});
    if(r.error){toast('No se pudo cambiar: '+r.error.message);return}
    $('#tfMiClave').value='';toast('Contraseña cambiada ✓');
  };
  TFGest.nuevoUsuario=function(clientId){
    modal('mUser','<h3>Nuevo usuario</h3><p>Se crea la cuenta con una contraseña provisoria que vas a ver una sola vez.</p>'+
      '<div class="form-row"><div><label>Nombre</label><input class="field" id="uNombre" placeholder="Nombre y apellido"></div><div><label>Email</label><input class="field" id="uEmail" type="email" placeholder="persona@email.com"></div></div>'+
      '<div class="form-row" style="margin-top:12px"><div><label>Rol</label><select class="field" id="uRol" onchange="document.getElementById(\'uCliBox\').style.display=this.value===\'cliente\'?\'block\':\'none\'"><option value="tecnico">Técnico — trabaja las órdenes</option><option value="admin">Administrador — además gestiona usuarios y datos de la agencia</option><option value="cliente">Cliente — solo ve sus equipos</option></select></div>'+
      '<div id="uCliBox" style="display:none"><label>Cliente</label><select class="field" id="uCli">'+db.clients.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'</select></div></div>'+
      '<div class="modal-actions"><button class="outline-btn" onclick="TFGest.cerrar(\'mUser\')">Cancelar</button><button class="solid-btn" id="uGo" onclick="TFGest.crearUsuario()">Crear cuenta</button></div>');
    if(clientId){$('#uRol').value='cliente';$('#uCliBox').style.display='block';$('#uCli').value=clientId;const c=clientOf(clientId);if(c){$('#uNombre').value=c.contact||c.name||'';$('#uEmail').value=c.email||''}}
  };
  function mostrarCredenciales(titulo,email,clave,tel){
    const txt='Acceso a '+((db.meta.biz||{}).name||'la app')+'\n'+location.origin+location.pathname+'\nEmail: '+email+'\nContraseña provisoria: '+clave+'\n(Cambiala al entrar, en Ajustes.)';
    TFGest._cred=txt;
    const wa=tel?'<a class="outline-btn" target="_blank" rel="noopener" href="https://wa.me/'+tel+'?text='+encodeURIComponent(txt)+'">Enviar por WhatsApp</a>':'';
    modal('mUser','<h3>'+esc(titulo)+'</h3><p>Copiá estos datos ahora: la contraseña no se vuelve a mostrar.</p>'+
      '<div class="cred"><div><span>Email</span><b>'+esc(email)+'</b></div><div><span>Contraseña provisoria</span><b id="uClaveOut">'+esc(clave)+'</b></div></div>'+
      '<div class="modal-actions"><button class="outline-btn" onclick="APP.copyText(TFGest._cred,\'Datos copiados\')">Copiar</button>'+wa+'<button class="solid-btn" onclick="TFGest.cerrar(\'mUser\')">Listo</button></div>');
  }
  TFGest.crearUsuario=async function(){
    const email=$('#uEmail').value.trim().toLowerCase(),rol=$('#uRol').value,nombre=$('#uNombre').value.trim(),cli=rol==='cliente'?$('#uCli').value:null;
    if(!/^\S+@\S+\.\S+$/.test(email)){toast('Escribí un email válido');return}
    if(rol==='cliente'&&!cli){toast('Elegí a qué cliente corresponde');return}
    if(rol==='cliente'&&NUBE.state&&!NUBE.state.snap.clients.has(cli)){toast('Ese cliente todavía se está guardando. Probá en unos segundos.');return}
    const clave=claveProvisoria();$('#uGo').disabled=true;
    const r=await NUBE.sb.rpc('admin_create_user',{p_email:email,p_password:clave,p_role:rol,p_client_id:cli,p_full_name:nombre});
    if(r.error){$('#uGo').disabled=false;toast(r.error.message||'No se pudo crear');return}
    const c=cli?clientOf(cli):null;
    mostrarCredenciales('Cuenta creada',email,clave,c&&typeof phoneDigits==='function'?phoneDigits(c.phone):'');
    cargarUsuarios();
  };
  TFGest.resetClave=async function(uid){
    const u=(TFGest._users||[]).find(x=>x.user_id===uid);if(!u)return;
    const clave=claveProvisoria();
    const r=await NUBE.sb.rpc('admin_reset_password',{p_user:uid,p_password:clave});
    if(r.error){toast(r.error.message||'No se pudo cambiar');return}
    mostrarCredenciales('Contraseña nueva',u.email,clave,'');
  };
  TFGest.activar=async function(uid,si){
    const r=await NUBE.sb.from('profiles').update({active:!!si}).eq('user_id',uid).select('user_id');
    if(r.error||!r.data.length){toast((r.error&&r.error.message)||'No se pudo cambiar');return}
    toast(si?'Acceso habilitado':'Acceso quitado');cargarUsuarios();
  };

  /* ═════════════ CATÁLOGO ═════════════ */
  function renderCatalog(){
    const host=$('#tfCat');if(!host)return;
    const list=cat().filter(c=>c.active!==false).sort((a,b)=>(a.brand+a.model).localeCompare(b.brand+b.model));
    const head='<div class="section-head"><div><div class="section-title">Catálogo de modelos</div><div class="section-sub">Cargá una vez cada modelo que vende la agencia. En el alta de máquina se elige de acá y trae plantilla, intervalos y precios (igual se puede tipear a mano).</div></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="outline-btn" onclick="TFGest.precargarLovol()">Precargar Lovol</button><button class="solid-btn" onclick="TFGest.editarModelo()"><svg class="ic ic-xs"><use href="#i-plus"/></svg>Nuevo modelo</button></div></div>';
    if(!list.length){host.innerHTML=head+emptyHTML('#i-book','Todavía no hay modelos en el catálogo.');return}
    host.innerHTML=head+'<div class="tf-scroll"><table><thead><tr><th>Modelo</th><th>Plantilla</th><th>Service cada</th><th class="num">Precio venta</th><th class="num">Precio service</th><th></th></tr></thead><tbody>'+list.map(c=>
      '<tr><td><b>'+esc(c.brand)+' '+esc(c.model)+'</b></td><td>'+(c.serviceGroup&&SERVICE_GROUPS[c.serviceGroup]?esc(SERVICE_GROUPS[c.serviceGroup].name):'<span class="small">sin plantilla</span>')+'</td>'+
      '<td>'+(c.intervalH?nf(c.intervalH)+' h':'—')+(c.intervalM?' / '+c.intervalM+' meses':'')+'</td><td class="num">'+(c.salePrice?money(c.salePrice):'—')+'</td><td class="num">'+(c.servicePrice?money(c.servicePrice):'—')+'</td>'+
      '<td style="text-align:right;white-space:nowrap"><button class="outline-btn" onclick="TFGest.editarModelo(\''+c.id+'\')">Editar</button> <button class="outline-btn" onclick="TFGest.quitarModelo(\''+c.id+'\')">Quitar</button></td></tr>').join('')+'</tbody></table></div>';
  }
  TFGest.editarModelo=function(id){
    const c=id?cat().find(x=>x.id===id):null;
    modal('mCat','<h3>'+(c?'Editar modelo':'Nuevo modelo')+'</h3><p>Lo que cargues acá se copia a cada máquina nueva de este modelo.</p><input type="hidden" id="catId" value="'+esc(c?c.id:'')+'">'+
      '<div class="form-row"><div><label>Marca</label><input class="field" id="catBrand" value="'+esc(c?c.brand:'')+'" placeholder="Lovol"></div><div><label>Modelo</label><input class="field" id="catModel" value="'+esc(c?c.model:'')+'" placeholder="TE254"></div></div>'+
      '<div style="margin-top:12px"><label>Plantilla de service</label><select class="field" id="catGroup"><option value="">— sin plantilla —</option>'+Object.keys(SERVICE_GROUPS).map(k=>'<option value="'+k+'"'+(c&&c.serviceGroup===k?' selected':'')+'>'+esc(SERVICE_GROUPS[k].name)+'</option>').join('')+'</select></div>'+
      '<div class="form-row" style="margin-top:12px"><div><label>Service cada (horas)</label><input class="field" id="catIntH" type="number" min="0" value="'+esc(c?c.intervalH:'500')+'"></div><div><label>O cada (meses)</label><input class="field" id="catIntM" type="number" min="0" value="'+esc(c?c.intervalM:'12')+'"></div></div>'+
      '<div class="form-row" style="margin-top:12px"><div><label>Precio de venta ($)</label><input class="field" id="catSale" type="number" min="0" value="'+esc(c?c.salePrice:'')+'"></div><div><label>Precio del service ($)</label><input class="field" id="catServ" type="number" min="0" value="'+esc(c?c.servicePrice:'')+'"></div></div>'+
      '<div class="modal-actions"><button class="outline-btn" onclick="TFGest.cerrar(\'mCat\')">Cancelar</button><button class="solid-btn" onclick="TFGest.guardarModelo()">Guardar</button></div>');
  };
  TFGest.guardarModelo=function(){
    const brand=$('#catBrand').value.trim(),model=$('#catModel').value.trim(),id=$('#catId').value;
    if(!brand||!model){toast('Marca y modelo son obligatorios');return}
    const dup=cat().find(x=>x.id!==id&&x.brand.toLowerCase()===brand.toLowerCase()&&x.model.toLowerCase()===model.toLowerCase());
    const data={brand,model,serviceGroup:$('#catGroup').value,intervalH:num($('#catIntH').value),intervalM:num($('#catIntM').value),salePrice:num($('#catSale').value),servicePrice:num($('#catServ').value),iconKey:iconGuess(brand,model)||'tractor',active:true};
    if(dup&&dup.active!==false){toast('Ese modelo ya está en el catálogo');return}
    if(dup)Object.assign(dup,data);                       /* estaba quitado: se recupera */
    else if(id)Object.assign(cat().find(x=>x.id===id),data);
    else cat().push(Object.assign({id:uid('k')},data));
    saveDb();cerrar('mCat');toast('Modelo guardado');renderCatalog();
  };
  TFGest.quitarModelo=function(id){const c=cat().find(x=>x.id===id);if(!c)return;c.active=false;saveDb();renderCatalog();toast('Quitado del catálogo (las máquinas ya cargadas no cambian)')};
  TFGest.precargarLovol=function(){
    let n=0;
    LOVOL_MODELS.forEach(f=>f.n.split(' · ').forEach(model=>{
      const ya=cat().find(x=>x.brand.toLowerCase()==='lovol'&&x.model.toLowerCase()===model.toLowerCase());
      if(ya){if(ya.active===false){ya.active=true;n++}return}
      cat().push({id:uid('k'),brand:'Lovol',model:model,serviceGroup:'lovol',intervalH:500,intervalM:12,salePrice:'',servicePrice:'',iconKey:'tractor',modelImg:f.k,active:true});n++}));
    if(n){saveDb();renderCatalog()}
    toast(n?n+' modelos Lovol agregados — completá los precios':'Los modelos Lovol ya estaban cargados');
  };
  TFGest.usarModelo=function(id){
    const c=cat().find(x=>x.id===id);if(!c)return;
    $('#maBrand').value=c.brand;$('#maModel').value=c.model;
    if($('#maGroup'))$('#maGroup').value=c.serviceGroup||'';
    if(c.intervalH!=='')$('#maIntH').value=c.intervalH;
    if(c.intervalM!=='')$('#maIntM').value=c.intervalM;
    if(c.salePrice!=='')$('#maSalePrice').value=c.salePrice;
    if(c.servicePrice!==''){$('#maServicePrice').value=c.servicePrice;if($('#maServiceTBD'))$('#maServiceTBD').checked=false}
    if($('#maIcon')&&c.iconKey)$('#maIcon').value=c.iconKey;
    if(c.modelImg&&$('#maModelImg')){try{APP.renderThumbs(c.modelImg)}catch(e){}}
  };

  /* ═════════════ REPUESTOS ═════════════ */
  function renderPartsPro(){
    const t=$('#partsTable');if(!t)return;
    const head='<div class="section-head" style="margin-bottom:10px"><div class="section-sub">Lo que se usa en una orden se descuenta solo de acá.</div><button class="solid-btn" onclick="TFGest.editarRepuesto()"><svg class="ic ic-xs"><use href="#i-plus"/></svg>Nuevo repuesto</button></div>';
    if(!db.parts.length){t.innerHTML=head+emptyHTML('#i-package','Todavía no hay repuestos cargados.');return}
    t.innerHTML=head+'<table><thead><tr><th>Ref.</th><th>Descripción</th><th>Stock</th><th>Mínimo</th><th class="num">Costo unit.</th><th>Estado</th><th></th></tr></thead><tbody>'+
      db.parts.map(p=>'<tr><td><b>'+esc(p.ref)+'</b></td><td>'+esc(p.name)+'</td>'+
      '<td><span class="stepper"><button onclick="APP.stockDelta(\''+p.id+'\',-1)">−</button><b style="min-width:30px;text-align:center">'+nf(p.stock)+'</b><button onclick="APP.stockDelta(\''+p.id+'\',1)">+</button></span></td>'+
      '<td>'+nf(p.min)+'</td><td class="num">'+(p.cost?money(p.cost):'—')+'</td><td>'+(p.stock<p.min?'<span class="badge bad">Reponer</span>':'<span class="badge ok">Correcto</span>')+'</td>'+
      '<td style="text-align:right"><button class="outline-btn" onclick="TFGest.editarRepuesto(\''+p.id+'\')">Editar</button></td></tr>').join('')+'</tbody></table>';
  }
  TFGest.editarRepuesto=function(id){
    const p=id?db.parts.find(x=>x.id===id):null;
    modal('mPart','<h3>'+(p?'Editar repuesto':'Nuevo repuesto')+'</h3><p>El costo se usa para calcular el margen de cada orden.</p><input type="hidden" id="ptId" value="'+esc(p?p.id:'')+'">'+
      '<div class="form-row"><div><label>Referencia</label><input class="field" id="ptRef" value="'+esc(p?p.ref:'')+'" placeholder="OF-2210"></div><div><label>Descripción</label><input class="field" id="ptName" value="'+esc(p?p.name:'')+'" placeholder="Filtro de aceite"></div></div>'+
      '<div class="form-row" style="margin-top:12px"><div><label>Stock</label><input class="field" id="ptStock" type="number" min="0" value="'+esc(p?p.stock:'0')+'"></div><div><label>Stock mínimo</label><input class="field" id="ptMin" type="number" min="0" value="'+esc(p?p.min:'0')+'"></div></div>'+
      '<div style="margin-top:12px"><label>Costo unitario ($)</label><input class="field" id="ptCost" type="number" min="0" value="'+esc(p&&p.cost?p.cost:'')+'" style="max-width:200px"></div>'+
      '<div class="modal-actions"><button class="outline-btn" onclick="TFGest.cerrar(\'mPart\')">Cancelar</button><button class="solid-btn" onclick="TFGest.guardarRepuesto()">Guardar</button></div>');
  };
  TFGest.guardarRepuesto=function(){
    const name=$('#ptName').value.trim(),id=$('#ptId').value;
    if(!name){toast('La descripción es obligatoria');return}
    const data={ref:$('#ptRef').value.trim(),name,stock:Math.max(0,Number($('#ptStock').value)||0),min:Math.max(0,Number($('#ptMin').value)||0),cost:Math.max(0,Number($('#ptCost').value)||0)};
    if(id)Object.assign(db.parts.find(x=>x.id===id),data);else db.parts.push(Object.assign({id:uid('p')},data));
    saveDb();cerrar('mPart');toast('Repuesto guardado');renderAll();
  };
  const usados=o=>(o.partsUsed=o.partsUsed||[]);
  TFGest.costoRepuestos=o=>(o.partsUsed||[]).reduce((s,x)=>s+(Number(x.qty)||0)*(Number(x.cost)||0),0);
  TFGest.usarRepuesto=function(otId,partId,qty){
    const o=db.ots.find(x=>x.id===otId),p=db.parts.find(x=>x.id===partId);qty=Number(qty);
    if(!o||!p){toast('Elegí un repuesto');return false}
    if(!(qty>0)){toast('Indicá la cantidad');return false}
    if(qty>p.stock){toast('No hay stock suficiente de '+p.name+': quedan '+nf(p.stock));return false}
    p.stock-=qty;
    const ya=usados(o).find(x=>x.partId===partId&&Number(x.cost||0)===Number(p.cost||0));
    if(ya)ya.qty=Number(ya.qty)+qty;else usados(o).push({partId:p.id,ref:p.ref||'',name:p.name,qty:qty,cost:Number(p.cost)||0});
    if(p.stock<p.min)pushNotif('admin','i-package','Stock bajo mínimo',p.name+' '+(p.ref||'')+' · quedan '+p.stock);
    saveDb();renderOtExtras(otId);return true;
  };
  TFGest.devolverRepuesto=function(otId,i){
    const o=db.ots.find(x=>x.id===otId);if(!o||!o.partsUsed||!o.partsUsed[i])return;
    const u=o.partsUsed.splice(i,1)[0],p=db.parts.find(x=>x.id===u.partId);
    if(p)p.stock+=Number(u.qty)||0;
    saveDb();renderOtExtras(otId);
  };

  /* ═════════════ FOTOS (antes / después) ═════════════ */
  const urls={};                               /* ruta → enlace temporal */
  async function ensureUrls(o){
    const faltan=(o.fotos||[]).map(f=>f.p).filter(p=>!urls[p]||urls[p].exp<Date.now());
    if(!faltan.length||!NUBE.on)return;
    try{const r=await NUBE.sb.storage.from('ot-fotos').createSignedUrls(faltan,3600);
      if(!r.error)r.data.forEach(d=>{if(d.signedUrl)urls[d.path]={u:d.signedUrl,exp:Date.now()+55*60000}})}catch(e){}
  }
  const urlDe=p=>(urls[p]&&urls[p].exp>Date.now())?urls[p].u:'';
  function achicar(file){
    return new Promise((ok,err)=>{const r=new FileReader();r.onerror=()=>err(new Error('lectura'));
      r.onload=()=>{const img=new Image();img.onerror=()=>err(new Error('imagen'));
        img.onload=()=>{const max=1400,k=Math.min(1,max/Math.max(img.width,img.height)),cv=document.createElement('canvas');
          cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
          cv.toBlob(b=>b?ok(b):err(new Error('compresión')),'image/jpeg',.72)};
        img.src=r.result};
      r.readAsDataURL(file)});
  }
  TFGest._subirFoto=async function(otId,tipo,blob){
    const o=db.ots.find(x=>x.id===otId);if(!o)return false;
    if(!NUBE.on){toast('Las fotos se guardan en la nube: ingresá con tu cuenta');return false}
    if(!NUBE.state.snap.ots.has(otId)){toast('La orden todavía se está guardando. Probá en unos segundos.');return false}
    if((o.fotos||[]).length>=12){toast('Máximo 12 fotos por orden');return false}
    const ruta=NUBE.prof.agency_id+'/'+otId+'/'+tipo+'-'+Date.now()+'.jpg';
    const r=await NUBE.sb.storage.from('ot-fotos').upload(ruta,blob,{contentType:'image/jpeg'});
    if(r.error){toast('No se pudo subir la foto'+(navigator.onLine===false?' (sin conexión)':''));return false}
    (o.fotos=o.fotos||[]).push({p:ruta,t:tipo,ts:Date.now()});
    saveDb();await ensureUrls(o);renderOtExtras(otId);return true;
  };
  TFGest.elegirFoto=function(otId,tipo){
    const i=document.createElement('input');i.type='file';i.accept='image/*';
    i.onchange=async()=>{const f=i.files[0];if(!f)return;toast('Subiendo foto…');
      try{const b=await achicar(f);if(await TFGest._subirFoto(otId,tipo,b))toast('Foto guardada ✓')}catch(e){toast('No se pudo leer esa imagen')}};
    i.click();
  };
  TFGest.borrarFoto=async function(otId,ruta){
    const o=db.ots.find(x=>x.id===otId);if(!o||!o.fotos)return;
    try{await NUBE.sb.storage.from('ot-fotos').remove([ruta])}catch(e){}
    o.fotos=o.fotos.filter(f=>f.p!==ruta);saveDb();renderOtExtras(otId);
  };
  TFGest.verFoto=function(ruta){const u=urlDe(ruta);if(u)window.open(u,'_blank','noopener')};

  /* Sección extra dentro del detalle de la orden: repuestos y fotos */
  function renderOtExtras(otId){
    const host=$('#oiExtras');if(!host)return;
    const o=db.ots.find(x=>x.id===otId);
    if(!o||!staff()||o.status==='anulada'||o.type==='Cita preventiva'&&o.status==='cita'){host.innerHTML='';return}
    const us=o.partsUsed||[],total=TFGest.costoRepuestos(o);
    let h='<div class="ex-sec"><div class="ex-h"><b>Repuestos usados</b>'+(us.length?'<span>Costo: '+money(total)+'</span>':'')+'</div>'+
      (us.length?us.map((u,i)=>'<div class="ex-row"><span><b>'+nf(u.qty)+' ×</b> '+esc(u.name)+(u.ref?' <small>'+esc(u.ref)+'</small>':'')+'</span><span>'+(u.cost?money(u.qty*u.cost):'')+' <button class="mini-btn" title="Quitar y devolver al stock" onclick="TFGest.devolverRepuesto(\''+o.id+'\','+i+')"><svg class="ic ic-xs"><use href="#i-x"/></svg></button></span></div>').join(''):'<div class="small">Ninguno todavía.</div>');
    if(db.parts.length)h+='<div class="ex-add"><select class="field" id="exPart">'+db.parts.map(p=>'<option value="'+esc(p.id)+'"'+(p.stock<=0?' disabled':'')+'>'+esc(p.name)+(p.ref?' · '+esc(p.ref):'')+' (hay '+nf(p.stock)+')</option>').join('')+'</select>'+
      '<input class="field" id="exQty" type="number" min="1" value="1" aria-label="Cantidad"><button class="outline-btn" onclick="TFGest.usarRepuesto(\''+o.id+'\',document.getElementById(\'exPart\').value,document.getElementById(\'exQty\').value)">Agregar</button></div>';
    else h+='<div class="small">Cargá repuestos en la sección Repuestos para poder usarlos acá.</div>';
    h+='</div><div class="ex-sec"><div class="ex-h"><b>Fotos</b><span>'+((o.fotos||[]).length)+' de 12</span></div>';
    ['antes','despues'].forEach(t=>{const fs=(o.fotos||[]).filter(f=>f.t===t);
      h+='<div class="ex-fotos"><div class="ex-ft">'+(t==='antes'?'Antes':'Después')+'</div>'+fs.map(f=>{const u=urlDe(f.p);
        return '<div class="ex-foto">'+(u?'<img src="'+u+'" alt="" onclick="TFGest.verFoto(\''+f.p+'\')">':'<div class="ex-ph">…</div>')+'<button title="Borrar foto" onclick="TFGest.borrarFoto(\''+o.id+'\',\''+f.p+'\')">×</button></div>'}).join('')+
        '<button class="ex-addf" onclick="TFGest.elegirFoto(\''+o.id+'\',\''+t+'\')"><svg class="ic"><use href="#i-image"/></svg><span>Agregar</span></button></div>'});
    h+=(NUBE.on?'':'<div class="small">Las fotos se guardan en la nube: hace falta ingresar con tu cuenta.</div>')+'</div>';
    host.innerHTML=h;
    if((o.fotos||[]).some(f=>!urlDe(f.p)))ensureUrls(o).then(()=>{if($('#oiOtId').value===otId&&(o.fotos||[]).some(f=>urlDe(f.p)))renderOtExtras(otId)});
  }
  TFGest._renderOtExtras=renderOtExtras;

  /* ═════════════ INFORME DE SERVICIO ═════════════ */
  buildReportHTML=function(ot){
    const m=machineOf(ot.machineId),c=m?clientOf(m.clientId):null,biz=(db.meta&&db.meta.biz)||{},b=(db.meta&&db.meta.brand)||{};
    const fecha=new Date(ot.closedAt||Date.now());
    const acento=(b.color&&/^#[0-9a-f]{6}$/i.test(b.color))?b.color:'#c9f464';
    const us=ot.partsUsed||[],fa=(ot.fotos||[]).filter(f=>f.t==='antes'&&urlDe(f.p)),fd=(ot.fotos||[]).filter(f=>f.t==='despues'&&urlDe(f.p));
    const fotos=(tit,l)=>l.length?'<div class="fcol"><h3>'+tit+'</h3><div class="fgrid">'+l.map(f=>'<img src="'+urlDe(f.p)+'" alt="">').join('')+'</div></div>':'';
    const hechas=(ot.tasks||[]).filter(t=>t.done).length;
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe '+esc(ot.id)+'</title><style>'+
      '*{box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#14231b;margin:0;padding:28px;font-size:12.5px;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
      '.wrap{max-width:720px;margin:0 auto}'+
      '.top{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:16px;border-bottom:3px solid #14402c}'+
      '.brand{display:flex;align-items:center;gap:12px}.brand img{height:54px;max-width:170px;object-fit:contain}'+
      '.brand b{display:block;font-size:17px;letter-spacing:-.01em}.brand span{display:block;font-size:11px;color:#5b6b61}'+
      '.doc{text-align:right}.doc small{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#5b6b61}'+
      '.doc b{display:block;font-size:20px;letter-spacing:-.02em}.doc span{font-size:11.5px;color:#5b6b61}'+
      '.chip{display:inline-block;background:'+acento+';color:#12331f;border-radius:999px;padding:3px 10px;font-size:10.5px;font-weight:700;margin-top:6px}'+
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}'+
      '.box{border:1px solid #dde5dd;border-radius:12px;padding:13px 15px;break-inside:avoid}'+
      'h3{margin:0 0 7px;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#2f7a52;font-weight:700}'+
      '.box b.big{font-size:14.5px}.kv{display:flex;justify-content:space-between;gap:10px;border-top:1px solid #edf1ed;padding:4px 0;font-size:12px}.kv:first-of-type{border-top:0}.kv span{color:#5b6b61}'+
      '.sec{margin-top:14px;border:1px solid #dde5dd;border-radius:12px;padding:14px 16px;break-inside:avoid}'+
      '.sec p{margin:0;font-size:13px;white-space:pre-wrap}'+
      '.tasks{columns:2;column-gap:22px;margin:0;padding:0;list-style:none}.tasks li{break-inside:avoid;padding:2px 0 2px 20px;position:relative}'+
      '.tasks li:before{content:"✓";position:absolute;left:0;color:#1c6b3a;font-weight:700}.tasks li.no:before{content:"○";color:#a33}.tasks li.no{color:#7a2b22}'+
      'table{width:100%;border-collapse:collapse}th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#5b6b61;text-align:left;padding:4px 6px}td{border-top:1px solid #edf1ed;padding:6px;font-size:12.5px}td.n,th.n{text-align:right;width:70px}'+
      '.fotos{display:grid;grid-template-columns:1fr 1fr;gap:14px}.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.fgrid img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;border:1px solid #dde5dd}'+
      '.firmas{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px;break-inside:avoid}'+
      '.firma{border-bottom:1.5px solid #9aa89f;height:104px;display:flex;align-items:flex-end;justify-content:center}.firma img{max-width:92%;max-height:96px;object-fit:contain}'+
      '.fl{font-size:11px;color:#5b6b61;text-align:center;margin-top:5px}'+
      '.foot{margin-top:26px;padding-top:10px;border-top:1px solid #dde5dd;color:#8a968e;font-size:10px;display:flex;justify-content:space-between;gap:10px}'+
      '@page{margin:12mm}@media print{body{padding:0}}'+
      '</style></head><body><div class="wrap">'+
      '<div class="top"><div class="brand">'+(b.logo?'<img src="'+b.logo+'" alt="">':'')+'<div><b>'+esc(biz.name||'Mi Empresa')+'</b><span>'+[biz.cif?'CUIT '+esc(biz.cif):'',biz.phone?esc(biz.phone):'',biz.city?esc(biz.city):''].filter(Boolean).join(' · ')+'</span></div></div>'+
      '<div class="doc"><small>Informe de servicio</small><b>'+esc(ot.id)+'</b><span>'+fmtTs(fecha.getTime())+'</span><br><span class="chip">'+esc(ot.type||'Servicio')+'</span></div></div>'+
      '<div class="grid">'+
      '<div class="box"><h3>Cliente</h3><b class="big">'+esc(c?c.name:'—')+'</b>'+(c&&c.cuit?'<div class="kv"><span>CUIT</span><b>'+esc(c.cuit)+'</b></div>':'')+(c&&c.contact?'<div class="kv"><span>Contacto</span><b>'+esc(c.contact)+'</b></div>':'')+(c&&c.phone?'<div class="kv"><span>Teléfono</span><b>'+esc(c.phone)+'</b></div>':'')+'</div>'+
      '<div class="box"><h3>Equipo</h3><b class="big">'+esc(m?mLabel(m):'—')+'</b>'+(m&&m.serial?'<div class="kv"><span>N.º de serie</span><b>'+esc(m.serial)+'</b></div>':'')+(m?'<div class="kv"><span>Horómetro al cierre</span><b>'+nf(m.hours)+' h</b></div>':'')+(m&&m.warrantyEnd?'<div class="kv"><span>Garantía hasta</span><b>'+fmtDate(m.warrantyEnd)+'</b></div>':'')+'</div>'+
      '</div>'+
      (ot.issue?'<div class="sec"><h3>Motivo del ingreso</h3><p>'+esc(ot.issue)+'</p></div>':'')+
      '<div class="sec"><h3>Trabajo realizado</h3><p>'+esc(ot.workDone||ot.issue||ot.type||'')+'</p>'+
        ((ot.tech||ot.responsable||ot.horasTrabajo)?'<div class="kv" style="margin-top:8px"><span>Técnico</span><b>'+esc(ot.responsable||ot.tech||'—')+'</b></div>'+(ot.horasTrabajo?'<div class="kv"><span>Horas de taller</span><b>'+nf(ot.horasTrabajo)+' h</b></div>':''):'')+
        (ot.materiales?'<div class="kv"><span>Materiales</span><b>'+esc(ot.materiales)+'</b></div>':'')+'</div>'+
      (ot.reportObs?'<div class="sec"><h3>Observaciones y recomendaciones</h3><p>'+esc(ot.reportObs)+'</p></div>':'')+
      (ot.tasks&&ot.tasks.length?'<div class="sec"><h3>Checklist · '+hechas+' de '+ot.tasks.length+' puntos</h3><ul class="tasks">'+ot.tasks.map(t=>'<li'+(t.done?'':' class="no"')+'>'+esc(t.t)+(t.done?'':' — no se realizó'+(t.why?': '+esc(t.why):''))+'</li>').join('')+'</ul></div>':'')+
      (us.length?'<div class="sec"><h3>Repuestos utilizados</h3><table><thead><tr><th>Referencia</th><th>Descripción</th><th class="n">Cantidad</th></tr></thead><tbody>'+us.map(u=>'<tr><td>'+esc(u.ref||'—')+'</td><td>'+esc(u.name)+'</td><td class="n">'+nf(u.qty)+'</td></tr>').join('')+'</tbody></table></div>':'')+
      ((fa.length||fd.length)?'<div class="sec"><div class="fotos">'+fotos('Antes',fa)+fotos('Después',fd)+'</div></div>':'')+
      '<div class="firmas"><div><div class="firma">'+(ot.signature?'<img src="'+ot.signature+'" alt="">':'')+'</div><div class="fl">Conformidad del cliente — '+esc(c?c.name:'')+'</div></div>'+
      '<div><div class="firma"></div><div class="fl">Por el taller — '+esc(ot.responsable||ot.tech||biz.name||'')+'</div></div></div>'+
      '<div class="foot"><span>Este informe deja constancia del trabajo realizado sobre el equipo indicado.</span><span>TerraFleet · '+fmtTs(Date.now())+'</span></div>'+
      '</div></body></html>';
  };

  /* ═════════════ Montaje y enganches ═════════════ */
  function mount(){
    const sg=document.querySelector('#settings .setgrid');
    if(sg)sg.insertAdjacentHTML('beforeend','<div class="card section-card"><div class="section-head"><div><div class="section-title">Cuenta y usuarios</div><div class="section-sub">Quién entra a la agencia y con qué permisos.</div></div></div><div id="tfUsers"></div></div>');
    const tp=$('#templates');
    if(tp)tp.insertAdjacentHTML('beforeend','<div class="card section-card" style="margin-top:16px" id="tfCat"></div>');
    const tk=$('#oiTasks');
    if(tk)tk.insertAdjacentHTML('afterend','<div id="oiExtras"></div>');
    const br=$('#maBrand');
    if(br){const row=br.closest('.form-row')||br.parentNode;row.insertAdjacentHTML('beforebegin','<div id="maCatBox" style="margin:0 0 12px;display:none"><label>Elegir del catálogo (opcional)</label><select class="field" id="maCat" onchange="TFGest.usarModelo(this.value)"></select></div>')}
  }
  const _rs=renderSettings;renderSettings=function(){_rs.apply(this,arguments);cargarUsuarios()};
  const _rt=renderTemplates;renderTemplates=function(){_rt.apply(this,arguments);renderCatalog()};
  renderParts=renderPartsPro;
  const _oi=APP.openOtInfo;APP.openOtInfo=function(id){_oi.apply(this,arguments);renderOtExtras(id)};
  const _om=APP.openMachineModal;APP.openMachineModal=function(id){
    _om.apply(this,arguments);
    const box=$('#maCatBox'),sel=$('#maCat');if(!box||!sel)return;
    const list=cat().filter(c=>c.active!==false);
    box.style.display=(list.length&&!id)?'block':'none';
    sel.innerHTML='<option value="">— tipear a mano —</option>'+list.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.brand+' '+c.model)+'</option>').join('');
  };
  /* el informe necesita los enlaces de las fotos antes de armarse */
  ['viewReport','openReport'].forEach(k=>{const orig=APP[k];APP[k]=function(otId){
    const o=db.ots.find(x=>x.id===otId),self=this,args=arguments;
    if(o&&(o.fotos||[]).some(f=>!urlDe(f.p))&&NUBE.on){ensureUrls(o).then(()=>orig.apply(self,args));return}
    return orig.apply(this,args)}});
  /* acceso directo: crear el usuario de un cliente desde su ficha */
  const _oc=APP.openClientModal;APP.openClientModal=function(id){
    _oc.apply(this,arguments);
    let b=document.getElementById('cliUserBtn');
    const acts=document.querySelector('#mClient .modal-actions');
    if(!b&&acts){b=el('<button class="outline-btn" id="cliUserBtn" style="margin-right:auto">Crear acceso al portal</button>');acts.insertBefore(b,acts.firstChild)}
    if(b){b.style.display=(id&&esAdmin())?'':'none';b.onclick=()=>{APP.closeModal('mClient');TFGest.nuevoUsuario(id)}}
  };
  mount();
})();
